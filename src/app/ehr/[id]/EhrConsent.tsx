'use client';

import { vnow } from '../vclock';
import { useState } from 'react';
import { DOCTORS } from '../directory';
import type { Row } from '../types';

type Tpl = { name: string; purpose: string; method: string; risk: string; alt: string; extra?: string };

// 연습용 기본 템플릿 (실제 병원 서식이 아님)
export const CONSENT_TPL: Tpl[] = [
  { name: '수술 동의서', purpose: '질병의 치료를 위해 수술을 시행합니다.', method: '마취 후 수술 부위를 절개하여 병변을 제거하거나 교정합니다.', risk: '출혈, 감염, 마취 관련 합병증, 주변 장기 손상, 재수술 가능성', alt: '약물치료 또는 경과 관찰', extra: '수술 부위와 수술명이 동의서와 일치하는지 확인' },
  { name: '마취 동의서', purpose: '수술이나 시술 중 통증과 의식을 조절하기 위해 마취를 시행합니다.', method: '전신마취, 척추마취, 국소마취 중 환자 상태에 맞는 방법을 선택합니다.', risk: '구역·구토, 저혈압, 호흡 억제, 알레르기 반응, 드물게 심정지', alt: '마취 범위나 방법의 변경', extra: '금식 시간과 틀니·보철물 제거 확인' },
  { name: '수혈 동의서', purpose: '빈혈이나 출혈로 부족한 혈액 성분을 보충합니다.', method: '혈액 제제를 정맥으로 투여하고 활력징후를 관찰합니다.', risk: '발열, 두드러기, 용혈 반응, 수혈 관련 폐손상, 감염 위험', alt: '철분제 등 약물치료, 수술 전 자가 혈액 준비' },
  { name: '침습적 시술·검사 동의서', purpose: '진단이나 치료를 위해 시술 또는 검사를 시행합니다.', method: '국소마취 후 카테터나 바늘 등을 삽입합니다.', risk: '출혈, 감염, 통증, 장기 손상, 시술 실패', alt: '비침습적 검사 또는 경과 관찰' },
  { name: '조영제 사용 동의서', purpose: '영상검사에서 병변을 더 정확히 보기 위해 조영제를 사용합니다.', method: '조영제를 정맥으로 주입한 뒤 영상을 촬영합니다.', risk: '구역, 발진, 아나필락시스, 신기능 악화, 혈관 외 유출', alt: '조영제 없이 검사', extra: '알레르기 과거력, 신기능(Cr), 당뇨약(메트포르민) 복용 확인' },
  { name: '입원 동의서', purpose: '치료와 검사를 위해 입원하여 진료를 받습니다.', method: '입원 기간 동안 병원 규정에 따라 치료와 간호를 받습니다.', risk: '낙상, 병원 감염 등 입원 중 발생할 수 있는 위험', alt: '외래 통원 치료' },
  { name: '신체보호대 사용 동의서', purpose: '환자의 안전을 위해 최소한의 기간 동안 신체보호대를 사용합니다.', method: '의사 처방에 따라 보호대를 적용하고 주기적으로 관찰하고 풀어 줍니다.', risk: '피부 손상, 순환 장애, 불안·흥분, 욕창', alt: '보호자 상주, 환경 조정, 약물 조절' },
  { name: '개인정보 수집·이용 동의서', purpose: '진료와 간호 제공을 위해 개인정보를 수집하고 이용합니다.', method: '의료법 등 관련 법령에 따라 보관하며 목적 외로 사용하지 않습니다.', risk: '동의를 거부할 수 있으나 일부 진료가 제한될 수 있습니다.', alt: '해당 없음' },
];

const CHECKS = ['환자 본인 확인 (이름·환자번호)', '설명 내용을 환자가 이해했는지 확인', '자발적으로 동의했는지 확인', '서명·일시·설명 의사 누락 여부 확인', '시술·수술명과 부위가 일치하는지 확인'];
const today = () => { const d = vnow(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ckList = (r: Row) => (r.ck || '').split(',').filter(Boolean);

export default function ConsentPanel({ rows, dept, onChange }: { rows: Row[]; dept?: string; onChange: (rows: Row[]) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const [msg, setMsg] = useState<Record<number, string>>({});
  const docs = DOCTORS.filter(d => !dept || d.dept === dept);
  const set = (i: number, patch: Row) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = (t: Tpl) => { onChange([{ name: t.name, date: today(), st: '작성' }, ...rows]); setOpen(0); };

  const toggleCk = (i: number, n: number) => {
    const cur = new Set(ckList(rows[i]));
    const k = String(n);
    if (cur.has(k)) cur.delete(k); else cur.add(k);
    set(i, { ck: [...cur].sort().join(','), chk: `${cur.size}/${CHECKS.length} 확인` });
  };
  const sign = (i: number) => {
    const r = rows[i];
    const miss: string[] = [];
    if (!r.doctor) miss.push('설명 의사');
    if (!r.signer) miss.push('서명자');
    if (r.signer === '법정대리인' && !r.rel) miss.push('대리인 관계');
    if (!r.sig?.trim()) miss.push('서명');
    CHECKS.forEach((c, n) => { if (!ckList(r).includes(String(n))) miss.push(c); });
    if (miss.length) { setMsg(m => ({ ...m, [i]: `빠진 항목: ${miss.join(', ')}` })); return; }
    setMsg(m => ({ ...m, [i]: '' }));
    set(i, { st: '서명완료' });
  };

  return (
    <div className="cs">
      <style>{`
        .cs { display: flex; flex-direction: column; gap: 10px; }
        .cs .tp { display: flex; flex-wrap: wrap; gap: 6px; }
        .cs .tp button, .cs .st button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; cursor: pointer; }
        .cs .cd { border: 1px solid var(--border); border-radius: 10px; }
        .cs .hd { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; }
        .cs .hd b { flex: 1; font-size: 14px; }
        .cs .hd .sx { font-size: 11.5px; font-weight: 800; padding: 2px 9px; border-radius: 999px; background: #eef2f7; color: #475569; }
        .cs .hd .sx.ok { background: #dcfce7; color: #15803d; }
        .cs .hd .sx.no { background: #fee2e2; color: #b91c1c; }
        .cs .hd .x { border: 0; background: transparent; color: inherit; font-size: 18px; cursor: pointer; }
        .cs .bd { border-top: 1px solid var(--border); padding: 12px; display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; }
        .cs .tx { background: var(--muted-background); border-radius: 8px; padding: 10px 12px; line-height: 1.65; }
        .cs .tx p { margin: 0 0 4px; }
        .cs .tx b { color: var(--sub-text); font-weight: 700; margin-right: 4px; }
        .cs .gr { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .cs label.f { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--sub-text); }
        .cs input[type=text], .cs input[type=date], .cs select { border: 1px solid var(--border); border-radius: 8px; padding: 7px 9px; font: inherit; font-size: 14px; background: transparent; color: var(--text, inherit); min-width: 0; }
        .cs .ck label { display: flex; gap: 8px; align-items: flex-start; padding: 3px 0; }
        .cs .st { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .cs .st button.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .cs .warn { color: #b91c1c; font-weight: 700; font-size: 13px; }
      `}</style>
      <div className="tp">{CONSENT_TPL.map(t => <button key={t.name} type="button" onClick={() => add(t)}>+ {t.name}</button>)}</div>
      {rows.length === 0 && <p style={{ color: 'var(--sub-text)', fontSize: 13 }}>No data to display</p>}
      {rows.map((r, i) => {
        const t = CONSENT_TPL.find(x => x.name === r.name);
        const done = r.st === '서명완료';
        return (
          <div key={i} className="cd">
            <div className="hd" onClick={() => setOpen(open === i ? null : i)}>
              <b>{r.name || '동의서'}</b>
              <span className={`sx ${done ? 'ok' : r.st === '거부' ? 'no' : ''}`}>{r.st || '작성'}</span>
              <button type="button" className="x" aria-label="삭제" onClick={e => { e.stopPropagation(); onChange(rows.filter((_, j) => j !== i)); }}>×</button>
            </div>
            {open === i && (
              <div className="bd">
                {t && (
                  <div className="tx">
                    <p><b>목적</b>{t.purpose}</p>
                    <p><b>방법</b>{t.method}</p>
                    <p><b>위험</b>{t.risk}</p>
                    <p><b>대안</b>{t.alt}</p>
                    <p><b>환자의 권리</b>동의 후에도 언제든 철회할 수 있습니다.</p>
                    {t.extra && <p><b>간호 확인</b>{t.extra}</p>}
                  </div>
                )}
                <div className="gr">
                  <label className="f">설명 의사
                    <select value={r.doctor || ''} onChange={e => set(i, { doctor: e.target.value })}><option value="" />{docs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</select>
                  </label>
                  <label className="f">설명 일자<input type="date" value={r.date || ''} onChange={e => set(i, { date: e.target.value })} /></label>
                  <label className="f">서명자
                    <select value={r.signer || ''} onChange={e => set(i, { signer: e.target.value })}><option value="" /><option value="본인">본인</option><option value="법정대리인">법정대리인</option></select>
                  </label>
                  {r.signer === '법정대리인' && <label className="f">환자와의 관계<input type="text" value={r.rel || ''} onChange={e => set(i, { rel: e.target.value })} /></label>}
                  <label className="f">서명 (이름 입력)<input type="text" value={r.sig || ''} onChange={e => set(i, { sig: e.target.value })} /></label>
                  <label className="f">증인<input type="text" value={r.witness || ''} onChange={e => set(i, { witness: e.target.value })} /></label>
                </div>
                <div className="ck">
                  <b style={{ fontSize: 13 }}>간호사 확인</b>
                  {CHECKS.map((c, n) => <label key={n}><input type="checkbox" checked={ckList(r).includes(String(n))} onChange={() => toggleCk(i, n)} />{c}</label>)}
                </div>
                <div className="st">
                  {(['작성', '서명완료', '거부'] as const).map(s => (
                    <button key={s} type="button" className={r.st === s ? 'on' : ''} onClick={() => (s === '서명완료' ? sign(i) : set(i, { st: s }))}>{s}</button>
                  ))}
                  {msg[i] && <span className="warn">{msg[i]}</span>}
                </div>
                <label className="f">비고<input type="text" value={r.note || ''} onChange={e => set(i, { note: e.target.value })} /></label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
