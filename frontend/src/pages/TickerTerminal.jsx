import { useCallback, useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { parseStudentScan } from '../utils/studentQr';
import QrScanner from '../components/QrScanner';
import { UNIVERSITY } from '../config/university';

const OVERRIDE_REASONS = [
  { value: 'forgot_id', label: 'Student forgot ID card' },
  { value: 'barcode_failed', label: 'Barcode will not scan' },
  { value: 'damaged_card', label: 'Damaged / unreadable card' },
  { value: 'system_down', label: 'Scanner or system down' },
];

export default function TickerTerminal() {
  const [studentId, setStudentId] = useState('');
  const [mode, setMode] = useState('barcode');
  const [period, setPeriod] = useState(null);
  const [todayProgram, setTodayProgram] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [overrideReason, setOverrideReason] = useState('forgot_id');
  const inputRef = useRef(null);

  useEffect(() => {
    api('/meals/current-period').then(setPeriod).catch(() => {});
    api('/menus/today')
      .then(setTodayProgram)
      .catch(() => setTodayProgram(null));
  }, []);

  useEffect(() => {
    if (mode === 'barcode' || mode === 'manual') inputRef.current?.focus();
  }, [mode]);

  const verificationMethod = () => {
    if (mode === 'lookup') return 'manual_roster';
    if (mode === 'qr') return 'qr';
    if (mode === 'face') return 'face';
    if (mode === 'fingerprint') return 'fingerprint';
    if (mode === 'barcode') return 'barcode';
    return 'manual';
  };

  const runVerify = useCallback(async (rawInput, method, reason) => {
    const parsedId = parseStudentScan(rawInput);
    if (!parsedId) return;
    setStudentId(parsedId);
    setLoading(true);
    setMessage('');
    setVerifyResult(null);
    try {
      const endpoint = method === 'face' || method === 'fingerprint' ? '/meals/verify-biometric' : '/meals/verify';
      const result = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          student_id: parsedId,
          scan_data: rawInput,
          verification_method: method,
          biometric_type: method === 'face' || method === 'fingerprint' ? method : undefined,
          biometric_payload: method === 'face' || method === 'fingerprint' ? rawInput : undefined,
          override_reason: method === 'manual_roster' ? reason : undefined,
        }),
      });
      setVerifyResult(result);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStudents = async () => {
    if (lookupQuery.trim().length < 2) {
      setMessage('Type at least 2 characters (name or ID).');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const results = await api(`/students?search=${encodeURIComponent(lookupQuery.trim())}`);
      setLookupResults(results);
      if (results.length === 0) setMessage('No student found — check spelling or send to admin.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickStudent = (s) => {
    setLookupResults([]);
    const method = mode === 'lookup' ? 'manual_roster' : mode;
    runVerify(s.student_id, method, overrideReason);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!studentId.trim()) return;
    await runVerify(studentId.trim(), verificationMethod());
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (studentId.trim()) runVerify(studentId.trim(), 'barcode');
    }
  };

  const handleQrScan = useCallback(
    (decodedText) => {
      runVerify(decodedText, 'qr');
    },
    [runVerify]
  );

  const handleRecord = async () => {
    if (!verifyResult?.eligible) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await api('/meals/transaction', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId.trim(),
          meal_type: verifyResult.meal_type,
          verification_method: verificationMethod(),
          override_reason: mode === 'lookup' ? overrideReason : undefined,
        }),
      });
      const stockWarn = result.stockUpdates?.filter((s) => !s.ok);
      let stockNote = '';
      if (stockWarn?.length) {
        stockNote = ` Warning: low stock — ${stockWarn.map((s) => s.item_name).join(', ')}.`;
      } else if (result.stockUpdates?.length) {
        stockNote = ` Inventory updated.`;
      }
      setMessage(result.message + stockNote);
      setVerifyResult(null);
      setStudentId('');
      setLookupQuery('');
      inputRef.current?.focus();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticker-terminal">
      <div className="page-header">
        <h2>Ticker Terminal</h2>
        <p>
          JIT ID barcode, QR, manual ID, or roster lookup — {UNIVERSITY.name}
          {period?.meal_type && (
            <> · <strong>{period.meal_type}</strong> ({period.service_window})</>
          )}
        </p>
      </div>

      <div className="card help-card" style={{ marginBottom: '1rem' }}>
        <h3>When things go wrong</h3>
        <ul className="help-list">
          <li>
            <strong>Barcode not working?</strong> Use Manual ID, or <strong>Forgot ID / lookup</strong> to
            search by name.
          </li>
          <li>
            <strong>Student forgot card?</strong> Use <strong>Forgot ID / lookup</strong>, confirm identity,
            select student, record reason.
          </li>
          <li>
            <strong>Bad supplier delivery?</strong> Manager rejects in Quality Inspection — injera must be
            counted; sauce materials checked before stock is added.
          </li>
        </ul>
      </div>

      {!period?.is_service_hours && (
        <div className="alert alert-info">
          Outside official meal hours. Breakfast 6–11, Lunch 11–16, Dinner 16–20.
        </div>
      )}

      {todayProgram?.meals?.length > 0 && (
        <div className="card today-program-card meal-program-card">
          <h3>Today — {todayProgram.day_en}</h3>
          <ul className="meal-program-list">
            {todayProgram.meals.map((m) => (
              <li key={m.meal_type}>
                <span className="meal-label">{m.meal_label_am}</span>
                <span className="meal-items">{m.items?.join(' + ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="terminal-mode-tabs no-print">
        <button
          type="button"
          className={`btn ${mode === 'barcode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('barcode')}
        >
          Barcode
        </button>
        <button
          type="button"
          className={`btn ${mode === 'qr' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('qr')}
        >
          QR
        </button>
        <button
          type="button"
          className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('manual')}
        >
          Manual ID
        </button>
        <button
          type="button"
          className={`btn ${mode === 'face' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('face')}
        >
          Face
        </button>
        <button
          type="button"
          className={`btn ${mode === 'fingerprint' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('fingerprint')}
        >
          Fingerprint
        </button>
        <button
          type="button"
          className={`btn ${mode === 'lookup' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('lookup')}
        >
          Forgot ID / lookup
        </button>
      </div>

      <div className="card">
        {mode === 'qr' && <QrScanner onScan={handleQrScan} active={!loading} />}

        {(mode === 'face' || mode === 'fingerprint') && (
          <div>
            <div className="form-group">
              <label>Biometric lookup ({mode})</label>
              <p className="qr-scanner-hint">
                Use external {mode} hardware to identify the student. This interface simulates a matched student using roster selection. The student must have {mode} enrollment in their profile.
              </p>
              <div className="flex-row">
                <input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search student by name or ID"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
                />
                <button type="button" className="btn btn-primary" onClick={searchStudents} disabled={loading}>
                  Search
                </button>
              </div>
            </div>
            {lookupResults.length > 0 && (
              <ul className="lookup-results">
                {lookupResults.map((s) => (
                  <li key={s._id}>
                    <button
                      type="button"
                      className="btn btn-secondary lookup-pick"
                      onClick={() => pickStudent(s)}
                    >
                      <strong>{s.name}</strong> — {s.student_id} ({s.department})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {mode === 'lookup' && (
          <div>
            <div className="form-group">
              <label>Reason (required for audit)</label>
              <select value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}>
                {OVERRIDE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Search student by name or ID</label>
              <div className="flex-row">
                <input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. Petros or RU0830"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
                />
                <button type="button" className="btn btn-primary" onClick={searchStudents} disabled={loading}>
                  Search
                </button>
              </div>
            </div>
            {lookupResults.length > 0 && (
              <ul className="lookup-results">
                {lookupResults.map((s) => (
                  <li key={s._id}>
                    <button type="button" className="btn btn-secondary lookup-pick" onClick={() => pickStudent(s)}>
                      <strong>{s.name}</strong> — {s.student_id} ({s.department})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(mode === 'barcode' || mode === 'manual') && (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>
                {mode === 'barcode' ? 'Scan JIT ID barcode' : 'Type student ID'}
              </label>
              <input
                ref={inputRef}
                className="scan-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                onKeyDown={mode === 'barcode' ? handleBarcodeKeyDown : undefined}
                placeholder="RU0830/16"
                autoComplete="off"
              />
              {mode === 'barcode' && (
                <p className="qr-scanner-hint">
                  Scanner not working? Switch to <strong>Manual ID</strong> or <strong>Forgot ID / lookup</strong>.
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Verify eligibility
            </button>
          </form>
        )}

        {studentId && mode !== 'lookup' && (
          <p className="qr-last-scan">
            Active ID: <strong>{studentId}</strong>
          </p>
        )}

        {verifyResult && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="digital-id-card-wrap">
              <div className={`digital-id-card ${verifyResult.eligible ? 'granted' : 'denied'}`}>
                {verifyResult.student ? (
                  <>
                    <div className="id-card-header">
                      <div className="logo-text">
                        <h3>JIMMA UNIVERSITY</h3>
                        <p>Institute of Technology (JiT)</p>
                      </div>
                      <span className="logo-badge">STUDENT ID</span>
                    </div>

                    <div className="id-card-body">
                      <div className="id-card-photo-wrap">
                        <img
                          className="id-card-photo"
                          src={verifyResult.student.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={verifyResult.student.name}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="id-card-info">
                        <h4>{verifyResult.student.name}</h4>
                        <div className="id-card-row">
                          Dept: <strong>{verifyResult.student.department}</strong>
                        </div>
                        <div className="id-card-row">
                          Prog: <strong>{verifyResult.student.program || 'BSc'}</strong> · Year: <strong>{verifyResult.student.year || 4}</strong>
                        </div>
                        <div>
                          <span className="id-card-id">{verifyResult.student.student_id}</span>
                        </div>

                        {(verifyResult.student.is_intern || verifyResult.student.is_non_cafe) && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                            {verifyResult.student.is_intern && <span className="badge badge-warning">Intern Blocked</span>}
                            {verifyResult.student.is_non_cafe && <span className="badge badge-danger">Non-Cafe</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="id-card-footer">
                      <div className="id-barcode-mock"></div>
                      <div className="id-status-stamp">
                        {verifyResult.eligible ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>ID NOT FOUND</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{verifyResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {verifyResult.message && (
              <div className={`alert ${verifyResult.eligible ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1.25rem', justifyContent: 'center' }}>
                <strong>{verifyResult.eligible ? '✔' : '❌'} {verifyResult.message}</strong>
              </div>
            )}

            {verifyResult.eligible && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRecord}
                  disabled={loading}
                  style={{ fontSize: '1.15rem', padding: '0.85rem 2.5rem', width: '100%' }}
                >
                  Record Meal ({verifyResult.meal_type})
                </button>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'} mt-1`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
