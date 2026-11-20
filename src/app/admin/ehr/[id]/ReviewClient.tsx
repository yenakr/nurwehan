'use client';

import { useState } from 'react';
import EhrSheet, { type EhrData, type EhrScenario } from '@/app/clinical/EhrSheet';
import { notify } from '@/components/Dialog';

export default function ReviewClient({ id, scenario, data, comment }: { id: string; scenario: EhrScenario; data: EhrData; comment: string }) {
  const [text, setText] = useState(comment);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/ehr/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ comment: text }) });
      notify(r.ok ? '저장했어요. 학생에게 확인 완료로 보여요.' : '저장하지 못했어요.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EhrSheet scenario={scenario} data={data} readOnly />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ fontSize: '0.875rem' }}>교수님 의견</b>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} maxLength={1500} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 10, padding: 10, font: 'inherit', background: 'transparent', color: 'inherit' }} />
        <button type="button" onClick={save} disabled={busy} style={{ alignSelf: 'flex-end', border: 0, borderRadius: 999, padding: '10px 20px', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>{busy ? '저장 중' : '저장'}</button>
      </div>
    </div>
  );
}
