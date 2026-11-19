'use client';

import { useEffect, useState } from 'react';

// 브라우저 기본 alert/confirm 대신 쓰는 안내 문구와 확인 창.
// notify(msg): 잠시 떴다 사라지는 안내. confirmDialog(msg): 확인/취소 창(Promise<boolean>).
type Confirm = { msg: string; resolve: (v: boolean) => void };
type Listener = { toast: (m: string) => void; confirm: (c: Confirm) => void };

let listener: Listener | null = null;

export function notify(msg: string) {
  if (listener) listener.toast(String(msg));
}

export function confirmDialog(msg: string): Promise<boolean> {
  return new Promise(resolve => {
    if (!listener) {
      resolve(typeof window !== 'undefined' ? window.confirm(msg) : false);
      return;
    }
    listener.confirm({ msg, resolve });
  });
}

export default function DialogHost() {
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [ask, setAsk] = useState<Confirm | null>(null);

  useEffect(() => {
    listener = {
      toast: m => setToast({ id: Date.now(), msg: m }),
      confirm: c => setAsk(c),
    };
    const nativeAlert = window.alert;
    window.alert = (m?: unknown) => notify(String(m ?? ''));
    return () => {
      listener = null;
      window.alert = nativeAlert;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const close = (v: boolean) => {
    ask?.resolve(v);
    setAsk(null);
  };

  return (
    <>
      {toast && (
        <div className="dlg-toast" role="status" key={toast.id} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
      {ask && (
        <div className="dlg-ov" onClick={() => close(false)}>
          <div className="dlg-box" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p>{ask.msg}</p>
            <div className="dlg-acts">
              <button type="button" onClick={() => close(false)}>취소</button>
              <button type="button" className="ok" autoFocus onClick={() => close(true)}>확인</button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .dlg-toast { position: fixed; left: 16px; right: 16px; bottom: calc(var(--bnav-h, 0px) + 24px); z-index: 5000; max-width: 480px; margin: 0 auto; padding: 12px 16px; border-radius: 12px; background: #1F2937; color: #fff; font-size: 14px; line-height: 1.5; white-space: pre-wrap; box-shadow: 0 6px 20px rgba(0,0,0,.25); animation: dlgin .18s ease-out; }
        .dlg-ov { position: fixed; inset: 0; z-index: 5001; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .dlg-box { width: 100%; max-width: 340px; background: var(--white); color: var(--text); border-radius: 16px; padding: 20px 18px 14px; }
        .dlg-box p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
        .dlg-acts { display: flex; gap: 8px; }
        .dlg-acts button { flex: 1; border: 0; border-radius: 10px; padding: 12px 0; font: inherit; font-size: 14.5px; font-weight: 700; cursor: pointer; background: rgba(127,127,127,.16); color: var(--sub-text); }
        .dlg-acts button.ok { background: var(--primary); color: #fff; }
        @keyframes dlgin { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </>
  );
}
