'use client';

import { useEffect, useRef, useState } from 'react';

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

// 카메라로 QR을 읽는다. (브라우저 BarcodeDetector 사용: Android Chrome 등. 지원하지 않으면 샘플 스캔/직접 입력을 쓴다.)
export default function Scanner({ onScan, hint }: { onScan: (v: string) => void; hint: string }) {
  const vref = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');
  const done = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia) { setErr('이 브라우저에서는 카메라를 쓸 수 없어요. 아래 샘플 스캔이나 직접 입력을 쓰세요.'); return; }
    if (!Ctor) { setErr('이 브라우저는 QR 인식을 지원하지 않아요 (Android Chrome 권장). 아래 샘플 스캔이나 직접 입력을 쓰세요.'); return; }
    const det = new Ctor({ formats: ['qr_code'] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stop || !vref.current) { stream.getTracks().forEach(t => t.stop()); return; }
        vref.current.srcObject = stream;
        await vref.current.play();
        const loop = async () => {
          if (stop || done.current) return;
          try {
            const r = vref.current ? await det.detect(vref.current) : [];
            if (r[0]?.rawValue && !done.current) { done.current = true; onScan(r[0].rawValue); return; }
          } catch { /* 프레임 오류는 무시 */ }
          setTimeout(loop, 200);
        };
        loop();
      } catch {
        setErr('카메라 권한이 없거나 열 수 없어요. 브라우저 설정에서 카메라를 허용해 주세요.');
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pd-scan">
      <div className="pd-cam">
        <video ref={vref} playsInline muted />
        <div className="pd-frame" aria-hidden="true" />
        <p className="pd-hint">{hint}</p>
      </div>
      {err && <p className="pd-warn">{err}</p>}
      <form className="pd-man" onSubmit={e => { e.preventDefault(); if (manual.trim()) { done.current = true; onScan(manual.trim()); } }}>
        <input value={manual} onChange={e => setManual(e.target.value)} placeholder="QR 내용 직접 입력 (NURW|...)" />
        <button type="submit">입력</button>
      </form>
    </div>
  );
}
