'use client';

import { useMemo, useState } from 'react';

type Sub = { s: string; items: string[] };
type Kind = { t: 'sel'; o: string[] } | { t: 'num'; u?: string } | { t: 'txt' };
const REASON = ['입원 시', '상태 변화 시', '수술·시술 후', '정기 평가', '낙상 발생 후'];
const SITES = ['머리', '목', '어깨', '가슴', '복부', '허리', '엉덩이', '팔', '다리', '수술부위'];
// 항목별 입력 방식. 없는 항목은 체크만 하면 '시행'으로 기록된다.
const KIND: Record<string, Kind> = {
  '낙상 평가 사유': { t: 'sel', o: REASON },
  '욕창 평가 사유': { t: 'sel', o: REASON.slice(0, 4) },
  '통증 평가 사유': { t: 'sel', o: REASON.slice(0, 4) },
  '욕창위험 평가도구(Braden)': { t: 'num', u: '점 (6~23)' },
  '통증유무': { t: 'sel', o: ['있음', '없음'] },
  '통증 시작시기': { t: 'sel', o: ['급성', '만성', '수술 후', '1시간 이내', '어제부터'] },
  '통증강도(척도)': { t: 'sel', o: ['NRS', 'FACES', 'FLACC'] },
  '통증위치': { t: 'sel', o: SITES },
  '통증강도(점수)': { t: 'sel', o: Array.from({ length: 11 }, (_, i) => String(i)) },
  '통증양상': { t: 'sel', o: ['쑤심', '찌름', '욱신거림', '타는 듯함', '조임', '뻗침', '쥐어짜는 듯함'] },
  '비약물요법': { t: 'sel', o: ['냉찜질', '온찜질', '자세변경', '이완요법', '마사지', '주의 분산'] },
  '약물요법': { t: 'sel', o: ['처방 진통제 투여', 'PRN 진통제 투여'] },
  '제외대상(고위험중재 대상)': { t: 'sel', o: ['해당', '해당 없음'] },
};

export default function GroupRec({ cat, hours, defHour, get, onSave }: {
  cat: { g: string; guide: string; subs: Sub[] };
  hours: string[]; defHour: string;
  get: (it: string, h: string) => string;
  onSave: (vals: Record<string, string>, h: string) => void;
}) {
  const [h, setH] = useState(defHour);
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [val, setVal] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const all = useMemo(() => cat.subs.flatMap(s => s.items), [cat]);
  const picked = all.filter(it => on[it]);
  const setOnV = (it: string, v: boolean) => setOn(p => ({ ...p, [it]: v }));
  const save = () => {
    const out: Record<string, string> = {};
    for (const it of picked) {
      const k = KIND[it];
      const v = (val[it] || '').trim();
      out[it] = k ? v : '시행';
    }
    const missing = picked.filter(it => KIND[it] && !(val[it] || '').trim());
    if (missing.length) { setMsg(`값을 선택해 주세요: ${missing.join(', ')}`); return; }
    onSave(out, h);
    setMsg(`${picked.length}개 항목을 ${h}시 칸에 기록했어요.`);
    setOn({}); setVal({});
  };
  return (
    <div className="gr">
      <style>{`
        .gr{padding:12px 14px;font-size:13px}
        .gr .top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
        .gr .top select{padding:4px 6px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:inherit}
        .gr p.gd{margin:0 0 10px;color:var(--sub-text);line-height:1.5}
        .gr h5{margin:12px 0 4px;font-size:13px;color:var(--primary)}
        .gr table{width:100%;min-width:0 !important;border-collapse:collapse}
        .gr td{border:1px solid var(--border);padding:5px 8px;vertical-align:middle}
        .gr td.n{width:46%}
        .gr label{display:flex;gap:8px;align-items:center;cursor:pointer}
        .gr label input{width:auto !important;margin:0}
        .gr td select,.gr td input[type=text],.gr td input[type=number]{width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:inherit}
        .gr .ft{display:flex;gap:10px;align-items:center;margin-top:12px}
        .gr .ft button{padding:7px 16px;border-radius:6px;border:1px solid #aaa;background:#ececec;color:#111;font:inherit;font-weight:600;cursor:pointer}
        .gr .ft button.p{background:var(--primary);border-color:var(--primary);color:#fff}
        .gr .ft button:disabled{opacity:.5;cursor:not-allowed}
        .gr .ok{color:#15803d}
      `}</style>
      <div className="top"><b>{cat.g}</b>기록 시간
        <select value={h} onChange={e => setH(e.target.value)}>{hours.map(x => <option key={x} value={x}>{x}시</option>)}</select>
      </div>
      <p className="gd">{cat.guide}</p>
      {cat.subs.map(sb => (
        <div key={sb.s}>
          <h5>{sb.s}</h5>
          <table><tbody>
            {sb.items.map(it => {
              const k = KIND[it];
              const cur = get(it, h);
              return (
                <tr key={it}>
                  <td className="n"><label><input type="checkbox" checked={!!on[it]} onChange={e => setOnV(it, e.target.checked)} />{it}{cur && <em style={{ marginLeft: 6, color: 'var(--sub-text)', fontStyle: 'normal' }}>({h}시 현재: {cur})</em>}</label></td>
                  <td>
                    {!k && <span style={{ color: 'var(--sub-text)' }}>체크하면 &apos;시행&apos;으로 기록</span>}
                    {k?.t === 'sel' && <select value={val[it] || ''} onChange={e => { setVal(p => ({ ...p, [it]: e.target.value })); if (e.target.value) setOnV(it, true); }}><option value="">선택</option>{k.o.map(o => <option key={o}>{o}</option>)}</select>}
                    {k?.t === 'num' && <input type="number" value={val[it] || ''} placeholder={k.u} onChange={e => { setVal(p => ({ ...p, [it]: e.target.value })); if (e.target.value) setOnV(it, true); }} />}
                    {k?.t === 'txt' && <input type="text" value={val[it] || ''} onChange={e => { setVal(p => ({ ...p, [it]: e.target.value })); if (e.target.value) setOnV(it, true); }} />}
                  </td>
                </tr>
              );
            })}
          </tbody></table>
        </div>
      ))}
      <div className="ft">
        <button type="button" className="p" disabled={picked.length === 0} onClick={save}>기록 ({picked.length})</button>
        <button type="button" onClick={() => { setOn({}); setVal({}); setMsg(''); }}>선택 해제</button>
        {msg && <span className={msg.includes('기록했어요') ? 'ok' : ''}>{msg}</span>}
      </div>
    </div>
  );
}
