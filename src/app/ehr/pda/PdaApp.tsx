'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChartData, Row } from '../types';
import { group, slotsOf, timesFor, type Item } from '../[id]/EhrNurse';
import { medQr, parseQr, patientQr } from '../pda';
import { qrSvg } from '../qr';
import { offsetOf, setVOffset, vnow } from '../vclock';
import Scanner from './Scanner';

type R = { id: string; ward: string; bed: string; name: string; ptNo: string };
type Res = { idx: number; name: string; patientId: string };
const p2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const hm = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
const dutyOf = (d: Date) => { const h = d.getHours(); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };
const HIGH = /(insulin|인슐린|heparin|헤파린|potassium|kcl|칼륨|morphine|모르핀|fentanyl|펜타닐|midazolam|digoxin|warfarin|propofol)/i;
const dueOf = (it: Item) => timesFor(it.r, 'med')[slotsOf(it.r).length] || '';
const minOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export default function PdaApp({ roster, userName }: { roster: R[]; userName: string }) {
  const [pid, setPid] = useState('');
  const [chart, setChart] = useState<ChartData | null>(null);
  const [mode, setMode] = useState<'home' | 'scanP' | 'patient' | 'scanM' | 'result' | 'sheet'>('home');
  const [res, setRes] = useState<Res | null>(null);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 15000); return () => clearInterval(id); }, []);

  const load = useCallback(async (id: string) => {
    const r = await fetch(`/api/ehr/${id}/pda`, { cache: 'no-store' });
    if (!r.ok) { setMsg({ t: '차트를 불러오지 못했어요', ok: false }); return null; }
    const j = await r.json() as { data: ChartData };
    setVOffset(offsetOf(j.data.info, Date.now()));
    setChart(j.data); setPid(id);
    return j.data;
  }, []);

  const scan = async (text: string) => {
    const s = parseQr(text);
    if (!s) { setMsg({ t: '이 시스템의 QR이 아니에요', ok: false }); setMode(pid ? 'patient' : 'home'); return; }
    if (s.kind === 'P') {
      if (!roster.some(x => x.id === s.id)) { setMsg({ t: '등록되지 않은 환자 팔찌예요', ok: false }); setMode(pid ? 'patient' : 'home'); return; }
      const d = await load(s.id);
      if (d) { setMsg({ t: `환자 확인: ${d.info.name} (${d.info.ward} ${d.info.bed})`, ok: true }); setMode('patient'); }
      return;
    }
    if (!pid) { setMsg({ t: '먼저 환자 팔찌를 스캔하세요', ok: false }); setMode('home'); return; }
    setRes({ idx: s.idx, name: s.name, patientId: s.id }); setMode('result');
  };

  const give = async () => {
    if (!res || !chart) return;
    setBusy(true);
    const now = vnow();
    const ev = { id: crypto.randomUUID(), type: 'give', idx: String(res.idx), name: res.name, date: ymd(now), time: hm(now), duty: dutyOf(now), by: userName };
    const r = await fetch(`/api/ehr/${pid}/pda`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: ev }) });
    setBusy(false);
    if (!r.ok) { setMsg({ t: '저장에 실패했어요. 다시 시도해 주세요', ok: false }); return; }
    await load(pid);
    setMsg({ t: `${res.name} 투약 수행 완료 · PC의 EHR에도 반영돼요`, ok: true });
    setRes(null); setMode('patient');
  };

  const now = vnow();
  const info = chart?.info;
  const items = chart ? group(chart.orders) : null;
  const ok = (r: Row) => r.pri !== 'D/C' && r.st !== '취소';
  const meds = items ? items.med.filter(it => ok(it.r)) : [];
  const prns = items ? items.prn.filter(it => ok(it.r)) : [];
  const other = roster.find(x => x.id !== pid);

  // 5 Right 확인
  const check = (() => {
    if (!res || !chart) return null;
    const o = chart.orders[res.idx];
    const patientOk = res.patientId === pid;
    const drugOk = !!o && (o.name || '') === res.name;
    const due = o ? timesFor(o, 'med')[slotsOf(o).length] || '' : '';
    const diff = due ? Math.abs(minOf(hm(now)) - minOf(due)) : 9999;
    const prn = o?.pri === 'PRN';
    const timeState: 'ok' | 'warn' = prn || diff <= 60 ? 'ok' : 'warn';
    return { o, patientOk, drugOk, due, timeState, prn, high: !!o && HIGH.test(o.name || '') };
  })();
  const blocked = !check || !check.patientOk || !check.drugOk;

  return (
    <div className="pd">
      <style>{CSS}</style>
      <header className="pd-top">
        <Link href="/ehr" className="pd-back">← EHR</Link>
        <b>PDA</b>
        <span className="pd-clk">{vParse(now)}</span>
      </header>
      {msg && <div className={`pd-msg ${msg.ok ? 'ok' : 'bad'}`} onClick={() => setMsg(null)} role="status">{msg.t}</div>}

      {mode === 'home' && (
        <section className="pd-sec">
          <h2>환자 팔찌 스캔</h2>
          <button type="button" className="pd-big" onClick={() => { setMsg(null); setMode('scanP'); }}>📷 환자 팔찌 QR 스캔</button>
          <h3>샘플 스캔 (카메라 없이 연습)</h3>
          <p className="pd-sub">누르면 해당 환자의 팔찌를 스캔한 것으로 처리돼요.</p>
          <div className="pd-list">
            {roster.map(x => <button key={x.id} type="button" onClick={() => scan(patientQr(x.id))}><b>{x.ward} {x.bed}</b> {x.name}<em>{x.ptNo}</em></button>)}
            {roster.length === 0 && <p className="pd-sub">병동 환자가 없어요. EHR에서 환자 차트를 먼저 열어 주세요.</p>}
          </div>
        </section>
      )}

      {mode === 'scanP' && (
        <section className="pd-sec">
          <h2>환자 팔찌 스캔</h2>
          <Scanner onScan={scan} hint="환자 팔찌의 QR을 사각형 안에 맞춰 주세요" />
          <button type="button" className="pd-ghost" onClick={() => setMode('home')}>취소</button>
        </section>
      )}

      {chart && info && (mode === 'patient' || mode === 'scanM' || mode === 'result' || mode === 'sheet') && (
        <div className="pd-pt">
          <div><b>{info.name}</b> {info.ageSex} <span className="pd-bed">{info.ward} {info.bed}</span></div>
          <div className="pd-sub">환자번호 {info.ptNo} · {info.dx}</div>
          {info.allergy && !/^(없음|무|none|-)$/i.test(info.allergy.trim()) && <div className="pd-allg">알러지: {info.allergy}</div>}
        </div>
      )}

      {chart && mode === 'patient' && (
        <section className="pd-sec">
          <button type="button" className="pd-big" onClick={() => { setMsg(null); setMode('scanM'); }}>📷 약포지 QR 스캔</button>
          <div className="pd-row">
            <button type="button" className="pd-ghost" onClick={() => { setPid(''); setChart(null); setMode('home'); }}>다른 환자</button>
            <button type="button" className="pd-ghost" onClick={() => setMode('sheet')}>QR 시험지</button>
          </div>
          <h3>투약 ({meds.length})</h3>
          {meds.map(it => {
            const due = dueOf(it); const late = due && minOf(hm(now)) > minOf(due) + 30;
            return (
              <div key={it.i} className={`pd-med ${due ? '' : 'done'} ${late ? 'late' : ''}`}>
                <div className="pd-mn">{it.r.name}</div>
                <div className="pd-ms">{[it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route, it.r.cnt && `하루 ${it.r.cnt}회`].filter(Boolean).join(' · ')}</div>
                <div className="pd-md">{due ? `다음 ${due}${late ? ' (지연)' : ''}` : '오늘 수행 완료'}</div>
                <button type="button" className="pd-mini" onClick={() => scan(medQr(pid, it.i, it.r.name || ''))}>샘플 스캔</button>
              </div>
            );
          })}
          {prns.length > 0 && <h3>PRN ({prns.length})</h3>}
          {prns.map(it => (
            <div key={it.i} className="pd-med">
              <div className="pd-mn">{it.r.name}</div>
              <div className="pd-ms">{[it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route, 'PRN'].filter(Boolean).join(' · ')}</div>
              <button type="button" className="pd-mini" onClick={() => scan(medQr(pid, it.i, it.r.name || ''))}>샘플 스캔</button>
            </div>
          ))}
          {other && meds[0] && (
            <>
              <h3>오류 시험</h3>
              <button type="button" className="pd-mini bad" onClick={() => scan(medQr(other.id, meds[0].i, meds[0].r.name || ''))}>다른 환자({other.name})의 약포지 스캔</button>
              <button type="button" className="pd-mini bad" onClick={() => scan(medQr(pid, meds[0].i, `${meds[0].r.name}-X`))}>다른 약 스캔</button>
            </>
          )}
        </section>
      )}

      {chart && mode === 'scanM' && (
        <section className="pd-sec">
          <h2>약포지 스캔</h2>
          <Scanner onScan={scan} hint="약포지 / 수액 라벨의 QR을 맞춰 주세요" />
          <button type="button" className="pd-ghost" onClick={() => setMode('patient')}>취소</button>
        </section>
      )}

      {chart && mode === 'result' && check && res && (
        <section className="pd-sec">
          <h2>투약 확인</h2>
          <ul className="pd-chk">
            <li className={check.patientOk ? 'ok' : 'bad'}>환자 {check.patientOk ? `일치 (${info?.name})` : '불일치 — 다른 환자의 약이에요'}</li>
            <li className={check.drugOk ? 'ok' : 'bad'}>약 {check.drugOk ? `일치 (${check.o?.name})` : `불일치 — 처방에 없는 약이에요 (${res.name})`}</li>
            <li className={check.drugOk ? 'ok' : 'bad'}>용량 {check.o ? `${check.o.dose || '-'}${check.o.unit || ''}` : '-'}</li>
            <li className={check.drugOk ? 'ok' : 'bad'}>경로 {check.o?.route || '-'}</li>
            <li className={check.timeState === 'ok' ? 'ok' : 'warn'}>시간 {check.prn ? 'PRN (필요시)' : check.due ? `예정 ${check.due} · 현재 ${hm(now)}${check.timeState === 'warn' ? ' — 예정 시각과 차이가 커요' : ''}` : '오늘 예정 횟수를 모두 수행했어요'}</li>
          </ul>
          {check.high && <p className="pd-warn">고위험 약물이에요. 용량·속도를 한 번 더 확인하세요.</p>}
          <button type="button" className={`pd-big ${blocked ? 'off' : ''}`} disabled={blocked || busy} onClick={give}>{busy ? '저장 중…' : check.timeState === 'warn' ? '확인했어요. 투약 수행' : '투약 수행'}</button>
          <button type="button" className="pd-ghost" onClick={() => { setRes(null); setMode('patient'); }}>취소</button>
        </section>
      )}

      {chart && mode === 'sheet' && (
        <section className="pd-sec">
          <h2>QR 시험지</h2>
          <p className="pd-sub">이 화면을 PC에 띄우고 폰의 PDA로 찍어 보세요.</p>
          <div className="pd-qr"><div dangerouslySetInnerHTML={{ __html: qrSvg(patientQr(pid), 150) }} /><b>환자 팔찌</b><span>{info?.name}</span></div>
          <div className="pd-qrs">
            {[...meds, ...prns].map(it => <div key={it.i} className="pd-qr"><div dangerouslySetInnerHTML={{ __html: qrSvg(medQr(pid, it.i, it.r.name || ''), 130) }} /><b>{it.r.name}</b><span>{[it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route].filter(Boolean).join(' · ')}</span></div>)}
          </div>
          <button type="button" className="pd-ghost" onClick={() => setMode('patient')}>돌아가기</button>
        </section>
      )}
    </div>
  );
}

const vParse = (d: Date) => `${ymd(d)} ${hm(d)}`;

const CSS = `
.pd { max-width: 520px; margin: 0 auto; min-height: 100vh; background: #f4f6fa; color: #14202e; font-size: 15px; padding-bottom: 40px; }
.pd-top { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #0f2744; color: #fff; position: sticky; top: 0; z-index: 5; }
.pd-top b { font-size: 17px; flex: 1; }
.pd-back { color: #fff; text-decoration: none; font-size: 14px; border: 1px solid rgba(255,255,255,.4); border-radius: 6px; padding: 4px 10px; }
.pd-clk { font-size: 12.5px; font-variant-numeric: tabular-nums; opacity: .9; }
.pd-msg { margin: 10px 14px 0; padding: 10px 12px; border-radius: 8px; font-weight: 700; font-size: 14px; }
.pd-msg.ok { background: #dff5e6; color: #0b6b2e; } .pd-msg.bad { background: #fde3e3; color: #b3261e; }
.pd-sec { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.pd-sec h2 { margin: 4px 0 0; font-size: 17px; } .pd-sec h3 { margin: 10px 0 0; font-size: 14px; color: #3a566f; }
.pd-sub { margin: 0; color: #5d7387; font-size: 13px; }
.pd-big { border: 0; border-radius: 12px; background: #1f5fae; color: #fff; font: inherit; font-size: 17px; font-weight: 800; padding: 18px; cursor: pointer; }
.pd-big.off, .pd-big:disabled { background: #b8c2cf; cursor: not-allowed; }
.pd-ghost { border: 1px solid #c5d0dc; background: #fff; border-radius: 10px; font: inherit; padding: 11px; cursor: pointer; flex: 1; }
.pd-row { display: flex; gap: 8px; }
.pd-list { display: flex; flex-direction: column; gap: 6px; }
.pd-list button { text-align: left; border: 1px solid #d3dce6; background: #fff; border-radius: 10px; padding: 12px; font: inherit; cursor: pointer; }
.pd-list em { float: right; font-style: normal; color: #5d7387; }
.pd-pt { margin: 10px 14px 0; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #d3dce6; }
.pd-bed { background: #e6eef8; color: #1f5fae; border-radius: 999px; padding: 1px 9px; font-size: 12.5px; font-weight: 700; margin-left: 4px; }
.pd-allg { margin-top: 6px; background: #fde3e3; color: #b3261e; border-radius: 6px; padding: 4px 8px; font-weight: 700; font-size: 13px; }
.pd-med { background: #fff; border: 1px solid #d3dce6; border-radius: 10px; padding: 10px 12px; display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; }
.pd-med.done { opacity: .6; } .pd-med.late { border-color: #e0a100; background: #fff9e8; }
.pd-mn { font-weight: 800; grid-column: 1; } .pd-ms { grid-column: 1; color: #4b6074; font-size: 13px; } .pd-md { grid-column: 1; font-size: 12.5px; color: #1f5fae; font-weight: 700; }
.pd-med .pd-mini { grid-column: 2; grid-row: 1 / span 3; align-self: center; }
.pd-mini { border: 1px solid #c5d0dc; background: #f1f5fa; border-radius: 8px; font: inherit; font-size: 12.5px; padding: 7px 10px; cursor: pointer; }
.pd-mini.bad { border-color: #e6b3b0; background: #fdf0ef; color: #b3261e; }
.pd-chk { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.pd-chk li { padding: 11px 12px; border-radius: 10px; font-weight: 700; background: #fff; border: 1px solid #d3dce6; }
.pd-chk li::before { margin-right: 8px; font-weight: 900; }
.pd-chk li.ok { border-color: #8fd0a4; color: #0b6b2e; } .pd-chk li.ok::before { content: '✔'; }
.pd-chk li.bad { border-color: #e6a09b; background: #fde3e3; color: #b3261e; } .pd-chk li.bad::before { content: '✖'; }
.pd-chk li.warn { border-color: #e0b84d; background: #fff6d8; color: #8a5a00; } .pd-chk li.warn::before { content: '!'; }
.pd-warn { margin: 0; background: #fff6d8; color: #8a5a00; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-weight: 700; }
.pd-cam { position: relative; background: #000; border-radius: 12px; overflow: hidden; aspect-ratio: 3 / 4; }
.pd-cam video { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-frame { position: absolute; inset: 18% 14%; border: 3px solid rgba(255,255,255,.85); border-radius: 14px; box-shadow: 0 0 0 999px rgba(0,0,0,.35); }
.pd-hint { position: absolute; left: 0; right: 0; bottom: 10px; text-align: center; color: #fff; font-size: 13px; margin: 0; }
.pd-man { display: flex; gap: 6px; } .pd-man input { flex: 1; padding: 10px; border: 1px solid #c5d0dc; border-radius: 8px; font: inherit; font-size: 13px; } .pd-man button { border: 1px solid #c5d0dc; background: #fff; border-radius: 8px; padding: 0 14px; font: inherit; }
.pd-scan { display: flex; flex-direction: column; gap: 8px; }
.pd-qrs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pd-qr { background: #fff; border: 1px solid #d3dce6; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; font-size: 12.5px; }
.pd-qr span { color: #5d7387; }
`;
