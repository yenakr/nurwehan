'use client';

import { Fragment, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { confirmDialog, notify } from '@/components/Dialog';

export type VRow = { id: string; classId: string | null; published: boolean; ptNo: string; name: string; ageSex: string; dept: string; ward: string; bed: string; dx: string; cc: string; doctor: string; allergy: string };
type Opt = { id: string; label: string };

const inp: CSSProperties = { border: '1px solid var(--border)', borderRadius: 8, padding: '7px 9px', font: 'inherit', background: 'transparent', color: 'inherit', minWidth: 0 };
const btn: CSSProperties = { border: 0, borderRadius: 999, padding: '8px 16px', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' };
const ghost: CSSProperties = { border: '1px solid var(--border)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'inherit', font: 'inherit', fontSize: 13, cursor: 'pointer' };
const th: CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--sub-text)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 };
const td: CSSProperties = { padding: '7px 8px', borderBottom: '1px solid var(--border)', fontSize: 13.5, whiteSpace: 'nowrap' };

const FIELDS: { k: keyof VRow; label: string }[] = [
  { k: 'name', label: '환자명' }, { k: 'ageSex', label: '나이/성별' }, { k: 'dept', label: '진료과 코드' }, { k: 'doctor', label: '주치의' },
  { k: 'ward', label: '병동' }, { k: 'bed', label: '병상' }, { k: 'dx', label: '진단명' }, { k: 'cc', label: '주호소' }, { k: 'allergy', label: '알레르기' },
];

export default function PatientsClient({ rows, classes, samples, mine }: { rows: VRow[]; classes: Opt[]; samples: { key: string; label: string }[]; mine: Opt[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<VRow>>({});
  const [from, setFrom] = useState('sample');
  const [key, setKey] = useState(samples[0]?.key || '');
  const [cls, setCls] = useState('');

  const call = async (url: string, method: string, body?: unknown) => {
    const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return r;
  };
  const publish = async (ids: string[], on: boolean) => {
    for (const id of ids) await call(`/api/admin/ehr/patients/${id}`, 'PATCH', { published: on });
    setSel(new Set());
    router.refresh();
  };
  const create = async () => {
    const r = await call('/api/admin/ehr/patients', 'POST', { from, key: from === 'blank' ? '' : from === 'case' ? key : key, classId: cls });
    if (r.ok) router.refresh();
    else notify(r.status === 422 ? '실제 정보로 보이는 번호가 있어요.' : '만들지 못했어요. 표가 만들어졌는지 확인하세요.');
  };
  const saveEdit = async (id: string) => {
    const info: Record<string, string> = {};
    for (const f of FIELDS) if (draft[f.k] !== undefined) info[f.k as string] = String(draft[f.k]);
    const r = await call(`/api/admin/ehr/patients/${id}`, 'PATCH', { info });
    if (r.ok) { setEdit(null); router.refresh(); } else notify('저장하지 못했어요.');
  };
  const del = async (v: VRow) => {
    if (!(await confirmDialog(`${v.name || '이 환자'}를 삭제할까요? 학생이 이미 열어 둔 차트는 그대로 남아요.`))) return;
    const r = await call(`/api/admin/ehr/patients/${v.id}`, 'DELETE');
    if (r.ok) router.refresh(); else notify('삭제하지 못했어요.');
  };
  const shown = rows.filter(v => !q.trim() || [v.id, v.ptNo, v.name].some(x => x.toLowerCase().includes(q.trim().toLowerCase())));
  const options = from === 'sample' ? samples.map(s => ({ id: s.key, label: s.label })) : from === 'case' ? mine : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <select style={inp} value={from} onChange={e => { setFrom(e.target.value); setKey(e.target.value === 'sample' ? samples[0]?.key || '' : e.target.value === 'case' ? mine[0]?.id || '' : ''); }} aria-label="만드는 방법">
          <option value="sample">예시 차트에서</option>
          <option value="case">내 차트에서</option>
          <option value="blank">빈 차트</option>
        </select>
        {from !== 'blank' && (
          <select style={{ ...inp, maxWidth: 260 }} value={key} onChange={e => setKey(e.target.value)} aria-label="원본">
            {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
        <select style={inp} value={cls} onChange={e => setCls(e.target.value)} aria-label="분반">
          <option value="">전체 학생</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button type="button" style={btn} onClick={create}>가상환자 추가</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, alignItems: 'center' }}>
          <b style={{ marginRight: 8 }}>총 {rows.length}명</b>
          <input style={{ ...inp, flex: 1, minWidth: 140 }} value={q} onChange={e => setQ(e.target.value)} placeholder="ID, 등록번호, 이름 검색" aria-label="검색" />
          <button type="button" style={ghost} disabled={sel.size === 0} onClick={() => publish([...sel], true)}>공개</button>
          <button type="button" style={ghost} disabled={sel.size === 0} onClick={() => publish([...sel], false)}>비공개</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th} /><th style={th}>ID</th><th style={th}>등록번호</th><th style={th}>환자명</th><th style={th}>나이/성별</th><th style={th}>진료과</th><th style={th}>병동</th><th style={th}>진단</th><th style={th}>분반</th><th style={th}>공개</th><th style={th} /></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={11} style={{ ...td, textAlign: 'center', color: 'var(--sub-text)' }}>가상환자가 없어요.</td></tr>}
              {shown.map(v => (
                <Fragment key={v.id}>
                  <tr>
                    <td style={td}><input type="checkbox" checked={sel.has(v.id)} onChange={() => setSel(s => { const n = new Set(s); if (n.has(v.id)) n.delete(v.id); else n.add(v.id); return n; })} aria-label="선택" /></td>
                    <td style={td}>{v.id.slice(0, 6)}</td><td style={td}>{v.ptNo}</td><td style={td}>{v.name}</td><td style={td}>{v.ageSex}</td><td style={td}>{v.dept}</td>
                    <td style={td}>{v.ward} {v.bed}</td><td style={{ ...td, whiteSpace: 'normal' }}>{v.dx}</td>
                    <td style={td}>
                      <select style={{ ...inp, maxWidth: 150 }} value={v.classId || ''} onChange={async e => { await call(`/api/admin/ehr/patients/${v.id}`, 'PATCH', { classId: e.target.value }); router.refresh(); }} aria-label="분반">
                        <option value="">전체 학생</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </td>
                    <td style={td}><button type="button" style={{ ...ghost, color: v.published ? '#2f7a46' : 'inherit', fontWeight: 700 }} onClick={() => publish([v.id], !v.published)}>{v.published ? 'O' : 'X'}</button></td>
                    <td style={td}>
                      <button type="button" style={ghost} onClick={() => { setEdit(edit === v.id ? null : v.id); setDraft({}); }}>수정</button>{' '}
                      <button type="button" style={ghost} onClick={() => del(v)}>삭제</button>
                    </td>
                  </tr>
                  {edit === v.id && (
                    <tr>
                      <td colSpan={11} style={{ ...td, whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {FIELDS.map(f => <input key={f.k} style={{ ...inp, width: f.k === 'dx' || f.k === 'cc' ? 200 : 110 }} defaultValue={String(v[f.k] ?? '')} placeholder={f.label} aria-label={f.label} onChange={e => setDraft(d => ({ ...d, [f.k]: e.target.value }))} />)}
                          <button type="button" style={btn} onClick={() => saveEdit(v.id)}>저장</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
