'use client';

import { useState } from 'react';
import { SKILLS, type Cfg, type Ord } from '@/app/ehr/skills/scn';

type Row = { id: string; published: boolean; classId: string | null; skill: string; title: string; exam: boolean; assign: 'same' | 'random'; cfg: Cfg };
const inp = { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'inherit', width: '100%' } as const;

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 3, fontSize: 12, color: 'var(--muted-foreground)' }}>{l}{children}</label>;
}

export default function SkillsAdmin({ rows: init, classes }: { rows: Row[]; classes: { id: string; label: string }[] }) {
  const [rows, setRows] = useState(init);
  const [msg, setMsg] = useState('');
  const [pick, setPick] = useState(SKILLS[0].key);
  const upd = (id: string, f: (r: Row) => Row) => setRows(rs => rs.map(r => (r.id === id ? f(r) : r)));
  const create = async (skill: string) => {
    const r = await fetch('/api/admin/ehr/skills', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ skill }) });
    if (r.ok) location.reload(); else setMsg('만들지 못했어요');
  };
  const save = async (r: Row) => {
    const res = await fetch(`/api/admin/ehr/skills/${r.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) });
    setMsg(res.ok ? '저장했어요' : '저장하지 못했어요');
  };
  const del = async (id: string) => {
    if (!confirm('이 시나리오를 지울까요? 학생이 이미 만든 연습 차트는 남아요.')) return;
    const res = await fetch(`/api/admin/ehr/skills/${id}`, { method: 'DELETE' });
    if (res.ok) setRows(rs => rs.filter(r => r.id !== id));
  };
  return (
    <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <b>새 시나리오</b> <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>(기본 시나리오를 복제해서 시작해요)</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <select style={{ ...inp, width: 'auto', minWidth: 260 }} value={pick} onChange={e => setPick(e.target.value)}>{SKILLS.map((s, i) => <option key={s.key} value={s.key}>{i + 1}. {s.title}</option>)}</select>
          <button type="button" onClick={() => create(pick)} style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>+ 시나리오 만들기</button>
        </div>
        {msg && <p style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{msg}</p>}
      </div>
      {rows.length === 0 && <p style={{ color: 'var(--muted-foreground)' }}>만든 시나리오가 없어요.</p>}
      {rows.map(r => {
        const c = r.cfg;
        const setC = (p: Partial<Cfg>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, ...p } }));
        const skTitle = SKILLS.find(s => s.key === r.skill)?.title;
        return (
          <div key={r.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: '#2563eb', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>{skTitle}</span>
              <input style={{ ...inp, flex: 1, minWidth: 160, fontWeight: 700 }} value={r.title} onChange={e => upd(r.id, x => ({ ...x, title: e.target.value }))} />
              <label style={{ display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={r.published} onChange={e => upd(r.id, x => ({ ...x, published: e.target.checked }))} />공개</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
              <F l="대상 분반">
                <select style={inp} value={r.classId || ''} onChange={e => upd(r.id, x => ({ ...x, classId: e.target.value || null }))}>
                  <option value="">전체 학생</option>{classes.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </F>
              <F l="환자 배정">
                <select style={inp} value={r.assign} onChange={e => upd(r.id, x => ({ ...x, assign: e.target.value as Row['assign'] }))}>
                  <option value="same">전원 동일 (이 설정 그대로)</option>
                  <option value="random">학생마다 랜덤 변형 (이름·나이·병상)</option>
                </select>
              </F>
              <F l="모드">
                <select style={inp} value={r.exam ? '1' : ''} onChange={e => upd(r.id, x => ({ ...x, exam: e.target.value === '1' }))}>
                  <option value="">연습 (체크리스트·AI 피드백 보임)</option>
                  <option value="1">시험 (체크리스트 숨김, 제출 시 채점)</option>
                </select>
              </F>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
              <F l="환자 이름"><input style={inp} value={c.name} onChange={e => setC({ name: e.target.value })} /></F>
              <F l="나이"><input style={inp} value={c.age} onChange={e => setC({ age: e.target.value })} /></F>
              <F l="성별"><select style={inp} value={c.sex} onChange={e => setC({ sex: e.target.value as 'M' | 'F' })}><option value="F">여</option><option value="M">남</option></select></F>
              <F l="병동"><input style={inp} value={c.ward} onChange={e => setC({ ward: e.target.value })} /></F>
              <F l="병상"><input style={inp} value={c.bed} onChange={e => setC({ bed: e.target.value })} /></F>
              <F l="진단"><input style={inp} value={c.dx} onChange={e => setC({ dx: e.target.value })} /></F>
              <F l="알레르기"><input style={inp} value={c.allergy} onChange={e => setC({ allergy: e.target.value })} /></F>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
              <F l="진료과"><input style={inp} value={c.dept} onChange={e => setC({ dept: e.target.value })} /></F>
              <F l="담당의"><input style={inp} value={c.doctor} onChange={e => setC({ doctor: e.target.value })} /></F>
              <F l="주호소"><input style={inp} value={c.cc} onChange={e => setC({ cc: e.target.value })} /></F>
              <F l="시작 시각 (HH:MM)"><input style={inp} value={c.clock} onChange={e => setC({ clock: e.target.value })} /></F>
              <F l="직전 활력징후 (혈압,맥박,호흡,체온,SpO2)"><input style={inp} placeholder="118/72,84,18,37.2,97" value={c.vit} onChange={e => setC({ vit: e.target.value })} /></F>
            </div>
            <F l="상황 (학생에게 보이는 안내)"><textarea style={{ ...inp, minHeight: 90, fontFamily: 'inherit' }} value={c.situation} onChange={e => setC({ situation: e.target.value })} /></F>
            <div style={{ display: 'grid', gap: 6 }}>
              <b style={{ fontSize: 13 }}>처방</b>
              {c.orders.map((x, k) => {
                const setO = (p: Partial<Ord>) => setC({ orders: c.orders.map((y, j) => (j === k ? { ...y, ...p } : y)) });
                return (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 0.8fr 0.8fr 1fr 1.4fr 2fr auto auto', gap: 4, alignItems: 'end' }}>
                    <F l="처방명"><input style={inp} value={x.name} onChange={e => setO({ name: e.target.value })} /></F>
                    <F l="용량"><input style={inp} value={x.dose} onChange={e => setO({ dose: e.target.value })} /></F>
                    <F l="단위"><input style={inp} value={x.unit} onChange={e => setO({ unit: e.target.value })} /></F>
                    <F l="경로"><input style={inp} value={x.route} onChange={e => setO({ route: e.target.value })} /></F>
                    <F l="횟수"><input style={inp} value={x.cnt} onChange={e => setO({ cnt: e.target.value })} /></F>
                    <F l="시간 (09:00/,17:00/)"><input style={inp} value={x.slots} onChange={e => setO({ slots: e.target.value })} /></F>
                    <F l="메모(조건)"><input style={inp} value={x.memo} onChange={e => setO({ memo: e.target.value })} /></F>
                    <label style={{ fontSize: 12, display: 'flex', gap: 3, alignItems: 'center', paddingBottom: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={x.prn} onChange={e => setO({ prn: e.target.checked })} />PRN</label>
                    <button type="button" aria-label="처방 삭제" onClick={() => setC({ orders: c.orders.filter((_, j) => j !== k) })} style={{ border: 0, background: 'none', color: '#dc2626', cursor: 'pointer', paddingBottom: 6 }}>×</button>
                  </div>
                );
              })}
              <div><button type="button" onClick={() => setC({ orders: [...c.orders, { name: '', dose: '', unit: '', route: '', cnt: '', slots: '', prn: false, memo: '' }] })} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'inherit', cursor: 'pointer' }}>+ 처방 추가</button></div>
            </div>
            <F l="평가 항목 (한 줄에 하나 · 교수 채점 참고용)"><textarea style={{ ...inp, minHeight: 90, fontFamily: 'inherit' }} value={c.checks.join('\n')} onChange={e => setC({ checks: e.target.value.split('\n') })} /></F>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => save(r)} style={{ padding: '8px 16px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>저장</button>
              <button type="button" onClick={() => del(r.id)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: '#dc2626', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
