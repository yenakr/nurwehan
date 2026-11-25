'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ChartData, Row } from '../types';
import { DEPTS, staffOf, type Staff } from '../directory';

const p2 = (n: number) => String(n).padStart(2, '0');
const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

// 실시간 연동이 아니므로 경과 시간으로 상태·답변을 모의한다
const mins = (t?: string) => { const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(t || ''); return m ? (Date.now() - new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime()) / 60000 : 0; };
const useTick = () => { const [, set] = useState(0); useEffect(() => { const id = setInterval(() => set(x => x + 1), 20000); return () => clearInterval(id); }, []); };
const notiState = (m: Row): { st: string; reply: string } => {
  const k = m.urgent ? 0.5 : 1;
  const e = mins(m.time);
  if (e < 1 * k) return { st: '발송', reply: '' };
  if (e < 3 * k) return { st: '수신 확인', reply: '' };
  const t = m.text || '';
  const reply = /통증|아프|NRS/i.test(t) ? '진통제 처방 추가했습니다. 확인 바랍니다.' : /열|발열|오한/.test(t) ? 'Fever work-up 오더 내겠습니다. 혈액배양 확인해주세요.' : /혈압|BP|저혈압|고혈압/i.test(t) ? '15분 뒤 재측정 후 다시 노티 부탁드립니다.' : /혈당|BST|저혈당|고혈당/i.test(t) ? 'Insulin 처방 확인해서 조정하겠습니다.' : /구토|오심|메스꺼/.test(t) ? '항구토제 처방 추가했습니다.' : /호흡|산소|SpO2|숨/i.test(t) ? '산소 유지하고 ABGA 오더 내겠습니다. 상태 계속 관찰해주세요.' : '확인했습니다. 오더 확인 바랍니다.';
  return { st: '답변', reply };
};
const docState = (m: Row) => { const e = mins(m.time); return e < 2 ? '요청' : e < 5 ? '접수' : e < 10 ? '작성중' : '발급완료 (수령 가능)'; };

type P = { data: ChartData; setData: Dispatch<SetStateAction<ChartData>>; userName: string; duty: string };

// 진료과 의료진 목록과 Notify 보내기
export function StaffWin({ data, setData, userName, duty }: P) {
  useTick();
  const code = data.info.dept || '';
  const [dept, setDept] = useState(DEPTS.some(d => d.code === code) ? code : DEPTS[0].code);
  const [to, setTo] = useState<Staff | null>(null);
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [msg, setMsg] = useState('');
  const staff = staffOf(dept).slice().sort((a, b) => Number(b.name === data.info.doctor) - Number(a.name === data.info.doctor));
  const sent = data.memos.filter(m => m.type === '노티');

  const send = () => {
    if (!to) return;
    if (!text.trim()) { setMsg('Notify 내용을 입력하세요'); return; }
    const row: Row = { type: '노티', text: text.trim(), doctor: to.name, rank: to.rank, dept, urgent: urgent ? '1' : '', status: '발송', time: stamp(), author: userName, shift: duty };
    setData(d => ({ ...d, memos: [...d.memos, row] }));
    setTo(null);
    setText('');
    setUrgent(false);
    setMsg('Notify를 보냈어요.');
  };

  const dn = DEPTS.find(d => d.code === dept)?.name || '';
  return (
    <div className="nx nx-nf">
      <aside>
        {DEPTS.map(d => <button key={d.code} type="button" className={dept === d.code ? 'on' : ''} onClick={() => { setDept(d.code); setTo(null); setMsg(''); }}>{d.name}</button>)}
      </aside>
      <section>
        <h4 style={{ marginTop: 0 }}>{dn} 의료진</h4>
        <div className="nf-cards">
          {staff.map(s => (
            <div key={s.rank + s.name} className={`nf-c ${to?.name === s.name ? 'on' : ''}`}>
              <div><b>{s.name}</b>{s.name === data.info.doctor && <em>주치의</em>}</div>
              <span>{s.rank} · 내선 {s.ext}</span>
              <button type="button" onClick={() => { setTo(s); setMsg(''); }}>Notify</button>
            </div>
          ))}
        </div>
        {to && (
          <div className="nx-box">
            <b>To. {to.rank} {to.name}</b>
            <span>Re. {data.info.name} ({data.info.ptNo}) {data.info.ward} {data.info.bed}</span>
            <textarea rows={4} value={text} onChange={e => { setText(e.target.value); setMsg(''); }} aria-label="Notify 내용" placeholder="S) 현재 상태 / A) 사정 내용 / R) 요청 사항" />
            <label className="nx-ck"><input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />긴급 (STAT)</label>
            <div className="nx-act">
              {msg && <span className="err">{msg}</span>}
              <button type="button" onClick={() => setTo(null)}>취소</button>
              <button type="button" className="go" onClick={send}>보내기</button>
            </div>
          </div>
        )}
        {!to && msg && <p className="ok">{msg}</p>}
        <h4>Notify 내역</h4>
        <table className="nx-t">
          <thead><tr><th>일시</th><th>대상</th><th>내용</th><th>상태</th><th>답변</th></tr></thead>
          <tbody>
            {sent.slice().reverse().map((m, k) => <tr key={k}><td>{(m.time || '').slice(5)}</td><td>{m.rank} {m.doctor}</td><td style={{ textAlign: 'left' }}>{m.urgent && <b className="u">[긴급] </b>}{m.text}</td><td>{notiState(m).st}</td><td style={{ textAlign: 'left' }}>{notiState(m).reply}</td></tr>)}
            {sent.length === 0 && <tr><td colSpan={5} className="none">내역 없음</td></tr>}
          </tbody>
        </table>
      </section>
      <style>{`
        .nx-nf { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: start; }
        .nx-nf aside { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 6px; padding: 4px; max-height: 70vh; overflow: auto; }
        .nx-nf aside button { border: 0; background: none; text-align: left; padding: 6px 8px; border-radius: 4px; font: inherit; font-size: 13px; cursor: pointer; }
        .nx-nf aside button.on { background: var(--primary); color: #fff; }
        .nf-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; margin-bottom: 10px; }
        .nf-c { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
        .nf-c.on { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(14,74,132,.15); }
        .nf-c em { font-style: normal; font-size: 11px; font-weight: 700; color: var(--primary); margin-left: 6px; }
        .nf-c span { font-size: 12px; color: var(--sub-text); }
        .nf-c button { align-self: flex-start; border: 1px solid var(--primary); color: var(--primary); background: #fff; border-radius: 4px; padding: 3px 12px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        @media (max-width: 700px) { .nx-nf { grid-template-columns: 1fr; } .nx-nf aside { flex-direction: row; flex-wrap: wrap; max-height: none; } }
      `}</style>
      <NxCss />
    </div>
  );
}

const DOCS = ['진단서', '입퇴원확인서', '소견서', '진료비 세부내역서', '진료비 영수증', '진료기록 사본', '통원확인서', '보험 청구서류', '장애진단서'];
const HOW = ['병실 전달', '원무과 방문 수령', '우편 발송', '이메일 발송'];

// 원무과로 보내는 서류 발급 요청
export function DocReqWin({ data, setData, userName, duty }: P) {
  useTick();
  const [f, setF] = useState<Record<string, string>>({ doc: '', copies: '1', how: HOW[0], note: '' });
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => { setF(o => ({ ...o, [k]: v })); setMsg(''); };
  const list = data.memos.filter(m => m.type === '서류요청');

  const send = () => {
    if (!f.doc) { setMsg('서류 종류를 선택하세요'); return; }
    const c = Number(f.copies);
    if (!Number.isInteger(c) || c < 1 || c > 20) { setMsg('부수를 확인하세요'); return; }
    const row: Row = { type: '서류요청', text: f.doc, copies: String(c), how: f.how, note: f.note.trim(), status: '요청', time: stamp(), author: userName, shift: duty };
    setData(d => ({ ...d, memos: [...d.memos, row] }));
    setF({ doc: '', copies: '1', how: HOW[0], note: '' });
    setMsg('원무과로 요청을 보냈어요.');
  };

  return (
    <div className="nx">
      <div className="nx-row">
        <label>서류 종류
          <select value={f.doc} onChange={e => set('doc', e.target.value)}>
            {['', ...DOCS].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>부수<input inputMode="numeric" style={{ width: 60 }} value={f.copies} onChange={e => set('copies', e.target.value.replace(/\D/g, ''))} /></label>
        <label>수령 방법
          <select value={f.how} onChange={e => set('how', e.target.value)}>{HOW.map(o => <option key={o} value={o}>{o}</option>)}</select>
        </label>
        <label style={{ flex: 1, minWidth: 180 }}>비고<input value={f.note} onChange={e => set('note', e.target.value)} /></label>
      </div>
      <div className="nx-act">
        {msg && <span className={/확인|선택/.test(msg) ? 'err' : 'ok'}>{msg}</span>}
        <button type="button" className="go" onClick={send}>원무과로 요청</button>
      </div>
      <h4>요청 내역</h4>
      <table className="nx-t">
        <thead><tr><th>일시</th><th>서류</th><th>부수</th><th>수령 방법</th><th>비고</th><th>상태</th></tr></thead>
        <tbody>
          {list.slice().reverse().map((m, k) => <tr key={k}><td>{(m.time || '').slice(5)}</td><td>{m.text}</td><td>{m.copies}</td><td>{m.how}</td><td>{m.note}</td><td>{docState(m)}</td></tr>)}
          {list.length === 0 && <tr><td colSpan={6} className="none">내역 없음</td></tr>}
        </tbody>
      </table>
      <NxCss />
    </div>
  );
}

function NxCss() {
  return (
    <style>{`
      .nx { padding: 14px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; }
      .nx h4 { margin: 6px 0 0; font-size: 13px; color: var(--sub-text); }
      .nx-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
      .nx-row label { display: flex; flex-direction: column; gap: 3px; font-weight: 700; font-size: 12px; }
      .nx-row select, .nx-row input { padding: 7px 8px; min-height: 34px; }
      .nx-row .ok, .nx-act .ok { color: #2f7a46; font-weight: 700; margin-left: auto; }
      .nx-t { width: 100%; min-width: 0; table-layout: auto; border-collapse: collapse; }
      .nx-t th { background: var(--muted-background); border: 1px solid var(--border); padding: 5px 8px; font-size: 12px; }
      .nx-t td { border: 1px solid var(--border); padding: 5px 8px; text-align: center; }
      .nx-t tr.on td { background: rgba(14,74,132,.1); }
      .nx-t td button { border: 1px solid var(--primary); background: transparent; color: var(--primary); border-radius: 4px; padding: 3px 12px; font-weight: 700; cursor: pointer; }
      .nx-t .none { color: var(--sub-text); }
      .nx-t .u { color: #dc2626; }
      .nx-box { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--muted-background); }
      .nx-box span { color: var(--sub-text); font-size: 12px; }
      .nx-ck { display: flex; align-items: center; gap: 6px; font-weight: 700; }
      .nx-act { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
      .nx-act .err { color: #dc2626; font-weight: 700; margin-right: auto; }
      .nx-act button { padding: 7px 18px; border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 4px; cursor: pointer; font-weight: 700; }
      .nx-act button.go { background: var(--primary); color: #fff; border-color: var(--primary); }
    `}</style>
  );
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = (m: string) => esc(m).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/==([^=]+)==/g, '<mark style="background:#fde68a">$1</mark>').replace(/\n/g, '<br>');
function toMarkup(el: HTMLElement): string {
  const walk = (n: Node, first: boolean): string => {
    if (n.nodeType === 3) return n.textContent || '';
    if (!(n instanceof HTMLElement)) return '';
    const tag = n.tagName;
    if (tag === 'BR') return '\n';
    const inner = Array.from(n.childNodes).map((c, k) => walk(c, k === 0)).join('');
    let out = inner;
    const bold = tag === 'B' || tag === 'STRONG' || Number(n.style.fontWeight) >= 600 || n.style.fontWeight === 'bold';
    const hl = tag === 'MARK' || (n.style.backgroundColor && n.style.backgroundColor !== 'transparent');
    if (inner.trim()) { if (bold) out = `**${out}**`; if (hl) out = `==${out}==`; }
    if ((tag === 'DIV' || tag === 'P') && !first) out = `\n${out}`;
    return out;
  };
  return Array.from(el.childNodes).map((c, k) => walk(c, k === 0)).join('');
}

// 굵게·형광펜을 쓸 수 있는 간호메모 입력
export function RichMemo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.innerHTML = toHtml(value); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cmd = (c: string, v?: string) => {
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(c, false, v);
    if (ref.current) onChange(toMarkup(ref.current));
  };
  return (
    <div className="rm">
      <div className="rm-bar">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => cmd('bold')} aria-label="굵게"><b>B</b></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => cmd('hiliteColor', '#fde68a')} aria-label="형광펜"><mark style={{ background: '#fde68a' }}>형광</mark></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { cmd('hiliteColor', 'transparent'); cmd('removeFormat'); }} aria-label="서식 지우기">서식 지우기</button>
      </div>
      <div ref={ref} className="rm-ed" contentEditable suppressContentEditableWarning role="textbox" aria-label="간호메모" onInput={() => ref.current && onChange(toMarkup(ref.current))} />
      <style>{`
        .rm-bar { display: flex; gap: 4px; margin-bottom: 4px; }
        .rm-bar button { border: 1px solid var(--border); background: var(--background); color: var(--text); border-radius: 4px; padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; }
        .rm-ed { min-height: 160px; padding: 8px; border: 1px solid #e0c97a; border-radius: 6px; background: #fbefc9; color: #3b2f0b; line-height: 1.5; outline: none; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
