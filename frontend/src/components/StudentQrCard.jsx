import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { buildStudentQrPayload } from '../utils/studentQr';
import { UNIVERSITY } from '../config/university';

export default function StudentQrCard({ student, onClose }) {
  const [dataUrl, setDataUrl] = useState('');
  const payload = buildStudentQrPayload(student.student_id);

  useEffect(() => {
    QRCode.toDataURL(payload, {
      width: 220,
      margin: 2,
      color: { dark: '#0f4d28', light: '#ffffff' },
    }).then(setDataUrl);
  }, [payload]);

  return (
    <div className="qr-card-overlay" onClick={onClose} role="presentation">
      <div className="qr-card print-area" onClick={(e) => e.stopPropagation()}>
        <div className="qr-card-header">
          <h3>{UNIVERSITY.name}</h3>
          <p>{UNIVERSITY.cafeteria}</p>
          <p className="qr-card-sub">{UNIVERSITY.institute}</p>
        </div>
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${student.student_id}`} className="qr-card-image" />
        ) : (
          <p>Generating QR…</p>
        )}
        <p className="qr-card-name">{student.name}</p>
        <p className="qr-card-id">{student.student_id}</p>
        <p className="qr-card-dept">{student.department}</p>
        <p className="qr-card-foot">Scan at cafeteria — one meal per period per day</p>
        <div className="flex-row no-print" style={{ marginTop: '1rem', justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print card
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
