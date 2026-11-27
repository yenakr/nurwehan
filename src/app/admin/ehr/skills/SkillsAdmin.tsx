'use client';

import { Fragment, useState } from 'react';
import { SKILLS, SITES, bradenTotal, bradenRisk, type Cfg, type Drug } from '@/app/ehr/skills/scn';

type Row = { id: string; published: boolean; classId: string | null; skill: string; title: string; exam: boolean; assign: 'same' | 'random'; cfg: Cfg };
const AREA = ['감각 인지', '습기', '활동', '가동성', '영양', '마찰·전단력'];
const inp = { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'inherit', width: '100%' } as const;

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 3, fontSize: 12, color: 'var(--muted-foreground)' }}>{l}{children}</label>;
}

export default function SkillsAdmin({ rows: init, classes }: { rows: Row[]; classes: { id: string; label: string }[] }) {
  const [rows, setRows] = useState(init);
  const [msg, setMsg] = useState('');
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
  const drug = (r: Row, k: 'give' | 'bpDrug' | 'allergyDrug' | 'prnDrug', label: string) => {
    const d = r.cfg.med[k];
    const set = (p: Partial<Drug>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, med: { ...x.cfg.med, [k]: { ...x.cfg.med[k], ...p } } } }));
    return (
      <div key={k} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 6, alignItems: 'end' }}>
        <F l={`${label} · 처방명`}><input style={inp} value={d.name} onChange={e => set({ name: e.target.value })} /></F>
        <F l="기록 인정 단어(쉼표)"><input style={inp} value={d.alias} onChange={e => set({ alias: e.target.value })} /></F>
        <F l="용량"><input style={inp} value={d.dose} onChange={e => set({ dose: e.target.value })} /></F>
        <F l="단위"><input style={inp} value={d.unit} onChange={e => set({ unit: e.target.value })} /></F>
        <F l="경로"><input style={inp} value={d.route} onChange={e => set({ route: e.target.value })} /></F>
      </div>
    );
  };
  return (
    <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <b>새 시나리오</b> <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>(기본 시나리오를 복제해서 시작해요)</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {SKILLS.map(s => <button key={s.key} type="button" onClick={() => create(s.key)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'inherit', cursor: 'pointer' }}>+ {s.title}</button>)}
        </div>
        {msg && <p style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{msg}</p>}
      </div>
      {rows.length === 0 && <p style={{ color: 'var(--muted-foreground)' }}>만든 시나리오가 없어요.</p>}
      {rows.map(r => {
        const c = r.cfg;
        const setC = (p: Partial<Cfg>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, ...p } }));
        const setM = (p: Partial<Cfg['med']>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, med: { ...x.cfg.med, ...p } } }));
        const setV = (p: Partial<Cfg['vital']>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, vital: { ...x.cfg.vital, ...p } } }));
        const setB = (p: Partial<Cfg['braden']>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, braden: { ...x.cfg.braden, ...p } } }));
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
                  <option value="random">학생마다 랜덤 변형 (이름·수치·부위)</option>
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
            {r.skill === 'med' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 8 }}>
                  <F l="투약 직전 SBP"><input style={inp} value={c.med.sbp} onChange={e => setM({ sbp: e.target.value })} /></F>
                  <F l="DBP"><input style={inp} value={c.med.dbp} onChange={e => setM({ dbp: e.target.value })} /></F>
                  <F l="HR"><input style={inp} value={c.med.hr} onChange={e => setM({ hr: e.target.value })} /></F>
                  <F l="체온"><input style={inp} value={c.med.bt} onChange={e => setM({ bt: e.target.value })} /></F>
                  <F l="SBP 보류 기준(미만)"><input style={inp} value={c.med.holdBelow} onChange={e => setM({ holdBelow: e.target.value })} /></F>
                </div>
                {drug(r, 'give', '줄 약')}{drug(r, 'bpDrug', '혈압 보류 약')}{drug(r, 'allergyDrug', '알레르기 약')}{drug(r, 'prnDrug', 'PRN 약(주면 안 됨)')}
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>알레르기 약은 위 환자 알레르기 항목과 맞춰 주세요. 학생이 보류 사유를 기록에 쓰는지 채점해요.</p>
              </div>
            )}
            {r.skill === 'braden' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 8 }}>
                  {AREA.map((a, i) => (
                    <Fragment key={a}><F l={`${a} (1~${i === 5 ? 3 : 4})`}>
                      <select style={inp} value={c.braden.s[i]} onChange={e => setB({ s: c.braden.s.map((v, j) => (j === i ? Number(e.target.value) : v)) })}>
                        {Array.from({ length: i === 5 ? 3 : 4 }, (_, k) => <option key={k + 1} value={k + 1}>{k + 1}</option>)}
                      </select>
                    </F></Fragment>
                  ))}
                  <F l="발적/상처 부위"><select style={inp} value={c.braden.site} onChange={e => setB({ site: e.target.value })}>{SITES.map(s => <option key={s}>{s}</option>)}</select></F>
                  <F l="욕창 단계"><select style={inp} value={c.braden.stage} onChange={e => setB({ stage: e.target.value })}><option>1단계</option><option>2단계</option></select></F>
                  <F l="크기 (예: 3×2cm)"><input style={inp} value={c.braden.size} onChange={e => setB({ size: e.target.value })} /></F>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>합계 {bradenTotal(c.braden.s)}점 · {bradenRisk(bradenTotal(c.braden.s))}. 학생에게는 점수 대신 점수에 맞는 관찰 문장이 보여요.</p>
              </div>
            )}
            {r.skill === 'vital' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 8 }}>
                <F l="측정 시각 (HH:MM)"><input style={inp} value={c.vital.time} onChange={e => setV({ time: e.target.value })} /></F>
                <F l="SBP"><input style={inp} value={c.vital.sbp} onChange={e => setV({ sbp: e.target.value })} /></F>
                <F l="DBP"><input style={inp} value={c.vital.dbp} onChange={e => setV({ dbp: e.target.value })} /></F>
                <F l="HR"><input style={inp} value={c.vital.hr} onChange={e => setV({ hr: e.target.value })} /></F>
                <F l="RR"><input style={inp} value={c.vital.rr} onChange={e => setV({ rr: e.target.value })} /></F>
                <F l="체온"><input style={inp} value={c.vital.bt} onChange={e => setV({ bt: e.target.value })} /></F>
                <F l="SpO₂"><input style={inp} value={c.vital.spo2} onChange={e => setV({ spo2: e.target.value })} /></F>
                <F l="통증 NRS"><select style={inp} value={c.vital.pain} onChange={e => setV({ pain: e.target.value })}>{['0', '2', '4', '6', '8', '10'].map(x => <option key={x}>{x}</option>)}</select></F>
              </div>
            )}
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
