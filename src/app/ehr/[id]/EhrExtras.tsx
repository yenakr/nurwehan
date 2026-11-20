'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChartData, Row } from '../types';

const num = (v: string | undefined) => {
  const n = parseFloat((v || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const sbpOf = (bp: string | undefined) => num((bp || '').split('/')[0]);

// NEWS2 (성인, 산소 투여·의식 항목은 입력란이 없어 제외한 연습용 점수)
function news(r: Row): { score: number; any3: boolean } | null {
  const rr = num(r.rr), sp = num(r.spo2), sb = sbpOf(r.bp), hr = num(r.hr), bt = num(r.bt);
  const parts: number[] = [];
  if (rr !== null) parts.push(rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3);
  if (sp !== null) parts.push(sp <= 91 ? 3 : sp <= 93 ? 2 : sp <= 95 ? 1 : 0);
  if (sb !== null) parts.push(sb <= 90 ? 3 : sb <= 100 ? 2 : sb <= 110 ? 1 : sb <= 219 ? 0 : 3);
  if (hr !== null) parts.push(hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3);
  if (bt !== null) parts.push(bt <= 35 ? 3 : bt <= 36 ? 1 : bt <= 38 ? 0 : bt <= 39 ? 1 : 2);
  if (parts.length < 3) return null;
  return { score: parts.reduce((a, b) => a + b, 0), any3: parts.includes(3) };
}

function Spark({ label, vals, unit }: { label: string; vals: (number | null)[]; unit: string }) {
  const pts = vals.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v));
  const span = max - min || 1;
  const W = 120, H = 34;
  const x = (i: number) => (vals.length <= 1 ? 0 : (i / (vals.length - 1)) * (W - 8) + 4);
  const y = (v: number) => H - 5 - ((v - min) / span) * (H - 10);
  const last = pts[pts.length - 1].v;
  return (
    <div className="spk">
      <span>{label}</span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <polyline fill="none" stroke="#1d4e89" strokeWidth="2" strokeLinejoin="round" points={pts.map(p => `${x(p.i)},${y(p.v)}`).join(' ')} />
        {pts.map(p => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r="2.5" fill="#1d4e89" />)}
      </svg>
      <b>{last}{unit}</b>
    </div>
  );
}

export function VitalsExtra({ rows }: { rows: Row[] }) {
  if (rows.length < 2) return null;
  // 시간 오름차순으로 본다 (입력 순서와 달라도 추이가 맞게)
  const sorted = [...rows].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const scores = sorted.map(r => ({ t: r.time, n: news(r) })).filter((s): s is { t: string; n: { score: number; any3: boolean } } => !!s.n);
  return (
    <div className="vx">
      <div className="sparks">
        <Spark label="맥박" vals={sorted.map(r => num(r.hr))} unit="" />
        <Spark label="수축기" vals={sorted.map(r => sbpOf(r.bp))} unit="" />
        <Spark label="SpO₂" vals={sorted.map(r => num(r.spo2))} unit="%" />
        <Spark label="체온" vals={sorted.map(r => num(r.bt))} unit="" />
      </div>
      {scores.length > 0 && (
        <div className="news">
          <b>NEWS 점수</b>
          {scores.map((s, i) => {
            const lv = s.n.score >= 7 ? 'hi' : s.n.score >= 5 || s.n.any3 ? 'md' : '';
            return <span key={i} className={`nw ${lv}`}>{s.t} · {s.n.score}</span>;
          })}
          <i>산소 투여와 의식 상태를 뺀 연습용 점수예요. 5점 이상이면 담당 간호사에게 바로 알려요.</i>
        </div>
      )}
    </div>
  );
}

const mlSum = (t: string | undefined) => {
  const s = t || '';
  const ml = Array.from(s.matchAll(/(\d+(?:\.\d+)?)\s*(?:ml|cc)/gi)).reduce((a, m) => a + Number(m[1]), 0);
  if (ml) return ml;
  return /^\s*\d+(\.\d+)?\s*$/.test(s) ? Number(s) : 0;
};

export function IoTotals({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  const inn = rows.reduce((a, r) => a + mlSum(r.intake), 0);
  const out = rows.reduce((a, r) => a + mlSum(r.output), 0);
  if (!inn && !out) return null;
  const bal = inn - out;
  return (
    <div className="iot">
      <span>섭취 합계 <b>{inn}</b> mL</span>
      <span>배설 합계 <b>{out}</b> mL</span>
      <span>균형 <b>{bal > 0 ? '+' : ''}{bal}</b> mL</span>
    </div>
  );
}

const esc = (t: string) => (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A4 인쇄용: 간호기록, 간호과정, 임상관찰, I/O
export function printChart(title: string, d: ChartData, author: string) {
  const i = d.info;
  const sec = (label: string, head: string[], keys: string[], rows: Row[]) =>
    rows.length === 0 ? '' : `<h2>${label}</h2><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${esc(r[k] || '').replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=794"><title>${esc(title)}</title><style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif; color: #000; font-size: 10.5px; }
h1 { font-size: 16px; margin: 0 0 6px; } h2 { font-size: 12.5px; margin: 14px 0 4px; }
table { width: 100%; border-collapse: collapse; table-layout: auto; }
th, td { border: 1px solid #555; padding: 3px 5px; vertical-align: top; text-align: left; }
th { background: #e5e5e5; } tr { break-inside: avoid; }
.info td, .info th { font-size: 10.5px; }
@media screen { body { background: #d9d9d9; padding: 12px 0; } .pg { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.25); } }
</style></head><body><div class="pg">
<h1>${esc(title)}</h1>
<table class="info"><tr><th>이름</th><td>${esc(i.name || '')}</td><th>나이/성별</th><td>${esc(i.ageSex || '')}</td><th>병동/병상</th><td>${esc(`${i.ward || ''} ${i.bed || ''}`)}</td></tr><tr><th>진단명</th><td colspan="3">${esc(i.dx || '')}</td><th>작성자</th><td>${esc(author)}</td></tr></table>
${sec('간호기록', ['기록일시', 'Focus', '간호기록', '작성자'], ['time', 'focus', 'text', 'author'], d.notes)}
${sec('간호과정', ['간호진단', '자료', '목표', '중재', '평가'], ['dx', 'data', 'goal', 'plan', 'eval'], d.care)}
${sec('임상관찰', ['시간', '혈압', '맥박', '호흡', '체온', 'SpO2', '통증'], ['time', 'bp', 'hr', 'rr', 'bt', 'spo2', 'pain'], d.vitals)}
${sec('섭취/배설', ['시간', '섭취', '배설', '비고'], ['time', 'intake', 'output', 'note'], d.io)}
</div></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
  return true;
}

// 브라우저 음성 인식(한국어). 지원하지 않는 브라우저에서는 supported가 false다.
export function useDictation(onFinal: (t: string) => void) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);
  const cb = useRef(onFinal);
  cb.current = onFinal;
  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => { try { rec.current?.stop(); } catch {} };
  }, []);
  const start = () => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'ko-KR';
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = String(e.results[i][0].transcript || '').trim();
          if (t) cb.current(t);
        }
      }
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    try { r.start(); setOn(true); } catch { setOn(false); }
  };
  const stop = () => { try { rec.current?.stop(); } catch {} setOn(false); };
  return { supported, on, start, stop };
}
