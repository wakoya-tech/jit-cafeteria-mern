/** Jimma University cafeteria — student ID QR payload (JU|STUDENT_ID) */

const JU_PREFIX = /^JU[:|]\s*/i;

export function buildStudentQrPayload(studentId) {
  const id = (studentId || '').toUpperCase().trim();
  return `JU|${id}`;
}

/**
 * Resolve student ID from QR scan, manual entry, or legacy barcode text.
 */
export function parseStudentScan(raw) {
  const text = (raw || '').trim();
  if (!text) return '';

  if (text.startsWith('{')) {
    try {
      const data = JSON.parse(text);
      const id = data.student_id || data.id || data.studentId;
      if (id) return String(id).toUpperCase().trim();
    } catch {
      /* not JSON */
    }
  }

  const juMatch = text.match(/^JU[:|]\s*(.+)$/i);
  if (juMatch) return juMatch[1].toUpperCase().trim();

  try {
    const url = new URL(text);
    const fromQuery =
      url.searchParams.get('student_id') ||
      url.searchParams.get('id') ||
      url.searchParams.get('sid');
    if (fromQuery) return fromQuery.toUpperCase().trim();
    const pathMatch = url.pathname.match(/\/student\/([^/]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]).toUpperCase().trim();
  } catch {
    /* plain text */
  }

  if (JU_PREFIX.test(text)) {
    return text.replace(JU_PREFIX, '').toUpperCase().trim();
  }

  return text.toUpperCase().trim();
}
