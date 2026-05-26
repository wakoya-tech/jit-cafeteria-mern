import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onScan, active = true }) {
  const scannerRef = useRef(null);
  const lastScanRef = useRef('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return undefined;

    const scanner = new Html5QrcodeScanner(
      'ju-qr-reader',
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
      },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (decodedText === lastScanRef.current) return;
        lastScanRef.current = decodedText;
        onScanRef.current(decodedText);
        setTimeout(() => {
          lastScanRef.current = '';
        }, 2500);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [active]);

  return (
    <div className="qr-scanner-wrap">
      <div id="ju-qr-reader" />
      <p className="qr-scanner-hint">Point the camera at the student&apos;s Jimma University meal QR card</p>
    </div>
  );
}
