'use client';

import { useState } from 'react';
import type { ChartData, Row } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const nowMD = () => { const d = new Date(); return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

const SLOTS: Record<number, string[]> = { 1: ['09:00'], 2: ['09:00', '21:00'], 3: ['08:00', '13:00', '18:00'], 4: ['06:00', '12:00', '18:00', '24:00'], 5: ['06:00', '10:00', '14:00', '18:00', '22:00'], 6: ['04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] };
const slotsOf = (cnt: string | undefined) => SLOTS[Math.min(6, Math.max(1, parseInt((cnt || '').replace(/\D/g, ''), 10) || 1))];

// 알레르기 문구에서 약 이름 조각을 뽑아 처방명과 겹치는지 본다
const allergyHit = (allergy: string | undefined, drug: string) => {
  const a = (allergy || '').trim();
  if (!a || /^(무|없음|nka|nkda)$/i.test(a)) return '';
  const toks = a.split(/[\s,()/·]+/).filter(t => t.length >= 2 && !/발진|두드러기|쇼크|아나필락시스|호흡곤란|있음|유/.test(t));
  return toks.find(t => drug.toLowerCase().includes(t.toLowerCase())) || '';
};

const RIGHTS = ['정확한 환자', '정확한 약물', '정확한 용량', '정확한 경로', '정확한 시간'] as const;

type Med = { i: number; r: Row };

export default function MarPanel({ data, author, onChange }: { data: ChartData; author: string; onChange: (orders: Row[], mar: Row[]) => void }) {
  const meds: Med[] = data.orders.map((r, i) => ({ i, r })).filter(({ r }) => r.kind !== 'sec' && r.kind !== 'memo' && (r.dose || r.route) && !/^check/i.test(r.name || ''));
  const [open, setOpen] = useState<string | null>(null);
  const [ck, setCk] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const today = nowMD();
  const done = (name: string, slot: string) => data.mar.find(m => m.name === name && m.slot === slot && (m.time || '').startsWith(today));
  const close = () => { setOpen(null); setCk({}); setNote(''); };

  const give = (med: Med, slot: string, k: number) => {
    const hm = nowHM();
    const row: Row = { time: `${today} ${hm}`, name: med.r.name || '', dose: `${med.r.dose || ''}${med.r.unit || ''}`, route: med.r.route || '', slot, by: author, ...(note.trim() ? { note: note.trim() } : {}) };
    const orders = data.orders.map((o, i) => (i === med.i ? { ...o, [`t${k + 1}`]: hm, ck: '1' } : o));
    onChange(orders, [row, ...data.mar]);
    close();
  };

  return (
    <div className="mr">
      <style>{`
        .mr { display: flex; flex-direction: column; gap: 10px; }
        .mr .none { color: var(--sub-text); font-size: 13px; }
        .mr .md { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
        .mr .md .nm { font-weight: 700; font-size: 14px; }
        .mr .md .sb { font-size: 12.5px; color: var(--sub-text); }
        .mr .sl { display: flex; flex-wrap: wrap; gap: 6px; }
        .mr .sl button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; cursor: pointer; }
        .mr .sl button.dn { background: color-mix(in srgb, #059669 14%, transparent); border-color: #059669; color: #047857; font-weight: 700; cursor: default; }
        .mr .sl button.on { border-color: var(--primary); color: var(--primary); font-weight: 700; }
        .mr .fv { border-top: 1px dashed var(--border); padding-top: 8px; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; }
        .mr .fv label { display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .mr .fv .wn { color: #b91c1c; font-weight: 700; }
        .mr .fv textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border); border-radius: 8px; padding: 8px; font: inherit; background: transparent; color: inherit; }
        .mr .fv .go { align-self: flex-end; border: 0; background: var(--primary); color: #fff; border-radius: 999px; padding: 8px 20px; font: inherit; font-weight: 700; cursor: pointer; }
        .mr .fv .go:disabled { opacity: .4; cursor: default; }
        .mr h5 { margin: 6px 0 0; font-size: 13px; }
        .mr .lg { font-size: 13px; line-height: 1.7; border-bottom: 1px solid var(--border); padding: 4px 0; }
      `}</style>
      {meds.length === 0 && <p className="none">투약 처방이 없어요. 의사처방에 약물을 먼저 입력하세요.</p>}
      {meds.map(med => {
        const slots = slotsOf(med.r.cnt);
        const name = med.r.name || '';
        const warn = allergyHit(data.info.allergy, name);
        return (
          <div key={med.i} className="md">
            <div className="nm">{name}</div>
            <div className="sb">{[med.r.dose && `${med.r.dose}${med.r.unit || ''}`, med.r.route, med.r.cnt && `하루 ${med.r.cnt}회`].filter(Boolean).join(' · ')}</div>
            <div className="sl">
              {slots.map((s, k) => {
                const d = done(name, s);
                const key = `${med.i}-${s}`;
                return d
                  ? <button key={s} type="button" className="dn" disabled>{s} 수행 {(d.time || '').slice(6)}</button>
                  : <button key={s} type="button" className={open === key ? 'on' : ''} onClick={() => { setCk({}); setNote(''); setOpen(open === key ? null : key); }}>{s} 투약</button>;
              })}
            </div>
            {slots.map((s, k) => {
              const key = `${med.i}-${s}`;
              if (open !== key) return null;
              const need = [...RIGHTS.map((_, n) => `r${n}`), ...(warn ? ['al'] : [])];
              const ready = need.every(n => ck[n]);
              return (
                <div key={key} className="fv">
                  <label><input type="checkbox" checked={!!ck.r0} onChange={e => setCk(c => ({ ...c, r0: e.target.checked }))} />정확한 환자: 팔찌의 이름과 등록번호({data.info.name || '-'} · {data.info.ptNo || '-'})를 두 가지로 확인</label>
                  <label><input type="checkbox" checked={!!ck.r1} onChange={e => setCk(c => ({ ...c, r1: e.target.checked }))} />정확한 약물: {name}</label>
                  <label><input type="checkbox" checked={!!ck.r2} onChange={e => setCk(c => ({ ...c, r2: e.target.checked }))} />정확한 용량: {med.r.dose}{med.r.unit}</label>
                  <label><input type="checkbox" checked={!!ck.r3} onChange={e => setCk(c => ({ ...c, r3: e.target.checked }))} />정확한 경로: {med.r.route || '-'}</label>
                  <label><input type="checkbox" checked={!!ck.r4} onChange={e => setCk(c => ({ ...c, r4: e.target.checked }))} />정확한 시간: {s} 전후 30분 이내</label>
                  {warn && <label className="wn"><input type="checkbox" checked={!!ck.al} onChange={e => setCk(c => ({ ...c, al: e.target.checked }))} />알레르기 주의: {data.info.allergy}. 처방의에게 확인했나요?</label>}
                  <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="특이사항 (선택)" aria-label="특이사항" />
                  <button type="button" className="go" disabled={!ready} onClick={() => give(med, s, k)}>투약 완료</button>
                </div>
              );
            })}
          </div>
        );
      })}
      {data.mar.length > 0 && (
        <>
          <h5>투약 기록</h5>
          {data.mar.map((m, i) => (
            <div key={i} className="lg">{m.time} · {m.name} {m.dose} {m.route} · {m.by}{m.note ? ` · ${m.note}` : ''}</div>
          ))}
        </>
      )}
    </div>
  );
}
