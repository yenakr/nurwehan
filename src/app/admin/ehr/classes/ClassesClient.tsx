'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { confirmDialog, notify } from '@/components/Dialog';
import type { EhrClass } from '@/lib/ehr-class';

type Stu = { id: string; name: string; studentId: string; grade: number };
type Form = { year: string; term: string; subject: string; grade: string; section: string; professor: string };
const EMPTY: Form = { year: String(new Date().getFullYear()), term: '2', subject: '', grade: '', section: '', professor: '' };

const inp: CSSProperties = { border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', font: 'inherit', background: 'transparent', color: 'inherit', minWidth: 0 };
const btn: CSSProperties = { border: 0, borderRadius: 999, padding: '8px 16px', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' };
const ghost: CSSProperties = { border: '1px solid var(--border)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'inherit', font: 'inherit', fontSize: 13, cursor: 'pointer' };

export default function ClassesClient({ classes, members, students }: { classes: EhrClass[]; members: { classId: string; userId: string }[]; students: Stu[] }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [mem, setMem] = useState(() => new Set(members.map(m => `${m.classId}|${m.userId}`)));
  const set = (k: keyof Form, v: string) => setF(x => ({ ...x, [k]: v }));

  const save = async () => {
    if (!f.year || !f.subject.trim()) { notify('년도와 과목명을 입력하세요.'); return; }
    const r = await fetch(editId ? `/api/admin/ehr/classes/${editId}` : '/api/admin/ehr/classes', { method: editId ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    if (!r.ok) { notify('저장하지 못했어요. 표가 만들어졌는지 확인하세요.'); return; }
    setF(EMPTY);
    setEditId(null);
    router.refresh();
  };
  const del = async (c: EhrClass) => {
    if (!(await confirmDialog(`${c.subject} ${c.grade}-${c.section} 분반을 삭제할까요? 학생 배정이 해제되고 이 분반의 가상환자는 비공개가 돼요.`))) return;
    const r = await fetch(`/api/admin/ehr/classes/${c.id}`, { method: 'DELETE' });
    if (r.ok) router.refresh(); else notify('삭제하지 못했어요.');
  };
  const toggle = async (cid: string, uid: string) => {
    const key = `${cid}|${uid}`;
    const on = !mem.has(key);
    const r = await fetch(`/api/admin/ehr/classes/${cid}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ member: uid, on }) });
    if (!r.ok) { notify('저장하지 못했어요.'); return; }
    setMem(s => { const n = new Set(s); if (on) n.add(key); else n.delete(key); return n; });
  };
  const shown = students.filter(s => !q.trim() || s.name.includes(q.trim()) || s.studentId.includes(q.trim()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input style={{ ...inp, width: 80 }} value={f.year} onChange={e => set('year', e.target.value.replace(/\D/g, ''))} placeholder="년도" inputMode="numeric" aria-label="년도" />
        <input style={{ ...inp, width: 70 }} value={f.term} onChange={e => set('term', e.target.value)} placeholder="학기" aria-label="학기" />
        <input style={{ ...inp, flex: 1, minWidth: 140 }} value={f.subject} onChange={e => set('subject', e.target.value)} placeholder="과목명" aria-label="과목명" />
        <input style={{ ...inp, width: 64 }} value={f.grade} onChange={e => set('grade', e.target.value.replace(/\D/g, ''))} placeholder="학년" inputMode="numeric" aria-label="학년" />
        <input style={{ ...inp, width: 64 }} value={f.section} onChange={e => set('section', e.target.value)} placeholder="분반" aria-label="분반" />
        <input style={{ ...inp, width: 110 }} value={f.professor} onChange={e => set('professor', e.target.value)} placeholder="지도교수" aria-label="지도교수" />
        <button type="button" style={btn} onClick={save}>{editId ? '수정' : '분반 만들기'}</button>
        {editId && <button type="button" style={ghost} onClick={() => { setEditId(null); setF(EMPTY); }}>취소</button>}
      </div>
      {classes.length === 0 && <p style={{ textAlign: 'center', color: 'var(--sub-text)' }}>분반이 없어요.</p>}
      {classes.map(c => (
        <div key={c.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 180 }}>
              <b>{c.year}-{c.term} {c.subject}</b>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--sub-text)' }}>{c.grade}학년 {c.section}분반 · {c.professor} · 학생 {c.members}명</span>
            </span>
            <button type="button" style={ghost} onClick={() => setOpenId(openId === c.id ? null : c.id)}>학생</button>
            <button type="button" style={ghost} onClick={() => { setEditId(c.id); setF({ year: c.year, term: c.term, subject: c.subject, grade: c.grade, section: c.section, professor: c.professor }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>수정</button>
            <button type="button" style={ghost} onClick={() => del(c)}>삭제</button>
          </div>
          {openId === c.id && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={inp} value={q} onChange={e => setQ(e.target.value)} placeholder="이름 또는 학번 검색" aria-label="학생 검색" />
              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {shown.map(s => (
                  <label key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 2px', fontSize: 14 }}>
                    <input type="checkbox" checked={mem.has(`${c.id}|${s.id}`)} onChange={() => toggle(c.id, s.id)} />
                    {s.name} <span style={{ color: 'var(--sub-text)', fontSize: 13 }}>{s.studentId}{s.grade ? ` · ${s.grade}학년` : ''}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
