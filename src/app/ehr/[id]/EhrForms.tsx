'use client';

import type { Row } from '../types';

export type FormKey = 'morse' | 'braden' | 'pain' | 'preop';
export const FORMS: { key: FormKey; tab: `f_${FormKey}`; label: string; title: string }[] = [
  { key: 'morse', tab: 'f_morse', label: '낙상위험', title: '낙상위험 평가도구 (Morse Fall Scale)' },
  { key: 'braden', tab: 'f_braden', label: '욕창위험', title: '욕창위험 평가도구 (Braden Scale)' },
  { key: 'pain', tab: 'f_pain', label: '통증사정', title: '통증사정 기록지' },
  { key: 'preop', tab: 'f_preop', label: '수술 전 확인', title: '수술 전 준비확인서' },
];

type Item = { q: string; opts: { t: string; s: number }[] };

const MORSE: Item[] = [
  { q: '낙상 과거력 (최근 3개월)', opts: [{ t: '없음', s: 0 }, { t: '있음', s: 25 }] },
  { q: '이차 진단', opts: [{ t: '없음', s: 0 }, { t: '있음', s: 15 }] },
  { q: '보행 보조', opts: [{ t: '없음 / 침상안정 / 간호사 보조', s: 0 }, { t: '목발 / 지팡이 / 보행기', s: 15 }, { t: '가구에 의지', s: 30 }] },
  { q: '정맥주입 / 헤파린 락', opts: [{ t: '없음', s: 0 }, { t: '있음', s: 20 }] },
  { q: '걸음걸이', opts: [{ t: '정상 / 침상안정 / 휠체어', s: 0 }, { t: '허약', s: 10 }, { t: '장애', s: 20 }] },
  { q: '정신 상태', opts: [{ t: '자신의 능력을 안다', s: 0 }, { t: '능력을 과대평가하거나 잊어버림', s: 15 }] },
];
const BRADEN: Item[] = [
  { q: '감각 인지', opts: [{ t: '완전 제한', s: 1 }, { t: '매우 제한', s: 2 }, { t: '약간 제한', s: 3 }, { t: '장애 없음', s: 4 }] },
  { q: '습기', opts: [{ t: '항상 젖어 있음', s: 1 }, { t: '자주 젖음', s: 2 }, { t: '가끔 젖음', s: 3 }, { t: '거의 젖지 않음', s: 4 }] },
  { q: '활동', opts: [{ t: '침상 안정', s: 1 }, { t: '의자 생활', s: 2 }, { t: '가끔 보행', s: 3 }, { t: '자주 보행', s: 4 }] },
  { q: '기동성', opts: [{ t: '완전 부동', s: 1 }, { t: '매우 제한', s: 2 }, { t: '약간 제한', s: 3 }, { t: '제한 없음', s: 4 }] },
  { q: '영양', opts: [{ t: '매우 불량', s: 1 }, { t: '부적절', s: 2 }, { t: '적절', s: 3 }, { t: '우수', s: 4 }] },
  { q: '마찰과 전단력', opts: [{ t: '문제 있음', s: 1 }, { t: '잠재적 문제', s: 2 }, { t: '문제 없음', s: 3 }] },
];
const PAIN_QUALITY = ['쑤심', '찌름', '욱신거림', '타는 듯함', '조임', '뻗침', '쥐어짜는 듯함'];
const PREOP: string[] = [
  '환자 확인 (팔찌, 이름, 등록번호)',
  '수술 동의서',
  '마취 동의서',
  '수술 부위 표시',
  '금식 (NPO) 확인',
  '틀니, 보청기, 렌즈, 장신구 제거',
  '화장, 매니큐어 제거',
  '배뇨 (필요 시 도뇨)',
  '수술 전 투약',
  '검사 결과 확인 (혈액, 영상, 심전도)',
  '활력징후 측정',
  '알레르기 확인',
  '혈액 준비',
];

const sum = (items: Item[], r: Row) => items.reduce((a, it, i) => {
  const k = r[`q${i}`];
  return k === undefined || k === '' ? a : a + (it.opts[Number(k)]?.s ?? 0);
}, 0);
const done = (items: Item[], r: Row) => items.every((_, i) => r[`q${i}`] !== undefined && r[`q${i}`] !== '');

const morseLevel = (n: number) => (n >= 45 ? { t: '고위험', c: 'hi' } : n >= 25 ? { t: '중위험', c: 'md' } : { t: '저위험', c: '' });
const bradenLevel = (n: number) => (n <= 9 ? { t: '초고위험', c: 'hi' } : n <= 12 ? { t: '고위험', c: 'hi' } : n <= 14 ? { t: '중등도 위험', c: 'md' } : n <= 18 ? { t: '경미한 위험', c: '' } : { t: '위험 낮음', c: '' });

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// 교수 열람 화면용 한 줄 요약
export function formLine(kind: FormKey, r: Row): string {
  if (kind === 'morse' || kind === 'braden') {
    const items = kind === 'morse' ? MORSE : BRADEN;
    if (!done(items, r)) return '미완료';
    const n = sum(items, r);
    return `${n}점 ${(kind === 'morse' ? morseLevel(n) : bradenLevel(n)).t}`;
  }
  if (kind === 'pain') return [r.nrs ? `NRS ${r.nrs}` : '', r.site, r.quality].filter(Boolean).join(' · ');
  const yes = PREOP.filter((_, i) => r[`p${i}`] === '예').length;
  return `확인 ${yes}/${PREOP.length}${r.memo ? ` · ${r.memo}` : ''}`;
}

export default function FormPanel({ kind, rows, onChange }: { kind: FormKey; rows: Row[]; onChange: (rows: Row[]) => void }) {
  const meta = FORMS.find(f => f.key === kind)!;
  const items = kind === 'morse' ? MORSE : kind === 'braden' ? BRADEN : [];
  const set = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([{ time: stamp() }, ...rows]);
  const del = (i: number) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="fm">
      <div className="fmh">
        <h4 className="ph">{meta.title}</h4>
        <button type="button" className="add" onClick={add}>+ 평가 추가</button>
      </div>
      {rows.length === 0 && <p className="none">평가 기록이 없어요. 평가 추가를 눌러 시작하세요.</p>}
      {rows.map((r, i) => {
        const head = (
          <div className="fmt">
            <input value={r.time || ''} onChange={e => set(i, 'time', e.target.value)} aria-label="평가일시" />
            <button type="button" className="x" aria-label="삭제" onClick={() => del(i)}>×</button>
          </div>
        );

        if (kind === 'morse' || kind === 'braden') {
          const total = sum(items, r);
          const ok = done(items, r);
          const lv = kind === 'morse' ? morseLevel(total) : bradenLevel(total);
          return (
            <div key={i} className="fc">
              {head}
              {items.map((it, qi) => (
                <div key={qi} className="fq">
                  <b>{it.q}</b>
                  <div className="fo">
                    {it.opts.map((o, oi) => (
                      <label key={oi} className={r[`q${qi}`] === String(oi) ? 'on' : ''}>
                        <input type="radio" name={`${kind}-${i}-${qi}`} checked={r[`q${qi}`] === String(oi)} onChange={() => set(i, `q${qi}`, String(oi))} />
                        {o.t}<i>{o.s}점</i>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className={`ft ${ok ? lv.c : ''}`}>
                <span>합계 <b>{total}</b>점</span>
                {ok ? <em>{lv.t}</em> : <em className="pend">모든 항목을 선택하세요</em>}
              </div>
              <p className="rf">{kind === 'morse' ? '고위험 45점 이상 · 중위험 25~44점 · 저위험 0~24점' : '초고위험 9점 이하 · 고위험 10~12점 · 중등도 13~14점 · 경미 15~18점'}</p>
            </div>
          );
        }

        if (kind === 'pain') {
          const nrs = (k: string) => (
            <div className="nrs">
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} type="button" className={`${r[k] === String(n) ? 'on' : ''} n${n >= 7 ? 'h' : n >= 4 ? 'm' : 'l'}`} onClick={() => set(i, k, String(n))}>{n}</button>
              ))}
            </div>
          );
          return (
            <div key={i} className="fc">
              {head}
              <div className="fq"><b>통증 정도 (NRS 0~10)</b>{nrs('nrs')}</div>
              <div className="fq"><b>통증 부위</b><input value={r.site || ''} placeholder="예: 우하복부, 수술 부위" onChange={e => set(i, 'site', e.target.value)} /></div>
              <div className="fq">
                <b>통증 양상</b>
                <div className="fo">
                  {PAIN_QUALITY.map(q => {
                    const on = (r.quality || '').split(',').includes(q);
                    return (
                      <label key={q} className={on ? 'on' : ''}>
                        <input type="checkbox" checked={on} onChange={() => { const cur = (r.quality || '').split(',').filter(Boolean); set(i, 'quality', (on ? cur.filter(x => x !== q) : [...cur, q]).join(',')); }} />
                        {q}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="fq">
                <b>지속 양상</b>
                <div className="fo">
                  {['지속적', '간헐적', '움직일 때'].map(v => (
                    <label key={v} className={r.pattern === v ? 'on' : ''}><input type="radio" name={`pain-${i}-pt`} checked={r.pattern === v} onChange={() => set(i, 'pattern', v)} />{v}</label>
                  ))}
                </div>
              </div>
              <div className="fq"><b>악화 요인</b><input value={r.worse || ''} onChange={e => set(i, 'worse', e.target.value)} /></div>
              <div className="fq"><b>완화 요인</b><input value={r.better || ''} onChange={e => set(i, 'better', e.target.value)} /></div>
              <div className="fq"><b>중재</b><textarea rows={2} value={r.act || ''} placeholder="예: 진통제 투여, 자세 변경, 냉찜질" onChange={e => set(i, 'act', e.target.value)} /></div>
              <div className="fq"><b>재평가 (NRS)</b>{nrs('re')}</div>
            </div>
          );
        }

        // 수술 전 준비확인서
        return (
          <div key={i} className="fc">
            {head}
            <table className="pt">
              <thead><tr><th>확인 항목</th><th>예</th><th>아니오</th><th>해당없음</th></tr></thead>
              <tbody>
                {PREOP.map((q, qi) => (
                  <tr key={qi}>
                    <td>{q}</td>
                    {['예', '아니오', '해당없음'].map(v => (
                      <td key={v}><input type="radio" name={`po-${i}-${qi}`} aria-label={`${q} ${v}`} checked={r[`p${qi}`] === v} onChange={() => set(i, `p${qi}`, v)} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="fq"><b>금식 시작 시간</b><input value={r.npo || ''} placeholder="예: 전날 22:00" onChange={e => set(i, 'npo', e.target.value)} /></div>
            <div className="fq"><b>비고</b><textarea rows={2} value={r.memo || ''} onChange={e => set(i, 'memo', e.target.value)} /></div>
          </div>
        );
      })}
    </div>
  );
}

export const FORM_CSS = `
  .ehr .fmh { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .ehr .fc { border: 1px solid var(--ln); background: #fff; padding: 12px 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
  .ehr .fmt { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .ehr .fmt input { border: 1px solid var(--ln); padding: 4px 8px; font: inherit; font-size: 12.5px; width: 130px; }
  .ehr .fmt .x { border: 0; background: none; font-size: 18px; color: #64748b; cursor: pointer; }
  .ehr .fq { display: flex; flex-direction: column; gap: 6px; }
  .ehr .fq > b { font-size: 12.5px; color: #334155; }
  .ehr .fq input:not([type=radio]):not([type=checkbox]), .ehr .fq textarea { border: 1px solid var(--ln); padding: 6px 8px; font: inherit; font-size: 13px; width: 100%; box-sizing: border-box; }
  .ehr .fo { display: flex; flex-wrap: wrap; gap: 6px; }
  .ehr .fo label { display: flex; align-items: center; gap: 6px; border: 1px solid var(--ln); border-radius: 999px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; background: #fff; }
  .ehr .fo label.on { border-color: #1d4e89; background: #e8f0fb; color: #1d4e89; font-weight: 700; }
  .ehr .fo label input { position: absolute; opacity: 0; pointer-events: none; }
  .ehr .fo label i { font-style: normal; font-size: 11px; opacity: .7; }
  .ehr .ft { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #eef2f6; font-size: 13.5px; }
  .ehr .ft b { font-size: 16px; }
  .ehr .ft em { font-style: normal; font-weight: 800; color: #1d4e89; }
  .ehr .ft em.pend { color: #94a3b8; font-weight: 600; }
  .ehr .ft.md { background: #fde9c8; } .ehr .ft.md em { color: #9a5b00; }
  .ehr .ft.hi { background: #fbd5d5; } .ehr .ft.hi em { color: #b91c1c; }
  .ehr .rf { margin: 0; font-size: 11.5px; color: #64748b; }
  .ehr .nrs { display: flex; flex-wrap: wrap; gap: 4px; }
  .ehr .nrs button { width: 34px; height: 34px; border: 1px solid var(--ln); background: #fff; font: inherit; font-size: 13px; cursor: pointer; }
  .ehr .nrs button.on { color: #fff; border-color: transparent; font-weight: 800; }
  .ehr .nrs button.on.nl { background: #16a34a; } .ehr .nrs button.on.nm { background: #ca8a04; } .ehr .nrs button.on.nh { background: #dc2626; }
  .ehr .pt { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ehr .pt th, .ehr .pt td { border: 1px solid var(--ln); padding: 6px 8px; }
  .ehr .pt th { background: #e9edf1; font-size: 12px; } .ehr .pt td + td, .ehr .pt th + th { text-align: center; width: 70px; }
`;

// 병상 배지용: 평가 점수 (미완료면 null)
export function formScore(kind: 'morse' | 'braden', r: Row): number | null {
  const items = kind === 'morse' ? MORSE : BRADEN;
  return done(items, r) ? sum(items, r) : null;
}
