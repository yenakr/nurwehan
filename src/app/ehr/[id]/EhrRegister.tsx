'use client';

import { useState } from 'react';
import { ALLERGIES, DEPTS, DOCTORS } from '../directory';

// 신환 등록: 기본정보를 한 번에 입력한다
export default function RegisterCard({ info, onRegister }: { info: Record<string, string>; onRegister: (patch: Record<string, string>) => void }) {
  const er = info.ward === '응급실';
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [dept, setDept] = useState(info.dept || (er ? 'ER' : ''));
  const [doctor, setDoctor] = useState('');
  const [dx, setDx] = useState('');
  const [cc, setCc] = useState('');
  const [allergy, setAllergy] = useState('무');
  const [route, setRoute] = useState(er ? '응급실' : '외래');
  const ok = name.trim() && age.trim() && sex && dx.trim();
  const docs = DOCTORS.filter(d => !dept || d.dept === dept);

  const go = () => {
    if (!ok) return;
    onRegister({
      name: name.trim(), ageSex: `${age.trim()}/${sex}`, dept, doctor, dx: dx.trim(), cc: cc.trim(), allergy, route,
      ...(info.admit ? {} : { admit: new Date().toISOString().slice(0, 10) }),
    });
  };

  return (
    <div className="reg">
      <style>{`
        .reg { border: 1px solid var(--primary); border-radius: 10px; padding: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
        .reg h4 { margin: 0; font-size: 15px; }
        .reg .gr { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .reg label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--sub-text); }
        .reg input, .reg select { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font: inherit; font-size: 14px; background: transparent; color: var(--text, inherit); min-width: 0; }
        .reg .sx { display: flex; gap: 6px; }
        .reg .sx button { flex: 1; border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 8px; padding: 8px; font: inherit; cursor: pointer; }
        .reg .sx button.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .reg .go { align-self: flex-end; border: 0; background: var(--primary); color: #fff; border-radius: 999px; padding: 9px 26px; font: inherit; font-weight: 700; cursor: pointer; }
        .reg .go:disabled { opacity: .4; cursor: default; }
      `}</style>
      <h4>{er ? '응급 환자 등록' : info.ward === '외래' ? '외래 환자 등록' : '신환 등록'}</h4>
      <div className="gr">
        <label>이름<input value={name} onChange={e => setName(e.target.value)} maxLength={20} /></label>
        <label>나이<input value={age} onChange={e => setAge(e.target.value)} placeholder="예: 72, 8M" maxLength={6} /></label>
        <label>성별<div className="sx">{(['M', 'F'] as const).map(s => <button key={s} type="button" className={sex === s ? 'on' : ''} onClick={() => setSex(s)}>{s === 'M' ? '남' : '여'}</button>)}</div></label>
        <label>진료과<select value={dept} onChange={e => { setDept(e.target.value); setDoctor(''); }}><option value="" />{DEPTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}</select></label>
        <label>주치의<select value={doctor} onChange={e => setDoctor(e.target.value)}><option value="" />{docs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</select></label>
        <label>알레르기<select value={allergy} onChange={e => setAllergy(e.target.value)}>{ALLERGIES.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
        <label>입원 경로<select value={route} onChange={e => setRoute(e.target.value)}>{['외래', '응급실', '전원', '기타'].map(r => <option key={r} value={r}>{r}</option>)}</select></label>
      </div>
      <div className="gr">
        <label>진단명<input value={dx} onChange={e => setDx(e.target.value)} maxLength={100} /></label>
        <label>주호소<input value={cc} onChange={e => setCc(e.target.value)} maxLength={100} /></label>
      </div>
      <button type="button" className="go" disabled={!ok} onClick={go}>등록</button>
    </div>
  );
}
