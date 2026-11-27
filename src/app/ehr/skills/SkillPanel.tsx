'use client';

import { useMemo, useState } from 'react';
import AiMark from '@/components/AiMark';
import type { ChartData } from '../types';
import { scenarioOf } from './data';
import { gradeChart } from './grade';
import { GUIDE } from './guide';

// 실제 EHR 화면 위에 떠 있는 술기 가이드: 상황 브리핑 + 차트 기준 실시간 체크리스트 + AI 기록 피드백
export default function SkillPanel({ id, data, ai, aiLeft }: { id: string; data: ChartData; ai: boolean; aiLeft: number }) {
  const key = data.info.skill || '';
  const sc = scenarioOf(key);
  const [open, setOpen] = useState(true);
  const [fb, setFb] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(aiLeft);
  const items = useMemo(() => gradeChart(key, data), [key, data]);
  if (!sc) return null;
  const real = items.filter(i => !i.avoid);
  const bad = items.filter(i => i.avoid && !i.ok);
  const okN = real.filter(i => i.ok).length;
  const groups = Array.from(new Set(items.map(i => i.group)));
  const brief = sc.steps.filter(s => s.t === 'info').flatMap(s => (s.t === 'info' ? s.tables : [])).filter(t => !(key === 'med' && /처방|활력징후/.test(t.cap)));
  const ask = async () => {
    setBusy(true); setFb('');
    try {
      const r = await fetch('/api/ehr/skills/grade', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, data }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setFb(j.text); setLeft(j.left ?? 0); }
      else setFb(j.error === 'limit' ? '오늘 AI 피드백 횟수를 모두 썼어요.' : j.error === 'empty' ? '간호기록을 먼저 써 주세요.' : '피드백을 가져오지 못했어요.');
    } catch { setFb('피드백을 가져오지 못했어요.'); }
    setBusy(false);
  };
  return (
    <div className="skp">
      <style>{`
        .skp{position:fixed;right:12px;top:64px;z-index:60;width:330px;max-height:calc(100vh - 80px);overflow:auto;background:var(--background);color:var(--foreground);border:1px solid #2563eb;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px}
        .skp.cl{width:auto}
        .skp .h{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#2563eb;color:#fff;border-radius:9px 9px 0 0;cursor:pointer;font-weight:600}
        .skp.cl .h{border-radius:9px}
        .skp .h span{margin-left:auto;font-weight:400;font-size:12px}
        .skp .b{padding:10px 12px}
        .skp h4{margin:10px 0 4px;font-size:12px;color:var(--muted-foreground)}
        .skp table{width:100%;min-width:0 !important;border-collapse:collapse;font-size:12px;margin:2px 0 6px}
        .skp th,.skp td{border:1px solid var(--border);padding:3px 6px;text-align:left;vertical-align:top}
        .skp th{background:var(--muted-background)}
        .skp ol{margin:0;padding-left:18px;line-height:1.55}
        .skp ul{list-style:none;margin:0;padding:0}
        .skp li{padding:3px 0;border-bottom:1px solid var(--border)}
        .skp li small{display:block;color:var(--muted-foreground);margin-left:20px}
        .skp .btn{padding:6px 12px;border-radius:7px;border:0;background:#2563eb;color:#fff;cursor:pointer;font-size:12px;display:inline-flex;gap:5px;align-items:center}
        .skp .btn:disabled{opacity:.5}
        .skp .fb{white-space:pre-wrap;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:8px;margin-top:8px;line-height:1.55}
        .skp .warn{background:#fef2f2;color:#991b1b;border-radius:6px;padding:5px 8px;margin:4px 0}
        @media (prefers-color-scheme: dark){.skp .fb{background:#1e1b4b;border-color:#4338ca}.skp .warn{background:#450a0a;color:#fca5a5}}
        @media (max-width:900px){.skp{top:auto;bottom:8px;max-height:60vh}}
      `}</style>
      <div className={open ? 'h' : 'h'} onClick={() => setOpen(o => !o)}>
        🎯 {sc.title} 연습<span>{okN}/{real.length} {open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="b">
          <div><b>{sc.patient.name}</b> {sc.patient.line}<br />{sc.patient.dx} · 알레르기 {sc.patient.allergy}</div>
          {brief.length > 0 && <h4>상황</h4>}
          {brief.map(t => (
            <div key={t.cap}><b style={{ fontSize: 12 }}>{t.cap}</b>
              <table><thead><tr>{t.table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{t.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
            </div>
          ))}
          <h4>순서</h4>
          <ol>{GUIDE[key].map((g, i) => <li key={i}>{g}</li>)}</ol>
          {key === 'med' && <p style={{ margin: '6px 0 0' }}><a href="/ehr/pda?mode=skill" target="_blank" rel="noreferrer">PDA 열기 ↗</a></p>}
          {bad.map(i => <div className="warn" key={i.id}>⚠ {i.label.replace('투약하지 않기', '투약했어요')} — {i.tip}</div>)}
          {groups.map(g => (
            <div key={g}>
              <h4>{g}</h4>
              <ul>{items.filter(i => i.group === g).map(i => (
                <li key={i.id}>{i.avoid ? (i.ok ? '🛡️' : '❌') : i.ok ? '✅' : '⬜'} {i.label}{!i.ok && !i.avoid && <small>{i.tip}</small>}</li>
              ))}</ul>
            </div>
          ))}
          {ai && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="btn" disabled={busy || left <= 0} onClick={ask}><AiMark size={13} />{busy ? '보는 중…' : 'AI 기록 피드백'}</button>
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--muted-foreground)' }}>오늘 {left}회</span>
              {fb && <div className="fb">{fb}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
