'use client';

import { useEffect, useMemo, useState } from 'react';
import AiMark from '@/components/AiMark';
import type { ChartData } from '../types';
import { SKILLS, briefOf, cfgOf, gradeChart } from './scn';
import { GUIDE } from './guide';

// 핵심술기 EHR: 처음 열 때 상황 안내 창 + 오른쪽 아래 동그라미 버튼(상황·체크리스트·사용법 질문·제출)
export default function SkillPanel({ id, data, ai, aiLeft, onSubmit }: { id: string; data: ChartData; ai: boolean; aiLeft: number; onSubmit: (score: string, miss: string[]) => void }) {
  const key = data.info.skill || '';
  const sc = SKILLS.find(x => x.key === key);
  const cfg = cfgOf(data.info);
  const exam = data.info.skExam === '1';
  const locked = !!data.info.submitted;
  const seenKey = `sk.intro.${id}`;
  const [intro, setIntro] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'info' | 'check' | 'ask'>('info');
  const [q, setQ] = useState('');
  const [ans, setAns] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(aiLeft);
  useEffect(() => { try { if (!localStorage.getItem(seenKey) && !data.info.submitted) setIntro(true); } catch { /* 저장 불가 */ } }, [seenKey, data.info.submitted]);
  const items = useMemo(() => (cfg ? gradeChart(key, cfg, data) : []), [key, cfg, data]);
  if (!sc || !cfg) return null;
  const real = items.filter(i => !i.avoid);
  const bad = items.filter(i => i.avoid && !i.ok);
  const okN = real.filter(i => i.ok).length;
  const groups = Array.from(new Set(items.map(i => i.group)));
  const brief = briefOf(key, cfg);
  const closeIntro = () => { setIntro(false); try { localStorage.setItem(seenKey, '1'); } catch { /* 저장 불가 */ } };
  const ask = async () => {
    if (!q.trim()) return;
    setBusy(true); setAns('');
    try {
      const r = await fetch('/api/ehr/skills/help', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setAns(j.text); setLeft(j.left ?? 0); } else setAns(j.error === 'limit' ? '오늘 질문 횟수를 모두 썼어요.' : '답을 가져오지 못했어요.');
    } catch { setAns('답을 가져오지 못했어요.'); }
    setBusy(false);
  };
  const submit = () => onSubmit(`${items.filter(i => i.ok).length}/${items.length}`, items.filter(i => !i.ok).map(i => i.label));
  const Situation = () => (
    <>
      <div><b>{cfg.name}</b> {cfg.age}/{cfg.sex} · {cfg.ward} {cfg.bed}<br />{cfg.dx} · 알레르기 {cfg.allergy}</div>
      {brief.map(t => (
        <div key={t.cap}><b style={{ fontSize: 12 }}>{t.cap}</b>
          <table><thead><tr>{t.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
        </div>
      ))}
      <h4>순서</h4>
      <ol>{GUIDE[key].map((g, i) => <li key={i}>{g}</li>)}</ol>
    </>
  );
  return (
    <div className="skp">
      <style>{`
        .skp .fab{position:fixed;right:18px;bottom:76px;z-index:70;width:54px;height:54px;border-radius:50%;border:0;background:#2563eb;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)}
        .skp .sheet{position:fixed;right:18px;bottom:140px;z-index:70;width:340px;max-width:calc(100vw - 36px);max-height:min(70vh,560px);display:flex;flex-direction:column;background:var(--background);color:var(--foreground);border:1px solid #2563eb;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.25);font-size:13px}
        .skp .tabs{display:flex;border-bottom:1px solid var(--border)}
        .skp .tabs button{flex:1;padding:9px 4px;border:0;background:none;color:inherit;cursor:pointer;font-size:13px;border-bottom:2px solid transparent}
        .skp .tabs button.on{border-bottom-color:#2563eb;color:#2563eb;font-weight:700}
        .skp .body{padding:10px 12px;overflow:auto;flex:1}
        .skp .foot{padding:8px 12px;border-top:1px solid var(--border)}
        .skp h4{margin:10px 0 4px;font-size:12px;color:var(--muted-foreground)}
        .skp table{width:100%;min-width:0 !important;border-collapse:collapse;font-size:12px;margin:2px 0 6px}
        .skp th,.skp td{border:1px solid var(--border);padding:3px 6px;text-align:left;vertical-align:top}
        .skp th{background:var(--muted-background)}
        .skp ol{margin:0;padding-left:18px;line-height:1.55}
        .skp ul{list-style:none;margin:0;padding:0}
        .skp li{padding:3px 0}
        .skp ul li{border-bottom:1px solid var(--border)}
        .skp li small{display:block;color:var(--muted-foreground);margin-left:20px}
        .skp .btn{padding:7px 14px;border-radius:7px;border:0;background:#2563eb;color:#fff;cursor:pointer;font-size:13px}
        .skp .btn:disabled{opacity:.5}
        .skp .warn{background:#fef2f2;color:#991b1b;border-radius:6px;padding:5px 8px;margin:4px 0}
        .skp .ans{white-space:pre-wrap;background:var(--muted-background);border-radius:8px;padding:8px;margin-top:8px;line-height:1.55}
        .skp input.q{width:100% !important;padding:7px 8px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:inherit}
        .skp .ov{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:16px}
        .skp .modal{background:var(--background);color:var(--foreground);border-radius:14px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:20px;font-size:14px}
        .skp .modal h3{margin:0 0 10px;font-size:18px}
        @media (prefers-color-scheme: dark){.skp .warn{background:#450a0a;color:#fca5a5}}
      `}</style>

      {intro && (
        <div className="ov">
          <div className="modal">
            <h3>🎯 {sc.title} {exam ? '시험' : '연습'} · 상황</h3>
            <Situation />
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>오른쪽 아래 🎯 버튼에서 상황을 다시 보고, {exam ? '' : '체크리스트와 '}사용법 질문, 제출을 할 수 있어요.</p>
            <div style={{ textAlign: 'right', marginTop: 12 }}><button type="button" className="btn" onClick={closeIntro}>EHR 열기</button></div>
          </div>
        </div>
      )}

      <button type="button" className="fab" aria-label="핵심술기 가이드" onClick={() => setOpen(o => !o)}>{open ? '✕' : '🎯'}</button>
      {open && (
        <div className="sheet">
          <div className="tabs">
            <button type="button" className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>상황</button>
            {!exam && <button type="button" className={tab === 'check' ? 'on' : ''} onClick={() => setTab('check')}>체크 {okN}/{real.length}</button>}
            {ai && <button type="button" className={tab === 'ask' ? 'on' : ''} onClick={() => setTab('ask')}>사용법 질문</button>}
          </div>
          <div className="body">
            {tab === 'info' && <Situation />}
            {tab === 'check' && !exam && (
              <>
                {key === 'med' && <p style={{ margin: '0 0 6px' }}><a href={`/ehr/pda?mode=skill&only=${id}`} target="_blank" rel="noreferrer">PDA 열기 ↗</a></p>}
                {bad.map(i => <div className="warn" key={i.id}>⚠ {i.label.replace('투약하지 않기', '투약했어요')} — {i.tip}</div>)}
                {groups.map(g => (
                  <div key={g}><h4>{g}</h4>
                    <ul>{items.filter(i => i.group === g).map(i => <li key={i.id}>{i.avoid ? (i.ok ? '🛡️' : '❌') : i.ok ? '✅' : '⬜'} {i.label}{!i.ok && !i.avoid && <small>{i.tip}</small>}</li>)}</ul>
                  </div>
                ))}
              </>
            )}
            {tab === 'ask' && ai && (
              <>
                <p style={{ margin: '0 0 6px', color: 'var(--muted-foreground)' }}>EHR 사용법만 물어볼 수 있어요. 정답은 알려주지 않아요.</p>
                <input className="q" value={q} maxLength={300} placeholder="예: 욕창위험 평가는 어디서 입력해요?" onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !busy) ask(); }} />
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn" disabled={busy || left <= 0 || !q.trim()} onClick={ask}><AiMark size={12} /> {busy ? '찾는 중…' : '물어보기'}</button>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>오늘 {left}회</span>
                </div>
                {ans && <div className="ans">{ans}</div>}
              </>
            )}
          </div>
          <div className="foot">
            {locked ? <span>제출했어요. 교수님이 확인해요.</span> : <button type="button" className="btn" onClick={submit}>제출</button>}
          </div>
        </div>
      )}
    </div>
  );
}
