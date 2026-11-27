'use client';

import { useState } from 'react';
import Link from 'next/link';
import AiMark from '@/components/AiMark';
import { scenarioOf, type Step } from './data';

type ScanLog = { k: 'pt' | 'med' | 'give'; t: string; ok: boolean };
type Score = { got: number; max: number; wrong: string[]; lines: { ok: boolean; t: string; sub?: string }[] };

export default function SkillRunner({ skillKey, ai, aiLeft }: { skillKey: string; ai: boolean; aiLeft: number }) {
  const sc = scenarioOf(skillKey)!;
  const [idx, setIdx] = useState(0);
  const [quiz, setQuiz] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [scan, setScan] = useState<ScanLog[]>([]);
  const [pick, setPick] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [fb, setFb] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [left, setLeft] = useState(aiLeft);

  const same = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x));
  const score = (s: Step, i: number): Score => {
    if (s.t === 'quiz') {
      const lines = s.quizzes.map(q => {
        const ok = same(quiz[`${i}.${q.id}`] || [], q.ans);
        return { ok, t: q.q, sub: q.why };
      });
      return { got: lines.filter(l => l.ok).length, max: lines.length, wrong: lines.filter(l => !l.ok).map(l => l.t), lines };
    }
    if (s.t === 'form') {
      const lines = s.fields.map(f => {
        const v = (form[`${i}.${f.id}`] || '').trim();
        return { ok: v === f.ans, t: `${f.label}: ${v || '미입력'}`, sub: v === f.ans ? undefined : `정답 ${f.ans}${f.unit ? ' ' + f.unit : ''}${f.why ? ' — ' + f.why : ''}` };
      });
      return { got: lines.filter(l => l.ok).length, max: lines.length, wrong: lines.filter(l => !l.ok).map(l => l.t), lines };
    }
    if (s.t === 'scan') {
      const ptFirst = scan[0]?.k === 'pt';
      const noBad = scan.length > 0 && !scan.some(l => !l.ok);
      const given = scan.some(l => l.k === 'give' && l.ok);
      const lines = [
        { ok: ptFirst, t: '환자 팔찌를 가장 먼저 스캔' },
        { ok: noBad, t: '잘못된 약·순서 없이 진행', sub: noBad ? undefined : s.why },
        { ok: given, t: '줄 수 있는 약만 투약 완료' },
      ];
      return { got: lines.filter(l => l.ok).length, max: 3, wrong: lines.filter(l => !l.ok).map(l => l.t), lines };
    }
    if (s.t === 'note') {
      const lines = s.rules.map(r => {
        const ok = r.test.every(t => t.test(note));
        return { ok, t: r.label, sub: ok ? undefined : r.tip };
      });
      return { got: lines.filter(l => l.ok).length, max: lines.length, wrong: lines.filter(l => !l.ok).map(l => `기록 누락: ${l.t}`), lines };
    }
    return { got: 0, max: 0, wrong: [], lines: [] };
  };

  const step = sc.steps[idx];
  const last = idx === sc.steps.length - 1;
  const checked = step.t === 'info' || !!done[idx];
  const all = sc.steps.map((s, i) => score(s, i));
  const total = all.reduce((a, b) => a + b.got, 0);
  const maxT = all.reduce((a, b) => a + b.max, 0);
  const finished = !!done[sc.steps.length - 1];

  const toggle = (k: string, id: string, multi: boolean) => {
    if (done[idx]) return;
    setQuiz(p => {
      const cur = p[k] || [];
      return { ...p, [k]: multi ? (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]) : [id] };
    });
  };
  const canCheck = () => {
    if (step.t === 'quiz') return step.quizzes.every(q => (quiz[`${idx}.${q.id}`] || []).length > 0);
    if (step.t === 'form') return step.fields.every(f => (form[`${idx}.${f.id}`] || '').trim());
    if (step.t === 'scan') return scan.some(l => l.k === 'give' && l.ok);
    if (step.t === 'note') return note.trim().length >= 10;
    return true;
  };
  const askAi = async () => {
    setFbBusy(true); setFb('');
    try {
      const wrong = all.flatMap((a, i) => (sc.steps[i].t === 'note' ? [] : a.wrong));
      const r = await fetch('/api/ehr/skills/grade', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: sc.key, note, wrong }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setFb(j.text); setLeft(j.left ?? 0); }
      else setFb(j.error === 'limit' ? '오늘 AI 피드백 횟수를 모두 썼어요.' : j.error === 'off' ? 'AI가 꺼져 있어요.' : '피드백을 가져오지 못했어요.');
    } catch { setFb('피드백을 가져오지 못했어요.'); }
    setFbBusy(false);
  };
  const reset = () => { setIdx(0); setQuiz({}); setForm({}); setScan([]); setPick(''); setNote(''); setDone({}); setFb(''); };

  const doScan = (k: 'pt' | 'med') => {
    if (done[idx] || step.t !== 'scan') return;
    if (k === 'pt') { setScan(p => [...p, { k: 'pt', t: '환자 팔찌 스캔', ok: true }]); return; }
    if (!pick) return;
    const hasPt = scan.some(l => l.k === 'pt');
    const nm = step.meds.find(m => m.id === pick)!.t;
    if (!hasPt) setScan(p => [...p, { k: 'med', t: `${nm} 스캔 — 환자 확인 전에 약을 스캔했어요`, ok: false }]);
    else if (pick !== step.good) setScan(p => [...p, { k: 'med', t: `${nm} 스캔 — 지금 투약하면 안 되는 약이에요(보류·확인 대상)`, ok: false }]);
    else setScan(p => [...p, { k: 'med', t: `${nm} 스캔 — 오더·환자 일치`, ok: true }]);
  };
  const giveOk = scan.length > 0 && scan[scan.length - 1].k === 'med' && scan[scan.length - 1].ok;

  return (
    <div className="sk">
      <style>{`
        .sk{font-size:14px}
        .sk .hd{background:var(--background);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
        .sk .hd b{font-size:16px}
        .sk .hd .pt{color:var(--muted-foreground);font-size:13px}
        .sk .al{margin-left:auto;background:#fde8e8;color:#b42318;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600}
        .sk .bar{display:flex;gap:4px;margin-bottom:12px}
        .sk .bar span{flex:1;height:6px;border-radius:3px;background:var(--border)}
        .sk .bar span.on{background:#2563eb}
        .sk .bar span.ok{background:#16a34a}
        .sk .card{background:var(--background);border:1px solid var(--border);border-radius:10px;padding:16px}
        .sk h2{margin:0 0 4px;font-size:16px}
        .sk .lead{margin:0 0 12px;color:var(--muted-foreground);font-size:13px}
        .sk table{width:100%;min-width:0 !important;border-collapse:collapse;margin:4px 0 14px;font-size:13px}
        .sk th,.sk td{border:1px solid var(--border);padding:6px 8px;text-align:left}
        .sk th{background:var(--muted-background)}
        .sk .cap{font-weight:600;font-size:13px;margin-top:8px}
        .sk .q{margin-bottom:14px}
        .sk .q p{margin:0 0 6px;font-weight:600}
        .sk .o{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:4px;cursor:pointer}
        .sk .o input{width:auto !important;margin:0}
        .sk .o.sel{border-color:#2563eb;background:#eff6ff}
        .sk .o.good{border-color:#16a34a;background:#f0fdf4}
        .sk .o.bad{border-color:#dc2626;background:#fef2f2}
        .sk .res{margin:8px 0 0;padding:8px 10px;border-radius:8px;font-size:13px}
        .sk .res.ok{background:#f0fdf4;color:#166534}
        .sk .res.no{background:#fef2f2;color:#991b1b}
        .sk .fg{display:grid;grid-template-columns:140px 1fr;gap:6px 10px;align-items:center;margin-bottom:6px}
        .sk .fg select,.sk .fg input{padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:inherit;width:100%;max-width:260px}
        .sk textarea{width:100%;min-height:150px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--background);color:inherit;font:inherit;resize:vertical}
        .sk .btn{padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--background);color:inherit;cursor:pointer;font-size:14px}
        .sk .btn.p{background:#2563eb;color:#fff;border-color:#2563eb}
        .sk .btn:disabled{opacity:.45;cursor:not-allowed}
        .sk .row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center}
        .sk .log{font-family:ui-monospace,monospace;font-size:12.5px;background:var(--muted-background);border-radius:8px;padding:8px 10px;min-height:60px;margin:10px 0}
        .sk .log .b{color:#b91c1c}
        .sk .log .g{color:#15803d}
        .sk .ck{list-style:none;padding:0;margin:8px 0}
        .sk .ck li{padding:4px 0;border-bottom:1px solid var(--border)}
        .sk .fb{white-space:pre-wrap;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;margin-top:10px;line-height:1.6}
        .sk .big{font-size:26px;font-weight:700}
        @media (prefers-color-scheme: dark){.sk .o.sel{background:#1e293b}.sk .o.good{background:#052e16}.sk .o.bad{background:#450a0a}.sk .res.ok{background:#052e16;color:#86efac}.sk .res.no{background:#450a0a;color:#fca5a5}.sk .fb{background:#1e1b4b;border-color:#4338ca}.sk .al{background:#450a0a;color:#fca5a5}}
      `}</style>
      <p style={{ margin: '0 0 8px' }}><Link href="/ehr/skills">← 핵심술기 목록</Link></p>
      <div className="hd">
        <b>{sc.title}</b>
        <span className="pt">{sc.patient.name} · {sc.patient.line} · {sc.patient.dx}</span>
        <span className="al">알레르기: {sc.patient.allergy}</span>
      </div>
      <div className="bar">{sc.steps.map((_, i) => <span key={i} className={done[i] || sc.steps[i].t === 'info' && i < idx ? 'ok' : i === idx ? 'on' : ''} />)}</div>

      <div className="card">
        <h2>{step.title}</h2>
        {'lead' in step && step.lead && <p className="lead">{step.lead}</p>}

        {step.t === 'info' && step.tables.map(t => (
          <div key={t.cap}>
            <div className="cap">{t.cap}</div>
            <table><thead><tr>{t.table.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{t.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
          </div>
        ))}

        {step.t === 'quiz' && step.quizzes.map(q => {
          const k = `${idx}.${q.id}`;
          const cur = quiz[k] || [];
          const ok = same(cur, q.ans);
          return (
            <div className="q" key={q.id}>
              <p>{q.q}{q.multi ? ' (복수 선택)' : ''}</p>
              {q.opts.map(o => {
                const sel = cur.includes(o.id);
                const cls = done[idx] ? (q.ans.includes(o.id) ? 'good' : sel ? 'bad' : '') : sel ? 'sel' : '';
                return (
                  <label key={o.id} className={`o ${cls}`}>
                    <input type={q.multi ? 'checkbox' : 'radio'} checked={sel} onChange={() => toggle(k, o.id, q.multi)} />{o.t}
                  </label>
                );
              })}
              {done[idx] && <div className={`res ${ok ? 'ok' : 'no'}`}>{ok ? '정답' : '다시 확인'} — {q.why}</div>}
            </div>
          );
        })}

        {step.t === 'form' && (
          <div>
            {step.fields.map(f => {
              const k = `${idx}.${f.id}`;
              const v = form[k] || '';
              const res = done[idx] ? (v.trim() === f.ans) : null;
              return (
                <div key={f.id}>
                  <div className="fg">
                    <label>{f.label}</label>
                    <div>
                      {f.opts ? (
                        <select value={v} disabled={!!done[idx]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}>
                          <option value="">선택</option>{f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={v} inputMode="decimal" disabled={!!done[idx]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={f.unit || ''} />
                      )}
                      {res !== null && <span style={{ marginLeft: 8, color: res ? '#16a34a' : '#dc2626' }}>{res ? '✓' : `✗ 정답 ${f.ans}`}</span>}
                    </div>
                  </div>
                  {res === false && f.why && <div className="res no" style={{ margin: '0 0 8px' }}>{f.why}</div>}
                </div>
              );
            })}
          </div>
        )}

        {step.t === 'scan' && (
          <div>
            <div className="row" style={{ marginTop: 0 }}>
              <button className="btn" type="button" disabled={!!done[idx]} onClick={() => doScan('pt')}>① 환자 팔찌 스캔</button>
            </div>
            <div className="row">
              <select value={pick} disabled={!!done[idx]} onChange={e => setPick(e.target.value)} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'inherit' }}>
                <option value="">약 라벨 선택</option>{step.meds.map(m => <option key={m.id} value={m.id}>{m.t}</option>)}
              </select>
              <button className="btn" type="button" disabled={!pick || !!done[idx]} onClick={() => doScan('med')}>② 약 스캔</button>
              <button className="btn p" type="button" disabled={!giveOk || !!done[idx]} onClick={() => { setScan(p => [...p, { k: 'give', t: '투약 수행 완료', ok: true }]); }}>③ 투약 수행</button>
            </div>
            <div className="log">{scan.length === 0 ? '스캔 기록이 여기에 표시돼요.' : scan.map((l, i) => <div key={i} className={l.ok ? 'g' : 'b'}>{i + 1}. {l.ok ? '✓' : '✗'} {l.t}</div>)}</div>
          </div>
        )}

        {step.t === 'note' && (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 13 }}>Focus: <b>{step.focus}</b></p>
            <textarea value={note} disabled={!!done[idx]} onChange={e => setNote(e.target.value)} placeholder="간호기록을 직접 써 보세요. (가상 환자 기준)" />
          </div>
        )}

        {done[idx] && step.t !== 'quiz' && step.t !== 'info' && (
          <ul className="ck">
            {all[idx].lines.map((l, i) => <li key={i}>{l.ok ? '✅' : '❌'} {l.t}{l.sub && <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 22 }}>{l.sub}</div>}</li>)}
          </ul>
        )}

        <div className="row">
          {!checked && <button className="btn p" type="button" disabled={!canCheck()} onClick={() => setDone(p => ({ ...p, [idx]: true }))}>{step.t === 'note' ? '제출·채점' : '확인'}</button>}
          {checked && !last && <button className="btn p" type="button" onClick={() => setIdx(idx + 1)}>다음 →</button>}
          {idx > 0 && <button className="btn" type="button" onClick={() => setIdx(idx - 1)}>← 이전</button>}
        </div>
      </div>

      {finished && idx === sc.steps.length - 1 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h2>결과</h2>
          <p className="big">{total} / {maxT}점</p>
          <ul className="ck">
            {sc.steps.map((s, i) => s.t === 'info' ? null : <li key={i}>{all[i].got === all[i].max ? '✅' : '⚠️'} {s.title} — {all[i].got}/{all[i].max}</li>)}
          </ul>
          {ai && (
            <div>
              <button className="btn p" type="button" disabled={fbBusy || left <= 0} onClick={askAi}><AiMark size={14} /> {fbBusy ? '보는 중…' : 'AI 기록 피드백'}</button>
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>오늘 {left}회 남음</span>
              {fb && <div className="fb">{fb}</div>}
            </div>
          )}
          <div className="row"><button className="btn" type="button" onClick={reset}>처음부터 다시</button><Link className="btn" href="/ehr/skills">다른 술기</Link></div>
        </div>
      )}
    </div>
  );
}
