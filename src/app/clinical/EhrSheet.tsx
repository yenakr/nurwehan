'use client';

import { useState, type ReactNode } from 'react';

type Vital = { id: string; t: string; sbp: string; dbp: string; hr: string; rr: string; bt: string; spo2: string };
export type EhrScenario = {
  patient: { age: string; sex: string; dx: string; cc: string; history: string; allergy: string; day: string };
  vitals: Omit<Vital, 'id'>[];
  io: { t: string; inn: string; out: string }[];
  orders: { drug: string; dose: string; route: string; freq: string }[];
  labs: { name: string; value: string; ref: string }[];
  situation: string;
};
export type EhrData = {
  vitals: Vital[];
  io: { id: string; t: string; inn: string; out: string }[];
  mar: Record<string, { done: boolean; t: string; note: string }>;
  notes: { id: string; t: string; fmt: 'N' | 'S' | 'D'; a: string; b: string; c: string; d: string }[];
  dx: { id: string; dx: string; goal: string; act: string; ev: string }[];
};

export const emptyData = (): EhrData => ({ vitals: [], io: [], mar: {}, notes: [], dx: [] });

const uid = () => Math.random().toString(36).slice(2, 10);
const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 성인 기준의 대략적인 정상 범위를 벗어나면 표시 (연습용 참고)
const abn = (k: keyof Vital, v: string) => {
  const n = Number(v);
  if (!v || Number.isNaN(n)) return false;
  switch (k) {
    case 'sbp': return n >= 140 || n < 90;
    case 'dbp': return n >= 90 || n < 60;
    case 'hr': return n > 100 || n < 60;
    case 'rr': return n > 20 || n < 12;
    case 'bt': return n >= 37.6 || n < 36.0;
    case 'spo2': return n < 95;
    default: return false;
  }
};

const VF: { k: keyof Vital; label: string; ph: string }[] = [
  { k: 'sbp', label: '수축기', ph: '120' },
  { k: 'dbp', label: '이완기', ph: '80' },
  { k: 'hr', label: '맥박', ph: '72' },
  { k: 'rr', label: '호흡', ph: '16' },
  { k: 'bt', label: '체온', ph: '36.5' },
  { k: 'spo2', label: 'SpO2', ph: '98' },
];

const FMT_LABEL = { N: '서술', S: 'SOAP', D: 'DAR' } as const;
const FIELDS: Record<'N' | 'S' | 'D', string[]> = {
  N: ['기록'],
  S: ['S 주관적 자료', 'O 객관적 자료', 'A 사정', 'P 계획'],
  D: ['D 자료', 'A 중재', 'R 반응'],
};
const KEYS = ['a', 'b', 'c', 'd'] as const;

const TABS = [
  { id: 'case', label: '사례' },
  { id: 'vs', label: '활력징후' },
  { id: 'io', label: 'I/O' },
  { id: 'mar', label: '투약' },
  { id: 'note', label: '간호기록' },
  { id: 'dx', label: '간호진단' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function EhrSheet({ scenario: sc, data, onChange, readOnly }: { scenario: EhrScenario; data: EhrData; onChange?: (d: EhrData) => void; readOnly?: boolean }) {
  const [tab, setTab] = useState<TabId>('case');
  const set = (p: Partial<EhrData>) => onChange?.({ ...data, ...p });
  const ro = !!readOnly;

  const cnt: Record<TabId, number> = {
    case: 0,
    vs: data.vitals.length,
    io: data.io.length,
    mar: Object.values(data.mar).filter(m => m.done).length,
    note: data.notes.length,
    dx: data.dx.length,
  };

  const sumIn = data.io.reduce((a, r) => a + (Number(r.inn) || 0), 0);
  const sumOut = data.io.reduce((a, r) => a + (Number(r.out) || 0), 0);

  const row = (children: ReactNode, onDel?: () => void) => (
    <div className="er">
      {children}
      {!ro && onDel && <button type="button" className="ed" aria-label="삭제" onClick={onDel}>&times;</button>}
    </div>
  );

  return (
    <div className="eh">
      <div className="et">
        {TABS.map(t => (
          <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}{cnt[t.id] > 0 && <i>{cnt[t.id]}</i>}
          </button>
        ))}
      </div>

      {tab === 'case' && (
        <div className="ec">
          <div className="pt">
            <b>{sc.patient.age}세 {sc.patient.sex}</b>
            <span>{sc.patient.dx}</span>
            {sc.patient.day && <span>{sc.patient.day}</span>}
          </div>
          <dl>
            <dt>주호소</dt><dd>{sc.patient.cc}</dd>
            <dt>경과</dt><dd>{sc.patient.history}</dd>
            <dt>알레르기</dt><dd>{sc.patient.allergy || '없음'}</dd>
          </dl>
          <h4>근무 중 상황</h4>
          <p className="sit">{sc.situation}</p>
          {sc.labs.length > 0 && (
            <>
              <h4>검사 결과</h4>
              <table className="lt"><tbody>{sc.labs.map((l, i) => <tr key={i}><td>{l.name}</td><td><b>{l.value}</b></td><td>{l.ref}</td></tr>)}</tbody></table>
            </>
          )}
          <p className="hint">위 사례를 보고 아래 탭에 기록해 보세요. 모두 가상 사례예요.</p>
        </div>
      )}

      {tab === 'vs' && (
        <div className="ec">
          {sc.vitals.length > 0 && (
            <details className="ref">
              <summary>측정 결과 보기</summary>
              <table className="lt"><thead><tr><th>시간</th><th>BP</th><th>HR</th><th>RR</th><th>BT</th><th>SpO2</th></tr></thead>
                <tbody>{sc.vitals.map((v, i) => <tr key={i}><td>{v.t}</td><td>{v.sbp}/{v.dbp}</td><td>{v.hr}</td><td>{v.rr}</td><td>{v.bt}</td><td>{v.spo2}</td></tr>)}</tbody></table>
            </details>
          )}
          {data.vitals.map((v, idx) => row(
            <div className="vg">
              <input type="time" value={v.t} disabled={ro} onChange={e => set({ vitals: data.vitals.map((x, j) => (j === idx ? { ...x, t: e.target.value } : x)) })} />
              {VF.map(f => (
                <label key={f.k} className={abn(f.k, v[f.k]) ? 'bad' : ''}>
                  <span>{f.label}</span>
                  <input inputMode="decimal" value={v[f.k]} placeholder={f.ph} disabled={ro} maxLength={5} onChange={e => set({ vitals: data.vitals.map((x, j) => (j === idx ? { ...x, [f.k]: e.target.value } : x)) })} />
                </label>
              ))}
            </div>,
            () => set({ vitals: data.vitals.filter((_, j) => j !== idx) }),
          ))}
          {!ro && <button type="button" className="add" onClick={() => set({ vitals: [...data.vitals, { id: uid(), t: nowHM(), sbp: '', dbp: '', hr: '', rr: '', bt: '', spo2: '' }] })}>활력징후 추가</button>}
          {ro && data.vitals.length === 0 && <p className="hint">입력한 내용이 없어요.</p>}
        </div>
      )}

      {tab === 'io' && (
        <div className="ec">
          {data.io.map((r, idx) => row(
            <div className="ig">
              <input type="time" value={r.t} disabled={ro} onChange={e => set({ io: data.io.map((x, j) => (j === idx ? { ...x, t: e.target.value } : x)) })} />
              <label><span>섭취 ml</span><input inputMode="numeric" value={r.inn} disabled={ro} maxLength={6} onChange={e => set({ io: data.io.map((x, j) => (j === idx ? { ...x, inn: e.target.value } : x)) })} /></label>
              <label><span>배설 ml</span><input inputMode="numeric" value={r.out} disabled={ro} maxLength={6} onChange={e => set({ io: data.io.map((x, j) => (j === idx ? { ...x, out: e.target.value } : x)) })} /></label>
            </div>,
            () => set({ io: data.io.filter((_, j) => j !== idx) }),
          ))}
          {!ro && <button type="button" className="add" onClick={() => set({ io: [...data.io, { id: uid(), t: nowHM(), inn: '', out: '' }] })}>I/O 추가</button>}
          {data.io.length > 0 && (
            <div className="sum"><span>섭취 {sumIn} ml</span><span>배설 {sumOut} ml</span><b>균형 {sumIn - sumOut > 0 ? '+' : ''}{sumIn - sumOut} ml</b></div>
          )}
          {ro && data.io.length === 0 && <p className="hint">입력한 내용이 없어요.</p>}
        </div>
      )}

      {tab === 'mar' && (
        <div className="ec">
          {sc.orders.map((o, i) => {
            const m = data.mar[String(i)] || { done: false, t: '', note: '' };
            const up = (p: Partial<typeof m>) => set({ mar: { ...data.mar, [String(i)]: { ...m, ...p } } });
            return (
              <div key={i} className={`mr ${m.done ? 'done' : ''}`}>
                <label className="mh">
                  <input type="checkbox" checked={m.done} disabled={ro} onChange={e => up({ done: e.target.checked, t: e.target.checked && !m.t ? nowHM() : m.t })} />
                  <span><b>{o.drug}</b> {o.dose} · {o.route} · {o.freq}</span>
                </label>
                {m.done && (
                  <div className="mb">
                    <input type="time" value={m.t} disabled={ro} onChange={e => up({ t: e.target.value })} />
                    <input value={m.note} disabled={ro} maxLength={200} placeholder="메모 (환자 확인, 반응 등)" onChange={e => up({ note: e.target.value })} />
                  </div>
                )}
              </div>
            );
          })}
          {sc.orders.length === 0 && <p className="hint">처방이 없는 사례예요.</p>}
          <p className="hint">투약 전 환자, 약, 용량, 경로, 시간을 확인하고 체크하세요.</p>
        </div>
      )}

      {tab === 'note' && (
        <div className="ec">
          {data.notes.map((n, idx) => {
            const up = (p: Partial<typeof n>) => set({ notes: data.notes.map((x, j) => (j === idx ? { ...x, ...p } : x)) });
            return (
              <div key={n.id} className="nb">
                <div className="nh">
                  <input type="time" value={n.t} disabled={ro} onChange={e => up({ t: e.target.value })} />
                  <div className="fm">
                    {(['N', 'S', 'D'] as const).map(f => (
                      <button key={f} type="button" disabled={ro} className={n.fmt === f ? 'on' : ''} onClick={() => up({ fmt: f })}>{FMT_LABEL[f]}</button>
                    ))}
                  </div>
                  {!ro && <button type="button" className="ed" aria-label="삭제" onClick={() => set({ notes: data.notes.filter((_, j) => j !== idx) })}>&times;</button>}
                </div>
                {FIELDS[n.fmt].map((label, k) => (
                  <label key={k} className="ta">
                    <span>{label}</span>
                    <textarea rows={n.fmt === 'N' ? 5 : 3} value={n[KEYS[k]]} disabled={ro} maxLength={800} onChange={e => up({ [KEYS[k]]: e.target.value })} />
                  </label>
                ))}
              </div>
            );
          })}
          {!ro && <button type="button" className="add" onClick={() => set({ notes: [...data.notes, { id: uid(), t: nowHM(), fmt: 'N', a: '', b: '', c: '', d: '' }] })}>간호기록 추가</button>}
          {!ro && <p className="hint">환자를 알아볼 수 있는 실제 정보는 쓰지 마세요.</p>}
          {ro && data.notes.length === 0 && <p className="hint">입력한 내용이 없어요.</p>}
        </div>
      )}

      {tab === 'dx' && (
        <div className="ec">
          {data.dx.map((d, idx) => {
            const up = (p: Partial<typeof d>) => set({ dx: data.dx.map((x, j) => (j === idx ? { ...x, ...p } : x)) });
            return (
              <div key={d.id} className="nb">
                <div className="nh"><b>간호진단 {idx + 1}</b>{!ro && <button type="button" className="ed" aria-label="삭제" onClick={() => set({ dx: data.dx.filter((_, j) => j !== idx) })}>&times;</button>}</div>
                <label className="ta"><span>간호진단</span><textarea rows={2} value={d.dx} disabled={ro} maxLength={200} onChange={e => up({ dx: e.target.value })} /></label>
                <label className="ta"><span>목표</span><textarea rows={2} value={d.goal} disabled={ro} maxLength={300} onChange={e => up({ goal: e.target.value })} /></label>
                <label className="ta"><span>중재</span><textarea rows={3} value={d.act} disabled={ro} maxLength={500} onChange={e => up({ act: e.target.value })} /></label>
                <label className="ta"><span>평가</span><textarea rows={2} value={d.ev} disabled={ro} maxLength={300} onChange={e => up({ ev: e.target.value })} /></label>
              </div>
            );
          })}
          {!ro && <button type="button" className="add" onClick={() => set({ dx: [...data.dx, { id: uid(), dx: '', goal: '', act: '', ev: '' }] })}>간호진단 추가</button>}
          {ro && data.dx.length === 0 && <p className="hint">입력한 내용이 없어요.</p>}
        </div>
      )}

      <style>{`
        .eh { display: flex; flex-direction: column; gap: 12px; }
        .et { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; background: rgba(127,127,127,.14); border-radius: 10px; padding: 3px; }
        .et::-webkit-scrollbar { display: none; }
        .et button { flex: 1 0 auto; border: 0; background: none; border-radius: 8px; padding: 7px 10px; font: inherit; font-size: 14px; font-weight: 600; color: var(--sub-text); cursor: pointer; white-space: nowrap; }
        .et button.on { background: var(--primary); color: #fff; }
        .et button i { font-style: normal; font-size: 11px; margin-left: 4px; opacity: .85; }
        .ec { display: flex; flex-direction: column; gap: 10px; }
        .ec h4 { margin: 6px 0 0; font-size: 13px; color: var(--sub-text); font-weight: 700; }
        .pt { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .pt b { font-size: 17px; color: var(--primary); }
        .pt span { font-size: 14px; color: var(--sub-text); }
        .ec dl { margin: 0; display: grid; grid-template-columns: 64px 1fr; gap: 6px 10px; font-size: 14px; }
        .ec dt { color: var(--sub-text); }
        .ec dd { margin: 0; }
        .sit { margin: 0; font-size: 14.5px; line-height: 1.7; }
        .hint { margin: 2px 0 0; font-size: 12.5px; color: var(--sub-text); }
        .lt { width: 100%; border-collapse: collapse; font-size: 13px; }
        .lt th, .lt td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
        .lt th { color: var(--sub-text); font-weight: 600; }
        .ref { background: color-mix(in srgb, var(--primary) 8%, transparent); border-radius: 10px; padding: 8px 12px; }
        .ref summary { cursor: pointer; font-size: 13px; font-weight: 700; color: var(--primary); }
        .er { display: flex; align-items: flex-start; gap: 6px; }
        .vg, .ig { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .ig { grid-template-columns: 1fr 1fr 1fr; }
        .vg > input[type=time], .ig > input[type=time] { grid-column: 1 / -1; }
        .eh label { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .eh label > span { font-size: 11.5px; color: var(--sub-text); }
        .eh input:not([type=checkbox]), .eh textarea { width: 100%; box-sizing: border-box; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: inherit; font: inherit; font-size: 14px; padding: 7px 2px; border-radius: 0; min-width: 0; }
        .eh input[type=time] { background: var(--tint); border: 0; border-radius: 10px; padding: 8px 12px; width: auto; }
        .eh textarea { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; resize: vertical; line-height: 1.55; }
        .eh label.bad input { color: #dc2626; font-weight: 700; border-bottom-color: #dc2626; }
        .ed { flex: 0 0 auto; width: 28px; height: 28px; border: 0; border-radius: 50%; background: var(--tint); color: var(--sub-text); font-size: 18px; line-height: 1; cursor: pointer; }
        .add { align-self: flex-start; border: 1px dashed var(--primary); background: none; color: var(--primary); border-radius: 999px; padding: 8px 16px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .sum { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13.5px; padding: 10px 12px; border-radius: 10px; background: var(--tint); }
        .sum b { color: var(--primary); margin-left: auto; }
        .mr { border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
        .mr.done { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 6%, transparent); }
        .mh { flex-direction: row !important; align-items: center; gap: 10px !important; cursor: pointer; font-size: 14px; }
        .mh input { width: 20px; height: 20px; flex: 0 0 auto; }
        .mb { display: flex; gap: 8px; margin-top: 8px; }
        .mb input[type=text], .mb input:not([type]) { flex: 1; }
        .nb { border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .nh { display: flex; align-items: center; gap: 8px; }
        .nh b { flex: 1; font-size: 14px; }
        .fm { display: flex; gap: 2px; margin-left: auto; background: rgba(127,127,127,.14); border-radius: 8px; padding: 2px; }
        .fm button { border: 0; background: none; border-radius: 6px; padding: 5px 10px; font: inherit; font-size: 12.5px; font-weight: 700; color: var(--sub-text); cursor: pointer; }
        .fm button.on { background: var(--primary); color: #fff; }
        .nh .fm + .ed { margin-left: 0; }
      `}</style>
    </div>
  );
}
