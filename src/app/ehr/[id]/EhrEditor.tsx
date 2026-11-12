'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChartData, Row } from '../types';
import { PHRASES, CARE_DX } from '../phrases';
import { VIEW_LIST } from '../samples';
import { ALLERGIES, DEPTS, DOCTORS, WARD_OPTIONS, bedOptions } from '../directory';

type ListKey =
  | 'progress' | 'vitals' | 'io' | 'labs' | 'notes' | 'care'
  | 'transfusion' | 'nutrition' | 'consult' | 'consent' | 'surgery' | 'appts' | 'handover' | 'risk' | 'history' | 'imaging';
type TabId = ListKey | 'orders' | 'admission' | 'nurseinfo' | 'discharge';

type MenuItem = { id: TabId; label: string };
type MenuNode = { label: string; items: MenuItem[] };
const MENU: MenuNode[] = [
  { label: '경과기록', items: [{ id: 'progress', label: '경과기록' }, { id: 'consult', label: '협진기록' }, { id: 'surgery', label: '수술기록' }] },
  { label: '의사처방', items: [{ id: 'orders', label: '의사처방' }] },
  { label: '입원기록', items: [{ id: 'admission', label: '입원기록' }, { id: 'nurseinfo', label: '간호정보조사지' }, { id: 'history', label: '상병이력' }] },
  { label: '임상관찰', items: [{ id: 'vitals', label: '임상관찰' }] },
  { label: '치료/검사', items: [{ id: 'labs', label: '검사결과' }, { id: 'imaging', label: '영상검사' }, { id: 'transfusion', label: '수혈기록' }] },
  { label: '영양기록', items: [{ id: 'nutrition', label: '영양기록' }] },
  { label: '간호기록', items: [{ id: 'notes', label: '간호기록' }, { id: 'risk', label: '위험도평가' }, { id: 'handover', label: '인계(SBAR)' }] },
  { label: '간호과정', items: [{ id: 'care', label: '간호과정' }] },
  { label: '동의서', items: [{ id: 'consent', label: '동의서' }] },
  { label: '외래예약', items: [{ id: 'appts', label: '외래예약' }] },
  { label: '퇴원', items: [{ id: 'discharge', label: '퇴원계획' }] },
];

type Col = { key: string; label: string; w: number; type?: 'area' | 'select'; opts?: string[]; ph?: string };

const COLS: Record<ListKey, Col[]> = {
  progress: [
    { key: 'time', label: '기록일시', w: 130, ph: '2026-11-10 10:00' },
    { key: 'dept', label: '진료과', w: 60 },
    { key: 'text', label: '경과기록', w: 520, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  vitals: [
    { key: 'time', label: '시간', w: 80, ph: '08:00' },
    { key: 'bp', label: '혈압 (mmHg)', w: 110, ph: '120/80' },
    { key: 'hr', label: '맥박 (/min)', w: 90 },
    { key: 'rr', label: '호흡 (/min)', w: 90 },
    { key: 'bt', label: '체온 (℃)', w: 80 },
    { key: 'spo2', label: 'SpO₂ (%)', w: 80 },
    { key: 'pain', label: '통증 (NRS)', w: 80 },
  ],
  io: [
    { key: 'time', label: '시간', w: 80, ph: '08-12' },
    { key: 'intake', label: '섭취 (mL)', w: 200 },
    { key: 'output', label: '배설 (mL)', w: 200 },
    { key: 'note', label: '비고', w: 260 },
  ],
  labs: [
    { key: 'name', label: '검사명 (· 결과)', w: 200 },
    { key: 'value', label: '결과', w: 90 },
    { key: 'unit', label: '단위', w: 80 },
    { key: 'min', label: 'Min', w: 60 },
    { key: 'max', label: 'Max', w: 60 },
    { key: 'sample', label: '검체', w: 70 },
    { key: 'time', label: '검사일시', w: 110 },
  ],
  notes: [
    { key: 'time', label: '기록일시', w: 110, ph: '11-10 10:00' },
    { key: 'focus', label: 'Focus', w: 110 },
    { key: 'text', label: '간호기록', w: 560, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  transfusion: [
    { key: 'time', label: '일시', w: 130 },
    { key: 'step', label: '단계', w: 90, type: 'select', opts: ['', '확인', '시작', '수혈중', '종료', '특이사항'] },
    { key: 'blood', label: '혈액명', w: 130, ph: 'F-RBC(400cc)' },
    { key: 'bno', label: '혈액번호', w: 110 },
    { key: 'bp', label: 'BP', w: 80 },
    { key: 'pr', label: 'PR', w: 60 },
    { key: 'rr', label: 'RR', w: 60 },
    { key: 'bt', label: 'BT', w: 60 },
    { key: 'note', label: '이상반응 / 비고', w: 220 },
  ],
  nutrition: [
    { key: 'time', label: '기록일시', w: 130 },
    { key: 'text', label: '영양기록', w: 560, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  consult: [
    { key: 'date', label: '의뢰일', w: 96 },
    { key: 'dept', label: '의뢰과', w: 64 },
    { key: 'doc', label: '의뢰의', w: 70 },
    { key: 'req', label: '의뢰내용', w: 260, type: 'area' },
    { key: 'rdept', label: '회신과', w: 64 },
    { key: 'reply', label: '회신내용', w: 260, type: 'area' },
    { key: 'st', label: '상태', w: 84, type: 'select', opts: ['', '미회신', '회신완료'] },
  ],
  consent: [
    { key: 'name', label: '동의서명', w: 240 },
    { key: 'date', label: '일자', w: 100 },
    { key: 'st', label: '상태', w: 100, type: 'select', opts: ['', '미작성', '작성', '서명완료', '거부'] },
    { key: 'note', label: '비고', w: 240 },
  ],
  surgery: [
    { key: 'date', label: '수술일자', w: 100 },
    { key: 'dept', label: '진료과', w: 70 },
    { key: 'name', label: '수술명', w: 260 },
    { key: 'anes', label: '마취', w: 90 },
    { key: 'note', label: '비고', w: 240 },
  ],
  appts: [
    { key: 'date', label: '예약일', w: 100, ph: '2026-11-20' },
    { key: 'time', label: '시간', w: 70 },
    { key: 'dept', label: '진료과', w: 90 },
    { key: 'doc', label: '의사', w: 80 },
    { key: 'purpose', label: '목적', w: 260 },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['', '예약', '접수', '진료완료', '취소', '부도'] },
  ],
  handover: [
    { key: 'time', label: '일시', w: 110 },
    { key: 's', label: 'S (상황)', w: 200, type: 'area' },
    { key: 'b', label: 'B (배경)', w: 200, type: 'area' },
    { key: 'a', label: 'A (사정)', w: 200, type: 'area' },
    { key: 'r', label: 'R (요청)', w: 200, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  risk: [
    { key: 'time', label: '평가일시', w: 110 },
    { key: 'kind', label: '평가', w: 110, type: 'select', opts: ['', '낙상(Morse)', '욕창(Braden)', '통증(NRS)', '기타'] },
    { key: 'score', label: '점수', w: 64 },
    { key: 'level', label: '위험도', w: 90, type: 'select', opts: ['', '저위험', '중위험', '고위험'] },
    { key: 'plan', label: '중재', w: 300, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  history: [
    { key: 'dept', label: '진료과', w: 80 },
    { key: 'date', label: '진료일자', w: 100 },
    { key: 'dx', label: '임상진단명', w: 320 },
    { key: 'code', label: '상병코드', w: 90 },
    { key: 'kind', label: '구분', w: 80, type: 'select', opts: ['', '외래', '입원', '응급'] },
  ],
  imaging: [
    { key: 'time', label: '일시', w: 110 },
    { key: 'name', label: '검사명', w: 220 },
    { key: 'result', label: '소견 / 판독', w: 400, type: 'area' },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['', '접수', '촬영완료', '판독완료'] },
  ],
  care: [
    { key: 'dx', label: '간호진단', w: 150, type: 'area' },
    { key: 'data', label: '사정(자료)', w: 220, type: 'area' },
    { key: 'goal', label: '목표', w: 200, type: 'area' },
    { key: 'plan', label: '중재', w: 300, type: 'area' },
    { key: 'eval', label: '평가', w: 200, type: 'area' },
  ],
};

const num = (v: string) => parseFloat((v || '').replace(/[^0-9.\-]/g, ''));
function vitalBad(key: string, v: string): boolean {
  if (!v) return false;
  if (key === 'bp') {
    const [s, d] = v.split('/').map(num);
    return (!isNaN(s) && (s >= 140 || s < 90)) || (!isNaN(d) && (d >= 90 || d < 60));
  }
  const n = num(v);
  if (isNaN(n)) return false;
  if (key === 'hr') return n > 100 || n < 60;
  if (key === 'rr') return n > 20 || n < 12;
  if (key === 'bt') return n >= 37.5 || n < 36;
  if (key === 'spo2') return n < 95;
  if (key === 'pain') return n >= 4;
  return false;
}
// 검사결과: ▲ 높음(빨강) / ▼ 낮음(파랑)
function labFlag(r: Row): 'H' | 'L' | '' {
  const v = num(r.value || ''), lo = num(r.min || ''), hi = num(r.max || '');
  if (isNaN(v)) return '';
  if (!isNaN(hi) && v > hi) return 'H';
  if (!isNaN(lo) && v < lo) return 'L';
  return '';
}

// 입원기록 (문서 형태)
const ADM: { key: string; label: string; rows?: number }[] = [
  { key: 'cc', label: '주호소', rows: 1 },
  { key: 'onset', label: '발병시기', rows: 1 },
  { key: 'hpi', label: '현병력', rows: 5 },
  { key: 'pmh', label: '과거력', rows: 3 },
  { key: 'fh', label: '가족력', rows: 2 },
  { key: 'social', label: '개인력 및 사회력', rows: 2 },
  { key: 'pe', label: '신체검진', rows: 5 },
  { key: 'dx', label: '진단명', rows: 2 },
  { key: 'plan', label: '진료계획', rows: 4 },
];

const DIS: { key: string; label: string; rows?: number }[] = [
  { key: 'disDate', label: '퇴원 예정일', rows: 1 },
  { key: 'disMethod', label: '퇴원 방법', rows: 1 },
  { key: 'disPlace', label: '퇴원 후 갈 곳', rows: 1 },
  { key: 'disGuardian', label: '퇴원 후 주 보호자', rows: 1 },
  { key: 'disTarget', label: '교육 대상', rows: 1 },
  { key: 'disEdu', label: '퇴원 교육 내용', rows: 5 },
  { key: 'disFu', label: '외래 추적관찰', rows: 3 },
];

// 입원 시 간호정보조사지
const NURSE: { key: string; label: string }[] = [
  { key: 'route', label: '입 원 경 로' },
  { key: 'method', label: '입 원 방 법' },
  { key: 'informant', label: '정보제공자' },
  { key: 'job', label: '직 업' },
  { key: 'religion', label: '종 교' },
  { key: 'marital', label: '결 혼' },
  { key: 'lang', label: '언 어' },
  { key: 'cc', label: '주 호 소' },
  { key: 'purpose', label: '입원목적' },
  { key: 'insight', label: '병식(insight)' },
  { key: 'allergy', label: '알레르기' },
  { key: 'social', label: '사회적특수성' },
  { key: 'drink', label: '음 주 력' },
  { key: 'smoke', label: '흡 연 력' },
  { key: 'bedsore', label: '욕 창 (Braden)' },
  { key: 'fall', label: '낙 상 (Morse)' },
  { key: 'pain', label: '통 증' },
];

const ORDER_STATUS = ['', '집계완료', '접수', '추가', '완료'];
const ROUTES = ['', 'PO', 'IV', 'IM', 'SC', 'SL', 'Inh', 'CIV', 'Top'];

const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// 간호기록 작성: Focus를 고르고 상용구를 눌러 D/A/R에 채운 뒤 직접 수정해서 기록한다
function NoteComposer({ onAdd }: { onAdd: (n: Row) => void }) {
  const [focus, setFocus] = useState('');
  const [txt, setTxt] = useState<{ d: string; a: string; r: string }>({ d: '', a: '', r: '' });
  const [time, setTime] = useState('');
  const ph = PHRASES.find(p => p.focus === focus);

  const push = (k: 'd' | 'a' | 'r', phrase: string) =>
    setTxt(t => ({ ...t, [k]: t[k] ? `${t[k]}\n${phrase}` : phrase }));
  const empty = !txt.d.trim() && !txt.a.trim() && !txt.r.trim();

  const add = () => {
    if (empty) return;
    const body = [txt.d.trim() && `D)\n${txt.d.trim()}`, txt.a.trim() && `A)\n${txt.a.trim()}`, txt.r.trim() && `R)\n${txt.r.trim()}`].filter(Boolean).join('\n\n');
    onAdd({ time: time || nowStamp(), focus, text: body, author: '' });
    setTxt({ d: '', a: '', r: '' });
    setTime('');
  };

  const cols: { k: 'd' | 'a' | 'r'; label: string }[] = [
    { k: 'd', label: 'D (자료)' },
    { k: 'a', label: 'A (중재)' },
    { k: 'r', label: 'R (반응)' },
  ];

  return (
    <div className="nc">
      <div className="ncHead">
        <b>간호기록 작성</b>
        <label>
          기록일시
          <input value={time} placeholder={nowStamp()} onChange={e => setTime(e.target.value)} />
        </label>
        <label>
          Focus
          <input value={focus} placeholder="직접 입력 또는 아래에서 선택" onChange={e => setFocus(e.target.value)} />
        </label>
      </div>
      <div className="chips">
        {PHRASES.map(p => (
          <button key={p.focus} type="button" className={focus === p.focus ? 'on' : ''} onClick={() => setFocus(p.focus)}>{p.focus}</button>
        ))}
      </div>
      <div className="ncGrid">
        {cols.map(c => (
          <div key={c.k} className="ncCol">
            <div className="lbl">{c.label}</div>
            <div className="phs">
              {ph ? ph[c.k].map(t => (
                <button key={t} type="button" onClick={() => push(c.k, t)}>{t}</button>
              )) : <span className="hint">Focus를 선택하세요</span>}
            </div>
            <textarea rows={5} value={txt[c.k]} onChange={e => setTxt(t => ({ ...t, [c.k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="ncFoot">
        <button type="button" className="clr" onClick={() => setTxt({ d: '', a: '', r: '' })}>지우기</button>
        <button type="button" className="sv" disabled={empty} onClick={add}>기록 저장</button>
      </div>
    </div>
  );
}

// 간호과정 작성: 간호진단을 고르고 상용구를 눌러 사정·목표·중재·평가를 채운 뒤 직접 수정해서 저장한다
function CareComposer({ onAdd }: { onAdd: (r: Row) => void }) {
  const [dx, setDx] = useState('');
  const [txt, setTxt] = useState<{ data: string; goal: string; plan: string; eval: string }>({ data: '', goal: '', plan: '', eval: '' });
  const lib = CARE_DX.find(c => c.dx === dx);
  const push = (k: 'data' | 'goal' | 'plan' | 'eval', v: string) => setTxt(t => ({ ...t, [k]: t[k] ? `${t[k]}\n${v}` : v }));
  const empty = !dx.trim() && !txt.data.trim() && !txt.goal.trim() && !txt.plan.trim() && !txt.eval.trim();
  const cols: { k: 'data' | 'goal' | 'plan' | 'eval'; label: string; src: string[] }[] = [
    { k: 'data', label: '사정 (자료)', src: lib?.data || [] },
    { k: 'goal', label: '목표', src: lib?.goal || [] },
    { k: 'plan', label: '중재', src: lib?.plan || [] },
    { k: 'eval', label: '평가', src: lib?.evalu || [] },
  ];
  const add = () => {
    if (empty) return;
    onAdd({ dx: dx.trim(), data: txt.data.trim(), goal: txt.goal.trim(), plan: txt.plan.trim(), eval: txt.eval.trim() });
    setDx('');
    setTxt({ data: '', goal: '', plan: '', eval: '' });
  };
  return (
    <div className="nc">
      <div className="ncHead">
        <b>간호과정 작성</b>
        <label>
          간호진단
          <input value={dx} placeholder="직접 입력 또는 아래에서 선택" onChange={e => setDx(e.target.value)} />
        </label>
      </div>
      <div className="chips">
        {CARE_DX.map(c => (
          <button key={c.dx} type="button" className={dx === c.dx ? 'on' : ''} onClick={() => setDx(c.dx)}>{c.dx}</button>
        ))}
      </div>
      <div className="ncGrid four">
        {cols.map(c => (
          <div key={c.k} className="ncCol">
            <div className="lbl">{c.label}</div>
            <div className="phs">
              {lib ? c.src.map(t => <button key={t} type="button" onClick={() => push(c.k, t)}>{t}</button>) : <span className="hint">간호진단을 선택하세요</span>}
            </div>
            <textarea rows={5} value={txt[c.k]} onChange={e => setTxt(t => ({ ...t, [c.k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="ncFoot">
        <button type="button" className="clr" onClick={() => { setDx(''); setTxt({ data: '', goal: '', plan: '', eval: '' }); }}>지우기</button>
        <button type="button" className="sv" disabled={empty} onClick={add}>저장</button>
      </div>
    </div>
  );
}

export default function EhrEditor({
  id,
  initialTitle,
  subject,
  initial,
}: {
  id: string;
  initialTitle: string;
  subject: string | null;
  initial: ChartData;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<ChartData>(initial);
  const [tab, setTab] = useState<TabId>('notes');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);
  const [wardOpen, setWardOpen] = useState(false);
  const [editInfo, setEditInfo] = useState(false); // 기본정보는 수정 버튼을 눌러야 편집
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ehr/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, subject, data }),
        });
        setStatus(res.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [title, data, id, subject]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(null);
      if (wardRef.current && !wardRef.current.contains(e.target as Node)) setWardOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const info = data.info;
  const setInfo = (k: string, v: string) => setData(d => ({ ...d, info: { ...d.info, [k]: v } }));
  type AnyList = ListKey | 'orders';
  const setCell = (lk: AnyList, i: number, k: string, v: string) =>
    setData(d => ({ ...d, [lk]: d[lk].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (lk: AnyList, init: Row = {}) => setData(d => ({ ...d, [lk]: [...d[lk], { ...init }] }));
  const delRow = (lk: AnyList, i: number) => setData(d => ({ ...d, [lk]: d[lk].filter((_, j) => j !== i) }));

  const toggleDischarge = async () => {
    const wasDischarged = !!data.info.discharged;
    if (!wasDischarged && !confirm('퇴원 처리할까요? 기록은 그대로 남아요.')) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const next = { ...data, info: { ...data.info, discharged: wasDischarged ? '' : today } };
    setData(next);
    try {
      const res = await fetch(`/api/ehr/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, subject, data: next }) });
      if (!res.ok) throw new Error();
      if (!wasDischarged) router.push(`/ehr?view=${encodeURIComponent(info.ward === '응급실' ? '응급' : info.ward || '')}`);
    } catch {
      setStatus('error');
    }
  };

  const hasAllergy = !!info.allergy && !/^(없음|무|none|-)$/i.test(info.allergy.trim());

  // 값이 비어 있어도 EMR처럼 보이도록 공통 입력 컴포넌트
  const side = (k: string, label: string, big?: boolean) => !editInfo ? (
    <div className="sd" key={k}>
      <em>{label}</em>
      <span className={`v ${big ? 'big' : ''}`}>{info[k] || '-'}</span>
    </div>
  ) : (
    <label className="sd" key={k}>
      <em>{label}</em>
      <input className={big ? 'big' : ''} value={info[k] || ''} onChange={e => setInfo(k, e.target.value)} />
    </label>
  );

  const sel = (k: string, label: string, opts: { v: string; l: string }[]) => {
    const cur = info[k] || '';
    const all = cur && !opts.some(o => o.v === cur) ? [...opts, { v: cur, l: cur }] : opts;
    if (!editInfo) {
      return (
        <div className="sd" key={k}>
          <em>{label}</em>
          <span className="v">{all.find(o => o.v === cur)?.l || '-'}</span>
        </div>
      );
    }
    return (
      <label className="sd" key={k}>
        <em>{label}</em>
        <select value={cur} onChange={e => setInfo(k, e.target.value)}>
          <option value="">-</option>
          {all.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </label>
    );
  };
  const docs = DOCTORS.filter(d => !info.dept || d.dept === info.dept);

  const tbl = (lk: ListKey) => {
    const cols = COLS[lk];
    const rows = data[lk];
    return (
      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              {cols.map(c => <th key={c.key} style={{ minWidth: c.w }}>{c.label}</th>)}
              <th className="x" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="none">내용이 없어요</td></tr>
            )}
            {rows.map((row, i) => {
              const flag = lk === 'labs' ? labFlag(row) : '';
              return (
                <tr key={i}>
                  {cols.map(c => {
                    const v = row[c.key] || '';
                    const bad = lk === 'vitals' && vitalBad(c.key, v);
                    const cls = bad ? 'bad' : lk === 'labs' && (c.key === 'value') ? (flag === 'H' ? 'hi' : flag === 'L' ? 'lo' : '') : '';
                    return (
                      <td key={c.key}>
                        {lk === 'labs' && c.key === 'value' && flag && <span className={`mk ${cls}`}>{flag === 'H' ? '▲' : '▼'}</span>}
                        {c.type === 'area' ? (
                          <textarea rows={['notes', 'progress', 'nutrition', 'imaging'].includes(lk) ? 5 : 3} value={v} onChange={e => setCell(lk, i, c.key, e.target.value)} />
                        ) : c.type === 'select' ? (
                          <select value={v} onChange={e => setCell(lk, i, c.key, e.target.value)}>
                            {(c.opts!.includes(v) ? c.opts! : [...c.opts!, v]).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input className={cls} value={v} placeholder={c.ph} onChange={e => setCell(lk, i, c.key, e.target.value)} />
                        )}
                      </td>
                    );
                  })}
                  <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow(lk, i)}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" className="add" onClick={() => addRow(lk)}>+ 행 추가</button>
      </div>
    );
  };

  const orders = data.orders;
  let seq = 0;

  return (
    <div className="ehr">
      <div className="bar">
        <input className="ttl" value={title} onChange={e => setTitle(e.target.value)} aria-label="제목" />
        <span className={`st ${status}`}>{status === 'saved' ? '저장됨' : status === 'saving' ? '저장 중…' : '저장 실패'}</span>
        <button type="button" className="dis" onClick={toggleDischarge}>
          {info.discharged ? '퇴원 취소' : '퇴원'}
        </button>
        <button
          type="button"
          className="dis del"
          onClick={async () => {
            if (!confirm('이 차트를 삭제할까요? 모든 기록이 사라지고 되돌릴 수 없어요.')) return;
            const res = await fetch(`/api/ehr/${id}`, { method: 'DELETE' });
            if (res.ok) router.push('/ehr');
          }}
        >
          삭제
        </button>
      </div>

      <div className="shell">
        <div className="top">
          <div className="wardSel" ref={wardRef}>
            <button type="button" className="ward" onClick={() => setWardOpen(o => !o)}>{info.ward || '병동'} ▾</button>
            {wardOpen && (
              <div className="dd wd">
                {VIEW_LIST.map(v => (
                  <button
                    key={v.name}
                    type="button"
                    className={(info.ward === '응급실' ? '응급' : info.ward) === v.name ? 'on' : ''}
                    onClick={() => router.push(`/ehr?view=${encodeURIComponent(v.name)}`)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="nav" ref={navRef} role="tablist">
            {MENU.map(g => {
              const active = g.items.some(i => i.id === tab);
              const multi = g.items.length > 1;
              return (
                <div key={g.label} className="mi">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={active ? 'on' : ''}
                    onClick={() => {
                      if (multi) setMenuOpen(menuOpen === g.label ? null : g.label);
                      else { setTab(g.items[0].id); setMenuOpen(null); }
                    }}
                  >
                    {g.label}{multi ? ' ▾' : ''}
                  </button>
                  {multi && menuOpen === g.label && (
                    <div className="dd">
                      {g.items.map(it => (
                        <button key={it.id} type="button" className={tab === it.id ? 'on' : ''} onClick={() => { setTab(it.id); setMenuOpen(null); }}>{it.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="body">
          <aside className="side">
            <div className="brand">병동뷰</div>
            {side('ptNo', '환자번호')}
            {side('name', '이름', true)}
            {side('ageSex', '나이/성별')}
            {sel('ward', '병동', WARD_OPTIONS.map(w => ({ v: w, l: w })))}
            {info.ward === '응급실'
              ? sel('ktas', 'KTAS', ['1', '2', '3', '4', '5'].map(v => ({ v, l: v })))
              : bedOptions(info.ward || '').length > 0 && sel('bed', '병상', bedOptions(info.ward || '').map(b => ({ v: b, l: b })))}
            {sel('dept', '진료과', DEPTS.map(d => ({ v: d.code, l: `${d.name}` })))}
            {sel('doctor', '주치의', docs.map(d => ({ v: d.name, l: d.name })))}
            {editInfo ? (
              <label className="sd">
                <em>입원일</em>
                <input type="date" value={info.admit || ''} onChange={e => setInfo('admit', e.target.value)} />
              </label>
            ) : (
              <div className="sd">
                <em>입원일</em>
                <span className="v">{info.admit || '-'}</span>
              </div>
            )}
            {side('dx', '진단명')}
            {sel('allergy', '알레르기', ALLERGIES.map(a => ({ v: a, l: a })))}
            {hasAllergy && <div className="alg">알레르기 있음</div>}
            {info.discharged && <div className="dcb">퇴원 {info.discharged}</div>}
            <button type="button" className="ed" onClick={() => setEditInfo(v => !v)}>{editInfo ? '완료' : '수정'}</button>
          </aside>

          <section className="main">
            {tab === 'orders' && (
              <div className="tw">
                <div className="ohead">
                  <span>처방일자 </span>
                  <input className="od" value={info.orderDate || ''} placeholder={info.admit || '2026-11-10'} onChange={e => setInfo('orderDate', e.target.value)} />
                </div>
                <table className="tbl ord">
                  <thead>
                    <tr>
                      <th className="ck" />
                      <th style={{ minWidth: 34 }}>순번</th>
                      <th style={{ minWidth: 260 }}>처방명</th>
                      <th style={{ minWidth: 50 }}>용량</th>
                      <th style={{ minWidth: 44 }}>단위</th>
                      <th style={{ minWidth: 54 }}>횟수</th>
                      <th style={{ minWidth: 56 }}>경로</th>
                      <th style={{ minWidth: 78 }}>진행상태</th>
                      {[1, 2, 3, 4, 5, 6].map(n => <th key={n} style={{ minWidth: 64 }}>{n}회</th>)}
                      <th className="x" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && <tr><td colSpan={15} className="none">처방이 없어요</td></tr>}
                    {orders.map((r, i) => {
                      if (r.kind === 'sec') {
                        return (
                          <tr key={i} className="sec">
                            <td colSpan={14}>
                              <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            </td>
                            <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                          </tr>
                        );
                      }
                      if (r.kind === 'memo') {
                        return (
                          <tr key={i} className="memo">
                            <td className="ck" />
                            <td />
                            <td colSpan={12}>
                              <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            </td>
                            <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                          </tr>
                        );
                      }
                      seq += 1;
                      return (
                        <tr key={i}>
                          <td className="ck">
                            <button type="button" className={r.ck ? 'on' : ''} aria-pressed={!!r.ck} aria-label="수행 확인" onClick={() => setCell('orders', i, 'ck', r.ck ? '' : '1')}>✓</button>
                          </td>
                          <td className="seq">{seq}</td>
                          <td><input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} /></td>
                          <td><input className="r" value={r.dose || ''} onChange={e => setCell('orders', i, 'dose', e.target.value)} /></td>
                          <td><input value={r.unit || ''} onChange={e => setCell('orders', i, 'unit', e.target.value)} /></td>
                          <td><input value={r.cnt || ''} onChange={e => setCell('orders', i, 'cnt', e.target.value)} /></td>
                          <td>
                            <select value={r.route || ''} onChange={e => setCell('orders', i, 'route', e.target.value)}>
                              {(ROUTES.includes(r.route || '') ? ROUTES : [...ROUTES, r.route]).map(o => <option key={o} value={o}>{o || ''}</option>)}
                            </select>
                          </td>
                          <td>
                            <select value={r.st || ''} className={r.st === '집계완료' ? 'done' : ''} onChange={e => setCell('orders', i, 'st', e.target.value)}>
                              {(ORDER_STATUS.includes(r.st || '') ? ORDER_STATUS : [...ORDER_STATUS, r.st]).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <td key={n}><input value={r[`t${n}`] || ''} onChange={e => setCell('orders', i, `t${n}`, e.target.value)} /></td>
                          ))}
                          <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="adds">
                  <button type="button" className="add" onClick={() => addRow('orders', { kind: 'sec', name: '▶ 구분 ◀' })}>+ 구분</button>
                  <button type="button" className="add" onClick={() => addRow('orders')}>+ 처방</button>
                  <button type="button" className="add" onClick={() => addRow('orders', { kind: 'memo', name: '※ ' })}>+ 메모</button>
                </div>
              </div>
            )}

            {tab === 'care' && (
              <>
                <CareComposer onAdd={r => setData(d => ({ ...d, care: [r, ...d.care] }))} />
                {tbl('care')}
              </>
            )}

            {tab === 'notes' && (
              <>
                <NoteComposer onAdd={n => setData(d => ({ ...d, notes: [n, ...d.notes] }))} />
                {tbl('notes')}
              </>
            )}

            {(tab === 'admission' || tab === 'discharge') && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>{tab === 'admission' ? '입원기록' : '퇴원계획'}</span></div>
                {(tab === 'admission' ? ADM : DIS).map(f => (
                  <div key={f.key} className="ds">
                    <h4>■ {f.label}</h4>
                    {f.rows === 1 ? (
                      <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    ) : (
                      <textarea rows={f.rows} value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'nurseinfo' && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>입원 시 간호정보조사지</span></div>
                <div className="nl">
                  {NURSE.map(f => (
                    <label key={f.key}>
                      <b>[ {f.label} ]</b>
                      <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab === 'vitals' && (
              <>
                <h4 className="ph">활력징후</h4>
                {tbl('vitals')}
                <h4 className="ph">섭취/배설 (I&amp;O)</h4>
                {tbl('io')}
              </>
            )}

            {tab !== 'notes' && tab !== 'care' && tab !== 'orders' && tab !== 'admission' && tab !== 'discharge' && tab !== 'nurseinfo' && tab !== 'vitals' && tbl(tab)}
          </section>
        </div>
      </div>

      <style jsx global>{`
        .ehr { --nv1: #1c2f4b; --nv2: #13233a; --tl: #cfe5e6; --ln: #cfd5dc; }
        .ehr .bar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .ehr .back { font-size: 0.8125rem; color: var(--sub-text); text-decoration: none; white-space: nowrap; }
        .ehr .ttl { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 1rem; font-weight: 800; color: var(--text); font-family: inherit; padding: 4px 0; }
        .ehr .ttl:focus { outline: none; border-bottom: 2px solid var(--primary); }
        .ehr .st { font-size: 0.75rem; color: var(--sub-text); white-space: nowrap; }
        .ehr .dis { border: 0; background: transparent; color: var(--sub-text); font-size: 0.75rem; font-family: inherit; cursor: pointer; }
        .ehr .st.error { color: #b91c1c; font-weight: 700; }

        .ehr .shell { border: 1px solid #94a3b8; background: #fff; border-radius: 4px; overflow: hidden; font-size: 12.5px; color: #1f2937; }
        .ehr .top { display: flex; align-items: stretch; background: linear-gradient(#233a5c, #17283f); }
        .ehr .wardSel { position: relative; flex: 0 0 auto; display: flex; }
        .ehr .ward { border: 0; background: transparent; cursor: pointer; font-family: inherit; flex: 0 0 auto; display: flex; align-items: center; padding: 0 16px; color: #e2e8f0; font-weight: 700; font-size: 13px; border-right: 1px solid rgba(255,255,255,0.15); }
        .ehr .nav { display: flex; flex-wrap: wrap; }
        .ehr .mi { position: relative; flex: 0 0 auto; }
        .ehr .nav .mi > button { flex: 0 0 auto; border: 0; background: transparent; color: #e5ebf3; padding: 11px 14px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.08); }
        .ehr .nav .mi > button.on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .ehr .dd { position: absolute; top: 100%; left: 0; z-index: 20; min-width: 130px; background: #fff; border: 1px solid #94a3b8; box-shadow: 0 6px 16px rgba(15,23,42,0.18); display: flex; flex-direction: column; }
        .ehr .dd button { border: 0; background: #fff; text-align: left; padding: 9px 14px; font-size: 12.5px; font-family: inherit; color: #1f2937; cursor: pointer; white-space: nowrap; }
        .ehr .dd button:hover { background: #eef6ff; }
        .ehr .dd button.on { color: #0e4a84; font-weight: 800; }

        .ehr .body { display: grid; grid-template-columns: 188px minmax(0, 1fr); min-height: 560px; }
        .ehr .side { background: var(--nv1); color: #fff; padding: 12px 12px 18px; display: flex; flex-direction: column; gap: 8px; }
        .ehr .brand { text-align: center; font-weight: 800; letter-spacing: 1px; color: #e8c97a; padding: 4px 0 10px; border-bottom: 1px solid rgba(255,255,255,0.15); }
        .ehr .sd em { display: block; font-size: 10.5px; font-style: normal; color: #8fb0d2; margin-bottom: 1px; }
        .ehr .sd input { box-sizing: border-box; width: 100%; padding: 3px 4px; border: 0; border-bottom: 1px solid rgba(255,255,255,0.18); background: transparent; color: #fff; font-size: 12.5px; font-family: inherit; }
        .ehr .sd input.big { font-size: 20px; font-weight: 800; padding: 2px 4px; }
        .ehr .sd select { box-sizing: border-box; width: 100%; padding: 3px 2px; border: 0; border-bottom: 1px solid rgba(255,255,255,0.18); background: transparent; color: #fff; font-size: 12.5px; font-family: inherit; cursor: pointer; }
        .ehr .sd select option { color: #111827; background: #fff; }
        .ehr .sd input[type='date'] { color-scheme: dark; }
        .ehr .sd select:focus { outline: none; background: rgba(255,255,255,0.1); }
        .ehr .sd .v { display: block; padding: 3px 4px; font-size: 12.5px; min-height: 22px; border-bottom: 1px solid transparent; word-break: break-all; }
        .ehr .sd .v.big { font-size: 20px; font-weight: 800; }
        .ehr .ed { margin-top: 6px; border: 1px solid rgba(255,255,255,0.35); background: transparent; color: #fff; border-radius: 4px; padding: 6px; font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .ehr .ed:hover { background: rgba(255,255,255,0.12); }
        .ehr .sd input:focus { outline: none; background: rgba(255,255,255,0.1); }
        .ehr .dcb { background: #475569; color: #e2e8f0; font-weight: 700; font-size: 11.5px; padding: 4px 8px; border-radius: 4px; text-align: center; }
        .ehr .dis.del { color: #b91c1c; }
        .ehr .alg { background: #7f1d1d; color: #fee2e2; font-weight: 700; font-size: 11.5px; padding: 4px 8px; border-radius: 4px; text-align: center; }

        .ehr .main { background: #f1f3f5; padding: 10px; min-width: 0; }
        .ehr .tw { background: #fff; border: 1px solid var(--ln); overflow-x: auto; margin-bottom: 10px; }
        .ehr .ph { margin: 6px 2px 6px; font-size: 12.5px; color: #1d4e89; font-weight: 800; }
        .ehr .ohead { padding: 6px 10px; border-bottom: 1px solid var(--ln); font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .ehr .od { width: 110px; border: 1px solid var(--ln); padding: 2px 6px; font-size: 12.5px; font-family: inherit; }

        .ehr .tbl { width: 100%; border-collapse: collapse; }
        .ehr .tbl th { background: #e9edf1; border: 1px solid var(--ln); padding: 5px 6px; font-weight: 700; font-size: 12px; white-space: nowrap; }
        .ehr .tbl td { border: 1px solid #e1e5ea; padding: 0; vertical-align: top; position: relative; }
        .ehr .tbl .none { text-align: center; color: #94a3b8; padding: 18px; }
        .ehr .tbl input, .ehr .tbl textarea, .ehr .tbl select { box-sizing: border-box; width: 100%; border: 0; background: transparent; padding: 5px 6px; font-size: 12.5px; font-family: inherit; color: #1f2937; }
        .ehr .tbl textarea { resize: vertical; line-height: 1.55; }
        .ehr .tbl input.r { text-align: right; }
        .ehr .tbl select { appearance: none; -webkit-appearance: none; cursor: pointer; }
        .ehr .tbl select.done { color: #0f766e; font-weight: 700; }
        .ehr .tbl input:focus, .ehr .tbl textarea:focus, .ehr .tbl select:focus { outline: 1px solid #2563eb; outline-offset: -1px; background: #fffdf0; }
        .ehr .tbl .bad, .ehr .tbl .hi { color: #dc2626; font-weight: 800; }
        .ehr .tbl .lo { color: #2563eb; font-weight: 800; }
        .ehr .mk { position: absolute; left: 4px; top: 6px; font-size: 10px; }
        .ehr .mk.hi { color: #dc2626; }
        .ehr .mk.lo { color: #2563eb; }
        .ehr .tbl .x { width: 24px; text-align: center; border: 0; background: #fff; }
        .ehr .tbl .x button { border: 0; background: transparent; color: #b4bcc7; cursor: pointer; font-size: 15px; padding: 3px 4px; }
        .ehr .tbl tr:hover .x button { color: #dc2626; }
        .ehr .ord .ck { width: 26px; text-align: center; background: #fff; }
        .ehr .ord .ck button { border: 0; background: transparent; color: #d4dae1; font-size: 13px; font-weight: 900; cursor: pointer; padding: 4px; }
        .ehr .ord .ck button.on { color: #16a34a; }
        .ehr .ord .seq { text-align: center; color: #64748b; padding-top: 6px; }
        .ehr .ord tr.sec td { background: var(--tl); }
        .ehr .ord tr.sec td.x { background: #fff; }
        .ehr .ord tr.sec input { font-weight: 800; color: #12303a; }
        .ehr .ord tr.memo input { color: #be185d; }
        .ehr .adds { display: flex; gap: 6px; padding: 8px; }
        .ehr .add { border: 1px solid var(--ln); background: #f8fafc; border-radius: 4px; padding: 5px 12px; font-size: 12px; font-weight: 700; color: #1d4e89; font-family: inherit; cursor: pointer; }
        .ehr .tw > .add { margin: 8px; }

        .ehr .doc { background: #fff; border: 1px solid var(--ln); padding: 16px 22px 22px; max-width: 860px; margin: 0 auto; }
        .ehr .dh { display: flex; justify-content: space-between; align-items: center; background: #c9a77a; color: #fff; font-weight: 700; padding: 3px 10px; margin-bottom: 12px; }
        .ehr .dh span { font-size: 13px; }
        .ehr .ds { margin-bottom: 12px; }
        .ehr .ds h4 { display: inline-block; margin: 0 0 4px; background: #dfe3fb; color: #1e2a6b; font-size: 12.5px; padding: 1px 10px 1px 4px; font-weight: 800; }
        .ehr .ds input, .ehr .ds textarea, .ehr .nl input { box-sizing: border-box; width: 100%; border: 0; border-bottom: 1px dashed #d5dae0; background: transparent; padding: 4px 4px; font-size: 13px; font-family: inherit; color: #111827; line-height: 1.6; }
        .ehr .ds textarea { resize: vertical; }
        .ehr .ds input:focus, .ehr .ds textarea:focus, .ehr .nl input:focus { outline: none; background: #fffdf0; border-bottom-color: #2563eb; }
        .ehr .nl { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 28px; }
        .ehr .nl label { display: flex; align-items: center; gap: 8px; }
        .ehr .nl b { flex: 0 0 112px; font-size: 12px; color: #334155; font-weight: 600; white-space: nowrap; }


        .ehr .nc { background: #fff; border: 1px solid var(--ln); margin-bottom: 10px; padding: 10px 12px 12px; }
        .ehr .ncHead { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-bottom: 8px; }
        .ehr .ncHead b { color: #1d4e89; font-size: 13px; }
        .ehr .ncHead label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; }
        .ehr .ncHead input { border: 1px solid var(--ln); padding: 4px 8px; font-size: 12.5px; font-family: inherit; }
        .ehr .ncHead label:last-child input { width: 220px; }
        .ehr .ncGrid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .ehr .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
        .ehr .chips button { border: 1px solid #c5d3e3; background: #f4f8fc; color: #1d4e89; border-radius: 999px; padding: 4px 11px; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; }
        .ehr .chips button.on { background: #1d4e89; color: #fff; border-color: #1d4e89; }
        .ehr .ncGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .ehr .ncCol .lbl { font-size: 12px; font-weight: 800; color: #12303a; background: var(--tl); padding: 3px 8px; margin-bottom: 6px; }
        .ehr .phs { display: flex; flex-direction: column; gap: 3px; margin-bottom: 6px; }
        .ehr .phs button { text-align: left; border: 1px solid #e1e5ea; background: #fafbfc; padding: 4px 8px; font-size: 12px; font-family: inherit; color: #1f2937; cursor: pointer; border-radius: 3px; }
        .ehr .phs button:hover { background: #eef6ff; border-color: #9bbbe0; }
        .ehr .phs .hint { color: #94a3b8; font-size: 12px; padding: 4px 2px; }
        .ehr .ncCol textarea { box-sizing: border-box; width: 100%; border: 1px solid var(--ln); padding: 6px 8px; font-size: 12.5px; font-family: inherit; line-height: 1.55; resize: vertical; }
        .ehr .ncCol textarea:focus { outline: 1px solid #2563eb; outline-offset: -1px; background: #fffdf0; }
        .ehr .ncFoot { display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; }
        .ehr .ncFoot button { border: 1px solid var(--ln); background: #f8fafc; padding: 6px 16px; font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer; border-radius: 4px; }
        .ehr .ncFoot .sv { background: #1d4e89; border-color: #1d4e89; color: #fff; }
        .ehr .ncFoot .sv:disabled { opacity: 0.4; cursor: default; }
        @media (max-width: 1100px) { .ehr .ncGrid.four { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .ehr .ncGrid, .ehr .ncGrid.four { grid-template-columns: 1fr; } }
        @media (max-width: 860px) {
          .ehr .body { grid-template-columns: 1fr; }
          .ehr .side { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; }
          .ehr .brand { grid-column: 1 / -1; padding-bottom: 6px; }
          .ehr .alg, .ehr .dcb, .ehr .ed { grid-column: 1 / -1; }
          .ehr .nl { grid-template-columns: 1fr; }
          .ehr .doc { padding: 12px; }
        }
      `}</style>
    </div>
  );
}
