'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChartData, Row } from '../types';
import { group, slotsOf, timesFor, viewOrders, rollover, type Item } from '../ordday';
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
  // 날이 바뀌었으면 PC와 같이 지난 수행을 기록으로 넘긴 뒤 오늘 처방만 보여 준다
  const view = chart ? rollover(chart, ymd(now)) : null;
  const items = view ? group(viewOrders(view, ymd(now), ymd(now))) : null;
  const ok = (r: Row) => r.pri !== 'D/C' && r.st !== '취소';
  const meds = items ? items.med.filter(it => ok(it.r)) : [];
  const prns = items ? items.prn.filter(it => ok(it.r)) : [];
  const other = roster.find(x => x.id !== pid);

  // 5 Right 확인
  const check = (() => {
    if (!res || !chart) return null;
    const o = view?.orders[res.idx];
    const patientOk = res.patientId === pid;
    const drugOk = !!o && (o.name || '') === res.name;
    const due = o ? timesFor(o, 'med')[slotsOf(o).length] || '' : '';
    const diff = due ? Math.abs(minOf(hm(now)) - minOf(due)) : 9999;
    const prn = o?.pri === 'PRN';
    const timeState: 'ok' | 'warn' = prn || diff <= 60 ? 'ok' : 'warn';
    return { o, patientOk, drugOk, due, timeState, prn, high: !!o && HIGH.test(o.name || '') };
  })();
  const blocked = !check || !check.patientOk || !check.drugOk;

  const step = mode === 'home' || mode === 'scanP' ? 1 : mode === 'patient' || mode === 'scanM' || mode === 'sheet' ? 2 : 3;
  const chip = (it: Item) => {
    const due = dueOf(it); const late = due && minOf(hm(now)) > minOf(due) + 30;
    return due ? (late ? <span className="pd-chip late">지연 {due}</span> : <span className="pd-chip">예정 {due}</span>) : <span className="pd-chip done">완료</span>;
  };
  const medCard = (it: Item, prn = false) => {
    const due = dueOf(it); const late = !prn && due && minOf(hm(now)) > minOf(due) + 30;
    return (
      <div key={it.i} className={`pd-med ${!prn && !due ? 'done' : ''} ${late ? 'late' : ''}`}>
        <div className="pd-mt">
          <b>{it.r.name}</b>
          {prn ? <span className="pd-chip prn">PRN</span> : chip(it)}
        </div>
        <div className="pd-ms">{[it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route, it.r.cnt && `하루 ${it.r.cnt}회`].filter(Boolean).join(' · ')}</div>
        <button type="button" className="pd-link" onClick={() => scan(medQr(pid, it.i, it.r.name || ''))}>샘플 스캔 (카메라 없이 연습)</button>
      </div>
    );
  };

  return (
    <div className="pd">
      <style>{CSS}</style>
      <div className="pd-bar">
        <Link href="/ehr?view=list" className="pd-back">← EHR</Link>
        <div className="pd-ttl"><b>PDA</b><span>투약 · 바코드 확인</span></div>
        <span className="pd-clk" title="EHR 가상 시각">{vParse(now)}</span>
      </div>
      <ol className="pd-steps" aria-label="진행 단계">
        {['환자 확인', '약 스캔', '수행 확인'].map((l, k) => <li key={l} className={step === k + 1 ? 'on' : step > k + 1 ? 'past' : ''}><i>{step > k + 1 ? '✓' : k + 1}</i>{l}</li>)}
      </ol>
      {msg && <div className={`pd-msg ${msg.ok ? 'ok' : 'bad'}`} onClick={() => setMsg(null)} role="status">{msg.t}</div>}

      {chart && info && mode !== 'home' && mode !== 'scanP' && (
        <div className="pd-pt">
          <div className="pd-pn"><b>{info.name}</b><span>{info.ageSex}</span><em>{info.ward} {info.bed}</em></div>
          <div className="pd-ps">환자번호 {info.ptNo} · {info.dx}</div>
          {info.allergy && !/^(없음|무|none|-)$/i.test(info.allergy.trim()) && <div className="pd-allg">알러지 · {info.allergy}</div>}
        </div>
      )}

      {mode === 'home' && (
        <section className="pd-sec">
          <h2 className="pd-h">환자 팔찌 스캔</h2>
          <p className="pd-sub">투약 전에 환자 팔찌의 QR을 먼저 찍어 환자를 확인해요. QR은 EHR의 환자 카드 메뉴 'QR' 또는 업무 → 출력·퇴원 → QR 보기에서 확인·출력해요.</p>
          <button type="button" className="pd-scanbtn" onClick={() => { setMsg(null); setMode('scanP'); }}><CamIcon />환자 팔찌 QR 스캔</button>
          <h2 className="pd-h sm">샘플 스캔 · 카메라 없이 연습</h2>
          <div className="pd-list">
            {roster.map(x => <button key={x.id} type="button" onClick={() => scan(patientQr(x.id))}><span className="pd-bedtag">{x.ward} {x.bed}</span><b>{x.name}</b><em>{x.ptNo}</em></button>)}
            {roster.length === 0 && <p className="pd-sub">No data to display</p>}
          </div>
        </section>
      )}

      {mode === 'scanP' && (
        <section className="pd-sec">
          <h2 className="pd-h">환자 팔찌 스캔</h2>
          <Scanner onScan={scan} hint="환자 팔찌의 QR을 사각형 안에 맞춰 주세요" />
          <button type="button" className="pd-ghost" onClick={() => setMode('home')}>취소</button>
        </section>
      )}

      {chart && mode === 'patient' && (
        <section className="pd-sec">
          <button type="button" className="pd-scanbtn" onClick={() => { setMsg(null); setMode('scanM'); }}><CamIcon />약포지 QR 스캔</button>
          <div className="pd-row">
            <button type="button" className="pd-ghost" onClick={() => { setPid(''); setChart(null); setMode('home'); }}>다른 환자</button>
            <button type="button" className="pd-ghost" onClick={() => setMode('sheet')}>QR 시험지</button>
          </div>
          <h2 className="pd-h">투약 <small>{meds.length}건</small></h2>
          {meds.map(it => medCard(it))}
          {meds.length === 0 && <p className="pd-sub">No data to display</p>}
          {prns.length > 0 && <h2 className="pd-h">PRN <small>{prns.length}건</small></h2>}
          {prns.map(it => medCard(it, true))}
          {other && meds[0] && (
            <>
              <h2 className="pd-h sm">오류 시험</h2>
              <div className="pd-row">
                <button type="button" className="pd-err" onClick={() => scan(medQr(other.id, meds[0].i, meds[0].r.name || ''))}>다른 환자의 약포지</button>
                <button type="button" className="pd-err" onClick={() => scan(medQr(pid, meds[0].i, `${meds[0].r.name}-X`))}>다른 약</button>
              </div>
            </>
          )}
        </section>
      )}

      {chart && mode === 'scanM' && (
        <section className="pd-sec">
          <h2 className="pd-h">약포지 스캔</h2>
          <Scanner onScan={scan} hint="약포지 · 수액 라벨의 QR을 맞춰 주세요" />
          <button type="button" className="pd-ghost" onClick={() => setMode('patient')}>취소</button>
        </section>
      )}

      {chart && mode === 'result' && check && res && (
        <section className="pd-sec">
          <h2 className="pd-h">투약 확인 <small>5 Right</small></h2>
          <ul className="pd-chk">
            {([
              ['환자', check.patientOk ? 'ok' : 'bad', check.patientOk ? `${info?.name} · 일치` : '불일치 — 다른 환자의 약이에요'],
              ['약', check.drugOk ? 'ok' : 'bad', check.drugOk ? `${check.o?.name} · 일치` : `불일치 — 처방에 없는 약 (${res.name})`],
              ['용량', check.drugOk ? 'ok' : 'bad', check.o ? `${check.o.dose || '-'}${check.o.unit || ''}` : '-'],
              ['경로', check.drugOk ? 'ok' : 'bad', check.o?.route || '-'],
              ['시간', check.timeState === 'ok' ? 'ok' : 'warn', check.prn ? 'PRN (필요시)' : check.due ? `예정 ${check.due} · 현재 ${hm(now)}${check.timeState === 'warn' ? ' — 예정과 차이가 커요' : ''}` : '오늘 예정 횟수를 모두 수행했어요'],
            ] as [string, string, string][]).map(([k, st, t]) => (
              <li key={k} className={st}><i>{st === 'ok' ? '✓' : st === 'bad' ? '✕' : '!'}</i><span className="k">{k}</span><span className="t">{t}</span></li>
            ))}
          </ul>
          {check.high && <p className="pd-warn">고위험 약물이에요. 용량·속도를 한 번 더 확인하세요.</p>}
          <div className="pd-sticky">
            <button type="button" className="pd-ghost" onClick={() => { setRes(null); setMode('patient'); }}>취소</button>
            <button type="button" className="pd-go" disabled={blocked || busy} onClick={give}>{busy ? '저장 중…' : blocked ? '수행할 수 없어요' : check.timeState === 'warn' ? '확인했어요 · 투약 수행' : '투약 수행'}</button>
          </div>
        </section>
      )}

      {chart && mode === 'sheet' && (
        <section className="pd-sec">
          <h2 className="pd-h">QR 시험지</h2>
          <p className="pd-sub">이 화면을 PC에 띄우고 폰의 PDA로 찍어 보세요.</p>
          <div className="pd-qrs">
            <div className="pd-qr wide"><div dangerouslySetInnerHTML={{ __html: qrSvg(patientQr(pid), 150) }} /><b>환자 팔찌</b><span>{info?.name}</span></div>
            {[...meds, ...prns].map(it => <div key={it.i} className="pd-qr"><div dangerouslySetInnerHTML={{ __html: qrSvg(medQr(pid, it.i, it.r.name || ''), 130) }} /><b>{it.r.name}</b><span>{[it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route].filter(Boolean).join(' · ')}</span></div>)}
          </div>
          <button type="button" className="pd-ghost" onClick={() => setMode('patient')}>돌아가기</button>
        </section>
      )}
    </div>
  );
}

const vParse = (d: Date) => `${ymd(d)} ${hm(d)}`;
const CamIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" />
  </svg>
);

const CSS = `
.pd { max-width: 560px; margin: 0 auto; min-height: 100vh; background: var(--muted-background); color: var(--text); font-size: 15px; padding-bottom: 96px; }
.pd-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--primary); color: #fff; }
.pd-back { color: #fff; font-size: 13.5px; font-weight: 600; padding: 5px 10px; border: 1px solid rgba(255,255,255,.4); border-radius: 4px; white-space: nowrap; }
.pd-ttl { flex: 1; display: flex; flex-direction: column; line-height: 1.25; }
.pd-ttl b { font-size: 17px; letter-spacing: .02em; } .pd-ttl span { font-size: 12px; opacity: .8; }
.pd-clk { font-size: 12.5px; font-variant-numeric: tabular-nums; background: rgba(255,255,255,.14); padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
.pd-steps { list-style: none; display: flex; background: #fff; border-bottom: 1px solid var(--border); margin: 0; }
.pd-steps li { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px 4px; font-size: 13px; font-weight: 600; color: var(--sub-text); border-bottom: 3px solid transparent; }
.pd-steps li i { font-style: normal; width: 20px; height: 20px; border-radius: 50%; background: var(--border); color: var(--sub-text); display: inline-flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 800; }
.pd-steps li.on { color: var(--primary); border-bottom-color: var(--primary); } .pd-steps li.on i { background: var(--primary); color: #fff; }
.pd-steps li.past { color: var(--text); } .pd-steps li.past i { background: #16a34a; color: #fff; }
.pd-msg { margin: 12px 16px 0; padding: 11px 13px; border-radius: 4px; font-weight: 600; font-size: 14px; border-left: 4px solid; background: #fff; border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.pd-msg.ok { border-left-color: #16a34a; color: #166534; } .pd-msg.bad { border-left-color: #dc2626; color: #b91c1c; }
.pd-sec { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.pd-h { margin: 6px 0 0; font-size: 1.0625rem; font-weight: 700; border-bottom: 2px solid var(--primary); padding-bottom: 7px; display: flex; justify-content: space-between; align-items: baseline; }
.pd-h small { font-size: 12.5px; font-weight: 600; color: var(--sub-text); }
.pd-h.sm { font-size: .9375rem; border-bottom-width: 1px; border-bottom-color: var(--border); color: var(--sub-text); }
.pd-sub { margin: 0; color: var(--sub-text); font-size: 13.5px; line-height: 1.55; }
.pd-scanbtn { display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 4px; background: var(--accent); color: #fff; font: inherit; font-size: 1.0625rem; font-weight: 800; padding: 18px; box-shadow: 0 4px 6px -1px rgba(56,189,248,.3); cursor: pointer; }
.pd-scanbtn:hover { background: var(--accent-hover); }
.pd-ghost { flex: 1; border: 1px solid var(--border); background: #fff; color: var(--text); border-radius: 4px; font: inherit; font-weight: 600; font-size: .9375rem; padding: 12px; cursor: pointer; }
.pd-ghost:hover { background: var(--muted-background); border-color: var(--sub-text); }
.pd-row { display: flex; gap: 8px; }
.pd-list { display: flex; flex-direction: column; gap: 6px; }
.pd-list button { display: flex; align-items: center; gap: 10px; text-align: left; border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 13px 12px; font: inherit; cursor: pointer; }
.pd-list button:hover { border-color: var(--primary); }
.pd-bedtag { background: #e8f0f9; color: var(--primary); border-radius: 4px; padding: 2px 8px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.pd-list b { flex: 1; } .pd-list em { font-style: normal; color: var(--sub-text); font-size: 13px; }
.pd-pt { margin: 12px 16px 0; padding: 12px 14px; background: #fff; border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 4px; }
.pd-pn { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; } .pd-pn b { font-size: 1.125rem; } .pd-pn span { color: var(--sub-text); font-size: 13.5px; }
.pd-pn em { font-style: normal; margin-left: auto; background: #e8f0f9; color: var(--primary); font-size: 12.5px; font-weight: 700; border-radius: 4px; padding: 2px 8px; }
.pd-ps { margin-top: 3px; color: var(--sub-text); font-size: 13px; }
.pd-allg { margin-top: 8px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 4px; padding: 5px 9px; font-weight: 700; font-size: 13px; }
.pd-med { background: #fff; border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 4px; padding: 11px 13px; display: flex; flex-direction: column; gap: 4px; }
.pd-med.late { border-left-color: #d97706; background: #fffbeb; } .pd-med.done { border-left-color: #16a34a; opacity: .7; }
.pd-mt { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; } .pd-mt b { font-size: 15.5px; }
.pd-ms { color: var(--sub-text); font-size: 13.5px; }
.pd-chip { flex: none; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e8f0f9; color: var(--primary); }
.pd-chip.late { background: #fef3c7; color: #92400e; } .pd-chip.done { background: #dcfce7; color: #166534; } .pd-chip.prn { background: #f1f5f9; color: #475569; }
.pd-link { align-self: flex-start; border: 0; background: none; color: var(--primary); font: inherit; font-size: 12.5px; font-weight: 600; padding: 4px 0 0; text-decoration: underline; cursor: pointer; }
.pd-err { flex: 1; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 4px; font: inherit; font-size: 13px; font-weight: 600; padding: 10px; cursor: pointer; }
.pd-chk { list-style: none; margin: 0; padding: 0; background: #fff; border: 1px solid var(--border); border-radius: 4px; }
.pd-chk li { display: flex; align-items: center; gap: 10px; padding: 12px 13px; border-bottom: 1px solid var(--border); } .pd-chk li:last-child { border-bottom: 0; }
.pd-chk i { flex: none; width: 24px; height: 24px; border-radius: 50%; font-style: normal; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
.pd-chk .k { width: 38px; flex: none; font-weight: 700; } .pd-chk .t { flex: 1; font-size: 14px; }
.pd-chk li.ok i { background: #16a34a; } .pd-chk li.bad { background: #fef2f2; } .pd-chk li.bad i { background: #dc2626; } .pd-chk li.bad .t { color: #b91c1c; font-weight: 700; }
.pd-chk li.warn { background: #fffbeb; } .pd-chk li.warn i { background: #d97706; } .pd-chk li.warn .t { color: #92400e; font-weight: 700; }
.pd-warn { margin: 0; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; padding: 9px 11px; font-size: 13.5px; font-weight: 600; }
.pd-sticky { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; display: flex; gap: 8px; max-width: 560px; margin: 0 auto; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: rgba(255,255,255,.96); border-top: 1px solid var(--border); }
.pd-sticky .pd-ghost { flex: 0 0 90px; }
.pd-go { flex: 1; border: 0; border-radius: 4px; background: var(--primary); color: #fff; font: inherit; font-size: 1rem; font-weight: 800; padding: 14px; cursor: pointer; }
.pd-go:hover:not(:disabled) { background: var(--primary-hover); } .pd-go:disabled { background: #cbd5e1; cursor: not-allowed; }
.pd-cam { position: relative; background: #0b1220; border-radius: 4px; overflow: hidden; aspect-ratio: 3 / 4; }
.pd-cam video { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-frame { position: absolute; inset: 20% 16%; border-radius: 6px; box-shadow: 0 0 0 999px rgba(8,20,40,.45);
  background: linear-gradient(var(--accent),var(--accent)) top left / 28px 4px no-repeat, linear-gradient(var(--accent),var(--accent)) top left / 4px 28px no-repeat,
  linear-gradient(var(--accent),var(--accent)) top right / 28px 4px no-repeat, linear-gradient(var(--accent),var(--accent)) top right / 4px 28px no-repeat,
  linear-gradient(var(--accent),var(--accent)) bottom left / 28px 4px no-repeat, linear-gradient(var(--accent),var(--accent)) bottom left / 4px 28px no-repeat,
  linear-gradient(var(--accent),var(--accent)) bottom right / 28px 4px no-repeat, linear-gradient(var(--accent),var(--accent)) bottom right / 4px 28px no-repeat; }
.pd-hint { position: absolute; left: 0; right: 0; bottom: 12px; text-align: center; color: #fff; font-size: 13px; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.pd-man { display: flex; gap: 6px; } .pd-man input { flex: 1; padding: 10px !important; font-size: 13px; } .pd-man button { border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 0 14px; font: inherit; font-weight: 600; }
.pd-scan { display: flex; flex-direction: column; gap: 8px; }
.pd-qrs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pd-qr { background: #fff; border: 1px solid var(--border); border-radius: 4px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; font-size: 12.5px; } .pd-qr.wide { grid-column: 1 / -1; }
.pd-qr span { color: var(--sub-text); }
`;
