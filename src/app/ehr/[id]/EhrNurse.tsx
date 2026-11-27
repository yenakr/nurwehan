'use client';

import { vnow } from '../vclock';
import { SAMPLES } from '../samples';
import { MATS, matsFor } from '../codes';
import NurseForm from './NurseForms';
import ProcInput from './ProcInput';
import DxReg from './DxReg';
import { USAGE_MAP, usageOf } from '../usage';
import { RxCompare, FutureSched, Sticker, CommonReq, DcPlan, UsageWin, BedTransfer } from './RefWins';
import LabResults from './LabResults';
import OrderCompare from './OrderCompare';
import NursingRecord from './NursingRecord';
import { labTestsFor, resolveLabs } from '../labref';
import { PatInfo, SurgHist, VaccHist, QrView } from './PatientViews';
import { StaffWin, DocReqWin, RichMemo } from './NurseExtras';
import { DEPTS, buildDirectory } from '../directory';
import { confirmDialog } from '@/components/Dialog';
import { Fragment, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { isMed, slotsOf, timesFor, group, viewOrders, rollover, type Item, type Groups } from '../ordday';
import { migrate, shiftChart, withBp, type ChartData, type Row } from '../types';
import WardBulk, { type BulkPt } from '../WardBulk';

export type Roster = { id: string; ward: string | null; bed: string | null; name: string | null; ageSex: string | null; ptNo: string | null; doctor: string | null; admit?: string | null; disDate?: string | null; orders?: Row[] };

const MENUS: { id: string; label: string }[] = [
  { id: 'todo', label: '오늘 할 일' },
  { id: 'notes', label: '간호기록' },
  { id: 'overview', label: '오버뷰' },
  { id: 'flowsheet', label: 'Flowsheet' },
  { id: 'medrec', label: '투약기록' },
  { id: 'labres', label: '검사결과' },
  { id: 'memos', label: '간호인수인계' },
  { id: 'vitals', label: '임상관찰' },
  { id: 'bst', label: '혈당·인슐린' },
  { id: 'nurseinfo', label: '간호정보조사지' },
  { id: 'care', label: '간호과정' },
  { id: 'nact', label: '간호행위' },
  { id: 'mat', label: '처치/재료 입력' },
  { id: 'ret', label: '약·주사 반납' },
  { id: 'consult', label: '협진' },
  { id: 'bulk', label: '활력징후 일괄' },
  { id: 'docreq', label: '서류 요청' },
  { id: 'handover', label: '인수인계지' },
  { id: 'adm', label: '입퇴원 예정' },
  { id: 'discharge', label: '퇴원정보/계획' },
  { id: 'dir', label: '원내번호조회' },
  { id: 'staff', label: '의료진 · Notify' },
  { id: 'patinfo', label: '환자정보' },
  { id: 'qr', label: 'QR 보기 (팔찌·약포지)' },
  { id: 'dxhist', label: '상병등록' },
  { id: 'surghist', label: '수술이력' },
  { id: 'vacc', label: '방종이력' },
  { id: 'rxcmp', label: '전처방 비교' },
  { id: 'futsch', label: '환자향후일정조회' },
  { id: 'sticker', label: '스티커 출력' },
  { id: 'cmnreq', label: '공통업무지원 의뢰' },
  { id: 'dcplan', label: '퇴원후 건강계획' },
  { id: 'usage', label: '용법코드 조회' },
  { id: 'unauth', label: '미인증기록' },
];

const CATS: { name: string; items: string[] }[] = [
  { name: '최근사용', items: [] },
  { name: '환자선택', items: [] },
  { name: '정보조회', items: ['overview', 'patinfo', 'dxhist', 'surghist', 'vacc', 'labres', 'futsch', 'dir'] },
  { name: '의사소통', items: ['consult', 'docreq', 'cmnreq', 'staff'] },
  { name: '출력·퇴원', items: ['qr', 'sticker'] },
  { name: '기록', items: ['notes', 'flowsheet', 'vitals', 'bst', 'nurseinfo', 'care', 'nact', 'unauth', 'dcplan'] },
  { name: '처방', items: ['mat', 'rxcmp', 'usage', 'medrec', 'ret'] },
  { name: '예약', items: ['adm', 'discharge'] },
  { name: '병동', items: ['todo', 'memos', 'handover', 'bulk'] },
  { name: '회송', items: [] },
  { name: '의무기록', items: [] },
  { name: '인력', items: [] },
  { name: '교육', items: [] },
  { name: '연결', items: [] },
  { name: '원내공통', items: [] },
  { name: 'QPS(공통)', items: [] },
  { name: '원내전화번호', items: ['dir'] },
];

const ORG = buildDirectory();

const pad = (n: number) => String(n).padStart(2, '0');
// 간호메모·간호의사소통 기록 지침(2025.2) 분류
const DOC_CATS = ['진료', '식이', '상처관리/적용기구', '환자정보', '검사', '기타'];
const NUR_CATS = ['주요정보', '진료', '검사', '투약', '특수치료', '항암치료', '수혈', '기타'];
const NFG: { g: string; guide: string; subs: { s: string; items: string[] }[] }[] = [
  { g: '낙상예방 및 관리', guide: '입원 시 및 상태 변화 시 낙상위험도를 평가하고, 고위험군은 낙상 예방 중재를 시행한 뒤 해당 시간 칸에 기록합니다.', subs: [
    { s: '낙상위험평가', items: ['제외대상(고위험중재 대상)', '낙상 평가 사유'] },
    { s: '낙상예방교육 위험간호중재(성인)', items: ['환경 및 시설 관리', '낙상에 대한 직원들의 정보 공유', '환자·보호자에게 낙상 예방교육', '수면 전 배뇨 확인 및 화장실 다녀오기', '의식이 불안정한 환자는 보호자 상주', '신체보호대 적용(의사 order 시)', '환자 이송 시 기능원에게 낙상 주의사항 설명'] },
  ] },
  { g: '욕창예방 및 관리', guide: 'Braden Scale로 욕창 위험을 평가하고 고위험군은 2시간마다 체위변경 후 피부 상태를 확인해 기록합니다.', subs: [
    { s: '욕창위험평가도구(성인)', items: ['욕창 평가 사유', '욕창위험 평가도구(Braden)'] },
  ] },
  { g: '통증관리', guide: 'NRS(0~10)로 통증을 평가하고 중재 후 재평가 결과를 기록합니다.', subs: [
    { s: '통증평가', items: ['통증 평가 사유', '통증유무', '통증 시작시기', '통증강도(척도)', '통증위치', '통증강도(점수)', '통증양상'] },
    { s: '통증완화중재', items: ['비약물요법', '약물요법'] },
  ] },
];
const SCR: Record<string, string> = { todo: 'MNR101F1', notes: 'MNR210F1', patinfo: 'MNR120F1', dxhist: 'MNR130F1', surghist: 'MNR131F1', vacc: 'MNR132F1', labres: 'MNR310F1', medrec: 'MNR410F1', flowsheet: 'MNR281F1', overview: 'MNR110F1', vitals: 'MNR281F2', bst: 'MNR281F3', mat: 'MNR520F1', nact: 'MNR510F1', qr: 'MNR900F1', staff: 'MNR700F1', rxcmp: 'MDI604F1', futsch: 'SWF380F1', sticker: 'MNZ939F1', cmnreq: 'MDM610F1', dcplan: 'MNR320F1', usage: 'MDI120F1', unauth: 'MNR260F1' };
const hm = () => { const d = vnow(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dutyNow = () => { const h = vnow().getHours(); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };
const HIGH = /(insulin|인슐린|heparin|헤파린|potassium|kcl|칼륨|morphine|모르핀|fentanyl|펜타닐|midazolam|미다졸람|항암|digoxin|디곡신|warfarin|와파린|propofol|ketamine|마약)/i;
// 병실 기준 담당 팀: 1~3호실 1팀, 4호실 이후 2팀
const teamOf = (bed: string | null) => ((Number((bed || '').split('-')[0]) || 0) % 100 <= 3 ? '1팀' : '2팀');
const SUBS = ['먹는약', '주사약', '기타'];
const subOf = (r: Row) => (/주사|IV|IM|SC|inj/i.test(`${r.route || ''}`) ? 1 : /PO|경구/i.test(r.route || '') ? 0 : 2);
export { slotsOf, timesFor, group } from '../ordday';
export type { Item, Groups } from '../ordday';

// 수술·시술·검사 예정마다 필요한 준비 항목. 해당 없으면 비어 있다.
type CkGroup = { title: string; items: string[] };
function checklist(d: ChartData): CkGroup[] {
  const today = vnow();
  const ymd = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  // 수술·시술·침습적 검사 "전" 준비가 필요한 것만 대상으로 한다 (이미 끝난 수술, 수술 후 관찰·간호는 제외)
  const NOT = /수술\s*후|술\s*후|후\s|관찰|dressing|드레싱|보행|교육|POD|재료|상처|배액|조기|f\/u|추적/i;
  const src: [string, string][] = [
    ...d.sched.filter(r => r.st !== '완료' && r.st !== '취소').map((r): [string, string] => [r.kind || '', r.name || '']),
    ...d.surgery.filter(r => r.name && (r.date || '').slice(0, 10) >= ymd).map((r): [string, string] => ['수술', r.name || '']),
    ...d.orders.filter(r => r.kind !== 'sec' && r.kind !== 'memo' && r.pri !== 'D/C' && r.name && r.st !== '완료' && r.st !== '집계완료' && r.st !== '취소' && !Object.keys(r).some(k => /^t\d+$/.test(k) && r[k])).map((r): [string, string] => ['', r.name || '']),
  ];
  const out: CkGroup[] = [];
  const seen = new Set<string>();
  src.forEach(([kind, name]) => {
    if (!name.trim() || NOT.test(name)) return;
    const t = `${kind} ${name}`;
    let items: string[] = [];
    let label = '';
    if (/수술|시술|관상동맥|PCI|angioplasty/i.test(t)) { items = ['금식', '동의서', '보호자', '수술·시술 부위 확인', '장신구·틀니 제거']; label = /시술/.test(t) && !/수술/.test(t) ? '시술' : '수술'; }
    else if (/내시경|endoscop|colonoscop|EGD/i.test(t)) { items = ['금식', '동의서', '장 정결 확인']; label = '침습 검사'; }
    else if (/생검|biopsy|천자|paracentesis|thoracentesis|조영술|angiograph/i.test(t)) { items = ['금식', '동의서', '조영제 알러지 확인']; label = '침습 검사'; }
    else if (/수혈|transfusion|PRBC/i.test(t) && !/cross|matching|type/i.test(t)) { items = ['동의서', '혈액 준비 확인']; label = '수혈'; }
    if (!items.length) return;
    const title = `${label} · ${name.trim()}`;
    if (seen.has(title)) return;
    seen.add(title);
    out.push({ title, items });
  });
  return out;
}

export type Todo = { time: string; label: string; name: string; detail: string; state: '완료' | '지연' | '예정'; it: Item; nth: number; first: boolean };
function todoOf(g: Groups, duty: string, isToday: boolean): Todo[] {
  const out: Todo[] = [];
  const add = (arr: Item[], kind: 'med' | 'base' | 'lab', label: string) => arr.forEach(it => {
    if (it.r.pri === 'D/C' || it.r.st === '취소') return;
    const times = timesFor(it.r, kind);
    const nDone = kind === 'lab' ? (it.r.st === '완료' || it.r.st === '집계완료' ? times.length : 0) : slotsOf(it.r).length;
    const h0 = Number(hm().slice(0, 2));
    const from = duty === 'D' ? 6 : duty === 'E' ? 14 : 22;
    times.forEach((t, k) => {
      const done = k < nDone;
      const th = Number(t.slice(0, 2));
      const inDuty = duty === 'N' ? (th >= 22 || th < 6) : (th >= from && th < from + 8);
      if (kind !== 'med' && !done && isToday && !inDuty) return;
      void h0;
      const late = !done && isToday && t < hm() && (Number(hm().slice(0, 2)) * 60 + Number(hm().slice(3)) - (Number(t.slice(0, 2)) * 60 + Number(t.slice(3)))) > 60;
      out.push({ time: t, label, name: it.r.name || '', detail: [it.r.dose && `${it.r.dose}${it.r.unit || ''}`, it.r.route].filter(Boolean).join(' · '), state: done ? '완료' : late ? '지연' : '예정', it, nth: k, first: k === nDone });
    });
  });
  add(g.med, 'med', '투약');
  add(g.base, 'base', '간호');
  add(g.lab, 'lab', '검사');
  out.sort((a, b) => a.time.localeCompare(b.time));
  return out;
}


type Dot = { v: 'front' | 'back'; x: number; y: number; c: string; t: string };
// 좌표는 신체 그림 이미지(앞면 224×480) 픽셀 기준: 실제 실루엣을 측정해 정했다.
// 앞면에서는 환자의 오른쪽(Rt.)이 화면 왼쪽, 뒷면은 좌우가 반대라 가운데(112)를 기준으로 뒤집는다.
function bodyPlace(kind: string, site: string): { v: 'front' | 'back'; x: number; y: number } {
  const t = `${kind} ${site}`;
  const R = /우|rt|right/i.test(site), L = /좌|lt|left/i.test(site);
  const back = /천골|엉덩|sacr|둔|회음|(?<!손)등|배면|견갑|후두|뒤꿈치|발뒤꿈|heel|back|occip/i.test(t) && !/foley|도뇨|요도/i.test(t);
  const sx = (x: number) => (back ? 223 - x : x);
  const side = (r: number, l: number, mid: number) => (R ? r : L ? l : mid);
  const at = (x: number, y: number) => ({ v: back ? ('back' as const) : ('front' as const), x: sx(x), y });
  if (/foley|도뇨|요도|방광|urethra|bladder/i.test(t)) return at(112, 264);
  if (/l-tube|ng tube|비위관|경관|nasogastric|위관/i.test(t)) return at(112, 54);
  if (/t-cannula|tracheo|기관/i.test(t)) return at(112, 84);
  if (/chest tube|흉관/i.test(t)) return at(side(86, 138, 112), 160);
  if (/후두|occip/i.test(t)) return at(112, 34);
  if (/두|머리|head|비강|코|얼굴/i.test(t)) return at(112, 40);
  if (/central|c-line|중심정맥|picc|port|쇄골|경부|목|jugular|subclav/i.test(t)) return at(side(92, 132, 112), 98);
  if (/천골|sacr|엉덩|둔/i.test(t)) return at(112, 258);
  if (/회음/i.test(t)) return at(112, 284);
  if (/견갑/i.test(t)) return at(side(92, 132, 112), 130);
  if (/(?<!손)등|배면|back/i.test(t)) return at(112, 165);
  if (/흉|가슴|chest/i.test(t)) return at(side(92, 132, 112), 145);
  if (/복|abd|jp|drain|배액|위루|장루|stoma|배꼽/i.test(t)) return at(side(98, 126, 112), /하복|suprapubic|치골/i.test(t) ? 238 : /상복|epigas|명치/i.test(t) ? 190 : 214);
  if (/손|수부|hand|손목|wrist/i.test(t)) return at(side(28, 196, 28), 268);
  if (/전완|팔|상지|arm|iv|정맥|말초|peripheral|a-line|동맥|주관절/i.test(t)) return at(side(48, 176, 48), 205);
  if (/뒤꿈치|발뒤꿈|heel/i.test(t)) return at(side(75, 160, 75), 456);
  if (/발|foot|족/i.test(t)) return at(side(75, 160, 75), 458);
  if (/무릎|knee/i.test(t)) return at(side(86, 147, 86), 395);
  if (/대퇴|허벅|thigh/i.test(t)) return at(side(89, 142, 89), 335);
  if (/다리|하지|종아리|leg|calf/i.test(t)) return at(side(87, 147, 87), 430);
  return at(side(98, 126, 112), 214);
}
const lr = (x: string) => x.replace(/우측\s*/g, 'Rt. ').replace(/좌측\s*/g, 'Lt. ').replace(/양측\s*/g, 'Both ');
export function bodyDots(data: ChartData): Dot[] {
  const dots: Dot[] = [];
  data.wounds.forEach(w => { if (w.site) dots.push({ ...bodyPlace(w.kind || '', w.site), c: '#d97706', t: `${w.kind || '상처'} ${lr(w.site)}` }); });
  data.lines.filter(l => l.st !== '제거').forEach(l => { if (l.site || l.kind) dots.push({ ...bodyPlace(l.kind || '', l.site || ''), c: '#2563eb', t: `${l.kind || '라인'} ${lr(l.site || '')}` }); });
  return dots;
}
// 왼쪽이 뒷면, 오른쪽이 앞면
function BodyFig({ dots, width }: { dots: Dot[]; width: number }) {
  return (
    <svg viewBox="0 0 450 480" width={width} aria-label="오버뷰 신체">
      <rect x="0" y="0" width="450" height="480" rx="8" fill="#fff" />
      <image href="/ehr/body-back.png" x="2" y="0" width="218" height="480" />
      <image href="/ehr/body-front.png" x="226" y="0" width="224" height="480" />
      <text x="110" y="476" textAnchor="middle" fontSize="14" fill="#64748b">뒤</text>
      <text x="338" y="476" textAnchor="middle" fontSize="14" fill="#64748b">앞</text>
      {dots.map((d, k) => <circle key={k} cx={(d.v === 'back' ? 2 : 226) + d.x} cy={d.y} r="11" fill={d.c} stroke="#fff" strokeWidth="2.5"><title>{d.t}</title></circle>)}
    </svg>
  );
}

export default function EhrNurse({
  data, setData, userName, roster, caseId, win, onOpen, onClose, drawer, nav, actions, onChart, onLabel,
}: {
  data: ChartData;
  setData: Dispatch<SetStateAction<ChartData>>;
  userName: string;
  roster: Roster[];
  caseId: string;
  win: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  drawer: ReactNode;
  nav?: ReactNode;
  actions?: { label: string; run: () => void; disabled?: boolean }[];
  onChart: () => void;
  onLabel: () => void;
}) {
  const router = useRouter();
  const i = data.info;
  const skillMode = i.mode === 'skill';
  const SMP: typeof SAMPLES = skillMode ? [] : SAMPLES; // 핵심술기 EHR은 자율 EHR 환자와 섞이지 않는다
  const [date, setDate] = useState(() => { const t = vnow(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; });
  const [ward, setWard] = useState(i.ward || '');
  const [maxed, setMaxed] = useState(false);
  useEffect(() => { try { if (caseId && !skillMode) localStorage.setItem('ehr.lastPt', String(caseId)); } catch { /* 저장 불가 */ } }, [caseId]);
  const [team, setTeam] = useState(() => teamOf(i.bed || ''));
  const [dmsg, setDmsg] = useState('');
  const [duty, setDuty] = useState(dutyNow());
  const [q, setQ] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [cmp, setCmp] = useState(false);
  const [msg, setMsg] = useState('');
  const [dq, setDq] = useState('');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [chk, setChk] = useState<Item | null>(null);
  const [c5, setC5] = useState<Record<string, boolean>>({ g2: true, g3: true });
  const [dbl, setDbl] = useState('');
  const [pt, setPt] = useState('');
  const [hold, setHold] = useState<string | null>(null);
  const [holdNote, setHoldNote] = useState('');
  const todayStr = (() => { const t = vnow(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; })();
  const live = date === (i.slotDay || todayStr);
  const vo = useMemo(() => viewOrders(data, date, todayStr), [data, date, todayStr]);
  const g = useMemo(() => group(vo), [vo]);
  const ordNotes = [...g.base, ...g.med, ...g.prn, ...g.lab].flatMap(it => it.notes).filter(n => n.replace('※', '').trim());
  // 날이 바뀌면(가상 시계 포함) 지난 날의 수행 도장을 기록으로 옮기고 새 날을 비운다
  useEffect(() => { if (i.slotDay && i.slotDay < todayStr) setData(d => rollover(d, todayStr)); }, [todayStr, i.slotDay]); // eslint-disable-line react-hooks/exhaustive-deps
  const wards = Array.from(new Set(roster.map(r => r.ward).filter((w): w is string => !!w)));
  const list = roster.filter(r => r.ward === ward && (team === '전체' || teamOf(r.bed) === team)).sort((a, b) => (a.bed || '').localeCompare(b.bed || '', 'ko', { numeric: true }));
  const flags = Array.from(new Set([...data.acu.map(r => r.risk), ...data.risk.filter(r => /고위험/.test(r.level || '')).map(r => (r.kind || '').split('(')[0])].filter(Boolean)));
  const bulkPts: BulkPt[] = [
    ...list.map(r => ({ self: r.ptNo === i.ptNo, key: r.id, bed: r.bed || '', name: r.name || '', ageSex: r.ageSex || '', id: r.id, make: () => ({ title: '', subject: null, data: {} }) })),
    ...SMP.filter(sp => {
      const x = sp.data.info;
      return x.ward === ward && !roster.some(r => r.ptNo === x.ptNo) && (team === '전체' || teamOf(x.bed || '') === team);
    }).map(sp => ({ key: sp.key, bed: sp.data.info.bed || '', name: sp.data.info.name || '', ageSex: sp.data.info.ageSex || '', make: () => ({ title: sp.title, subject: sp.subject, data: shiftChart(migrate(sp.data)) }) })),
  ].sort((a, b) => a.bed.localeCompare(b.bed, 'ko', { numeric: true }));
  const shift = (n: number) => {
    const [y, m, d0] = date.split('-').map(Number);
    if (!y) return;
    const t = new Date(y, m - 1, d0 + n);
    setDate(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`);
  };
  const [adate, setAdate] = useState(date);
  const shiftA = (n: number) => {
    const [y, m, d0] = adate.split('-').map(Number);
    if (!y) return;
    const t = new Date(y, m - 1, d0 + n);
    setAdate(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`);
  };
  const admRows = (adm: boolean) => {
    const rows: Roster[] = [...roster];
    const have = new Set(roster.map(r => r.ptNo));
    SMP.forEach(sp => {
      const x = sp.data.info;
      if (!x.ward || x.ward === '외래' || x.ward === '응급실' || have.has(x.ptNo || '')) return;
      rows.push({ id: '', ward: x.ward, bed: x.bed || '', name: x.name || '', ageSex: x.ageSex || '', ptNo: x.ptNo || '', doctor: x.doctor || '', admit: x.admit, disDate: x.disDate });
    });
    return rows.filter(r => (adm ? (r.admit || '') : (r.disDate || '')).slice(0, 10) === adate);
  };
  const visit = i.ward === '외래' || i.ward === '응급실';
  const dd = (v?: string) => (v || '').slice(0, 10);
  const vToday = (() => { const t = vnow(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; })();
  useEffect(() => { setDate(vToday); }, [vToday]);
  const dayN = (from?: string) => {
    const f = dd(from);
    if (!f) return '';
    const n = Math.round((new Date(vToday).getTime() - new Date(f).getTime()) / 86400000) + 1;
    return n > 0 ? `${n}일째` : '';
  };
  const podN = (from?: string) => {
    const f = dd(from);
    if (!f) return '';
    const n = Math.round((new Date(vToday).getTime() - new Date(f).getTime()) / 86400000);
    return n > 0 ? `POD#${n}` : n === 0 ? '수술당일' : `D-${-n}`;
  };
  const dxMain = data.dxcode.find(r => r.kind === '주상병' && r.name);
  const [chip, setChip] = useState('');
  const [cat, setCat] = useState('');
  const [admW, setAdmW] = useState('');
  const [notifyDraft, setNotifyDraft] = useState('');
  const [orgSel, setOrgSel] = useState('순환기내과');
  const [fold, setFold] = useState<Record<string, boolean>>({ g2: true, g3: true });
  const tg = (k: string) => setFold(f => ({ ...f, [k]: !f[k] }));
  const [mOpen, setMOpen] = useState(0); // 0 닫힘, 1 메뉴, 2 메뉴 > 업무
  const [mq, setMq] = useState('');
  const [figOpen, setFigOpen] = useState(true);
  const [win2, setWin2] = useState<string | null>(null);
  const OWN = ['todo', 'notes', 'patinfo', 'dxhist', 'surghist', 'vacc', 'labres', 'medrec', 'flowsheet', 'overview', 'adm', 'dir', 'bulk', 'staff', 'docreq', 'vitals', 'bst', 'mat', 'nact', 'qr', 'rxcmp', 'futsch', 'sticker', 'cmnreq', 'dcplan', 'usage', 'unauth'];
  const [ddPos, setDdPos] = useState<{ left: number; top: number } | null>(null);
  const place = (el: HTMLElement) => { const r = el.getBoundingClientRect(); setDdPos({ left: Math.max(4, Math.min(r.left, window.innerWidth - 190)), top: r.bottom + 2 }); };
  const [tabs, setTabs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const openMenu = (id: string) => {
    if (id === 'handover') { router.push(`/ehr/handover?ward=${encodeURIComponent(ward)}&team=${encodeURIComponent(team)}`); return; }
    setTabs(t => (t.includes(id) ? t : [...t, id]));
    setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 8));
    if (win2 === id) setWin2(null);
    if (win !== id) onOpen(id);
  };
  const closeTab = (id: string) => {
    const rest = tabs.filter(x => x !== id);
    setTabs(rest);
    if (win2 === id) setWin2(null);
    if (win === id) { if (rest.length) onOpen(rest[rest.length - 1]); else onClose(); }
  };
  const [mf, setMf] = useState<'all' | 'base' | 'med' | 'lab'>('med');
  const [rt, setRt] = useState<'meal' | 'sched' | 'cons' | 'appt'>('meal');
  const [fTab, setFTab] = useState<'obs' | 'state' | 'lab' | 'io'>('obs');
  const [fColl, setFColl] = useState<string[]>([]);
  const [fHidOpen, setFHidOpen] = useState<string | null>(null);
  const [fGuide, setFGuide] = useState<string | null>(null);
  const [fHist, setFHist] = useState<string | null>(null);
  const [fEdit, setFEdit] = useState<{ it: string; d: string; h: string } | null>(null);
  const [fVal, setFVal] = useState('');
  const [fCtx, setFCtx] = useState<{ x: number; y: number; it: string; d: string; h: string } | null>(null);
  const ALLH = Array.from({ length: 24 }, (_, k) => String(k).padStart(2, '0'));
  const [fShift, setFShift] = useState<'all' | 'D' | 'E' | 'N'>('all');
  const FH = fShift === 'D' ? ALLH.slice(7, 15) : fShift === 'E' ? ALLH.slice(15, 23) : fShift === 'N' ? [...ALLH.slice(23), ...ALLH.slice(0, 7)] : ALLH;
  const todayS = (() => { const t = vnow(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; })();
  const addD = (ds: string, n: number) => { const t = new Date(`${ds}T00:00:00`); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
  const FDAYS = useMemo(() => {
    const a0 = (data.info.admit || '').slice(0, 10);
    let st = /^\d{4}-\d{2}-\d{2}$/.test(a0) ? a0 : addD(todayS, -6);
    if (st < addD(todayS, -13)) st = addD(todayS, -13);
    const out: string[] = [];
    for (let x = st; x <= addD(todayS, 1); x = addD(x, 1)) out.push(x);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.info.admit, todayS]);
  const FCOLS = FDAYS.flatMap(d => FH.map(h => ({ d, h })));
  const flowRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; l: number } | null>(null);
  useEffect(() => {
    if (win !== 'flowsheet') return;
    const el = flowRef.current;
    if (!el) return;
    const k = FCOLS.findIndex(c => c.d === todayS && c.h >= pad(vnow().getHours()));
    el.scrollLeft = Math.max(0, (k < 0 ? FCOLS.length : k) * 52 - el.clientWidth / 2);
  }, [win, win2, fShift, FCOLS.length, todayS]);
  const CATALOG: { g: string; items: string[]; fixed?: boolean; def: boolean }[] = [
    { g: '활력징후', items: ['체온 (℃)', '수축기혈압', '이완기혈압', '맥박 (회/분)', '호흡 (회/분)', 'SpO2 (%)'], fixed: true, def: true },
    { g: '욕창예방 및 관리', items: ['욕창위험평가 (Braden)', '체위변경'], def: false },
    { g: '신체계측', items: ['신장 (cm)', '체중 (kg)'], def: false },
    { g: 'Intake', items: ['IV (mL)', 'Diet (mL)', '기타 섭취 (mL)'], def: true },
    { g: 'Output', items: ['소변 (mL)', '배액 (mL)', '기타 배출 (mL)'], def: true },
    { g: '선택 항목', items: ['통증 (NRS)', 'GCS', '혈당 (mg/dL)', 'O2 (L/min)', '낙상위험평가', '억제대 적용', 'CVP (mmHg)'], def: false },
  ];
  const cfgRow = data.memos.find(m => m.type === 'flowcfg');
  const cfgOn: string[] = cfgRow ? (cfgRow.text || '').split('|').filter(Boolean) : CATALOG.filter(c => c.def).flatMap(c => c.items);
  const itemOn = (it: string) => CATALOG.some(c => c.fixed && c.items.includes(it)) || cfgOn.includes(it);
  const setCfg = (list: string[]) => setData(d => ({ ...d, memos: [...d.memos.filter(m => m.type !== 'flowcfg'), { type: 'flowcfg', text: list.join('|'), author: userName }] }));
  const [fCfg, setFCfg] = useState(false);
  const FG: { g: string; items: string[] }[] = [
    ...CATALOG.map(c => ({ g: c.g, items: c.items.filter(itemOn) })).filter(c => c.items.length > 0),
    ...(cfgOn.some(x => ['IV (mL)', 'Diet (mL)', '기타 섭취 (mL)', '소변 (mL)', '배액 (mL)', '기타 배출 (mL)', '기타 배출 (mL)'].includes(x)) ? [{ g: 'I/O Total', items: ['I/O Total (mL)'] }] : []),
  ];
  const IN = ['IV (mL)', 'Diet (mL)', '기타 섭취 (mL)'];
  const OUT = ['소변 (mL)', '배액 (mL)', '기타 배출 (mL)'];
  const hid = (data.memos.find(m => m.type === 'flowhide')?.text || '').split('|').filter(Boolean);
  const setHid = (list: string[]) => setData(d => ({ ...d, memos: [...d.memos.filter(m => m.type !== 'flowhide'), { type: 'flowhide', text: list.join('|'), author: userName }] }));
  const VMAP: Record<string, string> = { '체온 (℃)': 'bt', '맥박 (회/분)': 'hr', '호흡 (회/분)': 'rr', 'SpO2 (%)': 'spo2' };
  const lastV = [...data.vitals].filter(r => r.time).sort((a, b) => (a.time || '').localeCompare(b.time || '')).slice(-1)[0];
  const abn: string[] = (() => {
    if (!lastV) return [];
    const out: string[] = [];
    const [sb, db] = (lastV.bp || '').split('/').map(Number);
    if (sb && (sb >= 160 || sb < 90)) out.push(`SBP ${sb}`);
    if (db && (db >= 100 || db < 50)) out.push(`DBP ${db}`);
    const hr = Number(lastV.hr), rr = Number(lastV.rr), bt = Number(lastV.bt), sp = Number(lastV.spo2);
    if (hr && (hr > 110 || hr < 50)) out.push(`HR ${hr}`);
    if (rr && (rr > 24 || rr < 10)) out.push(`RR ${rr}`);
    if (bt && (bt >= 38 || bt < 35.5)) out.push(`BT ${bt}`);
    if (sp && sp < 92) out.push(`SpO₂ ${sp}%`);
    return out;
  })();
  const vitRow = (d: string, h: string) => data.vitals.find(v => {
    const t = (v.time || '').trim();
    const hh = /(\d{2}):\d{2}$/.exec(t)?.[1];
    if (hh !== h) return false;
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10) === d;
    if (/^\d{2}-\d{2}\s/.test(t)) return t.slice(0, 5) === d.slice(5);
    return d === todayS;
  });
  const vitAt = (it: string, d: string, h: string) => {
    const r = vitRow(d, h);
    if (!r) return '';
    if (it === '수축기혈압') return r.sbp ?? ((r.bp || '').split('/')[0] || '');
    if (it === '이완기혈압') return r.dbp ?? ((r.bp || '').split('/')[1] || '');
    return VMAP[it] ? r[VMAP[it]] || '' : '';
  };
  const fGet = (it: string, d: string, h: string) => data.memos.find(m => m.type === 'flow' && m.date === d && m.item === it && m.hour === h);
  const fNum = (it: string, d: string, h: string) => Number(fGet(it, d, h)?.text) || 0;
  const ioTotal = (d: string, h: string) => IN.reduce((a, it) => a + fNum(it, d, h), 0) - OUT.reduce((a, it) => a + fNum(it, d, h), 0);
  const SHIFT_H: Record<'D' | 'E' | 'N', string[]> = { D: ALLH.slice(7, 15), E: ALLH.slice(15, 23), N: [ALLH[23], ...ALLH.slice(0, 7)] };
  const SUM_AT: Record<string, 'D' | 'E' | 'N'> = fShift === 'all' ? { '14': 'D', '22': 'E', '23': 'N' } : fShift === 'D' ? { '14': 'D' } : fShift === 'E' ? { '22': 'E' } : { '06': 'N' };
  type FRc = { d: string; h: string; sum?: 'D' | 'E' | 'N' };
  const FR: FRc[] = FDAYS.flatMap(d => FH.flatMap(h => [{ d, h } as FRc, ...(SUM_AT[h] ? [{ d, h, sum: SUM_AT[h] } as FRc] : [])]));
  const sumItem = (it: string, d: string, sh: 'D' | 'E' | 'N') => SHIFT_H[sh].reduce((a, h) => a + fNum(it, d, h), 0);
  const sumAny = (it: string, d: string, sh: 'D' | 'E' | 'N') => SHIFT_H[sh].some(h => fGet(it, d, h));
  const hdOf = (d: string) => { const a0 = (data.info.admit || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(a0) || visit || d < a0) return 0; return Math.round((new Date(`${d}T00:00:00`).getTime() - new Date(`${a0}T00:00:00`).getTime()) / 864e5) + 1; };
  const fSet = (it: string, d: string, h: string, v: string) => setData(dd => {
    const rest = dd.memos.filter(m => !(m.type === 'flow' && m.date === d && m.item === it && m.hour === h));
    const next = { ...dd, memos: v.trim() ? [...rest, { type: 'flow', date: d, item: it, hour: h, text: v.trim(), author: userName }] : rest };
    const vk = it === '수축기혈압' || it === '이완기혈압' ? 'bp' : VMAP[it];
    if (vk && v.trim()) {
      const tm = `${d.slice(5)} ${h}:00`;
      const idx = dd.vitals.findIndex(r => (r.time || '').startsWith(d.slice(5)) && (r.time || '').slice(6, 8) === h);
      const old = idx >= 0 ? dd.vitals[idx] : ({ time: tm } as Row);
      const val = v.trim();
      let row: Row = { ...old, [vk]: val };
      if (vk === 'bp') { const k2 = it === '수축기혈압' ? 'sbp' : 'dbp'; row = withBp({ ...old, [k2]: val }); }
      next.vitals = idx >= 0 ? dd.vitals.map((r, j) => (j === idx ? row : r)) : [...dd.vitals, row];
    }
    return next;
  });
  const esc = (v: string) => v.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  const printDoc = (title: string, body: string) => {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:sans-serif;padding:24px}h1{font-size:20px;border-bottom:2px solid #000;padding-bottom:6px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #444;padding:5px 8px;text-align:left}.big{font-size:34px;font-weight:800;margin:10px 0}.tag{display:inline-block;border:3px solid #000;padding:6px 14px;margin:6px;font-size:26px;font-weight:800}</style></head><body>${body}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  const head = () => `<h1>${esc(i.name || '')} (${esc(i.ageSex || '')}) · 환자번호 ${esc(i.ptNo || '')} · ${esc([i.ward, i.bed].filter(Boolean).join(' '))}</h1>`;
  const printOrders = () => printDoc('처방출력', `${head()}<p>${date} 처방</p><table><tr><th>처방명</th><th>용량</th><th>경로</th><th>횟수</th></tr>${vo.filter(o => o.name && o.kind !== 'sec' && o.kind !== 'memo' && o.kind !== 'hid').map(o => `<tr><td>${esc(o.name || '')}</td><td>${esc(o.dose || '')}</td><td>${esc(o.route || '')}</td><td>${esc(o.cnt || o.q || '')}</td></tr>`).join('')}</table>`);
  const printBed = () => printDoc('침상카드', `${head()}<div class="big">${esc(i.name || '')}</div><p>지정의 ${esc(i.doctor || '')} · 주치의 ${esc(i.attending || '')} · 진단 ${esc(dxMain ? dxMain.name : i.dx || '')}</p><p>알러지: ${esc(i.allergy || '없음')} · 격리: ${esc(i.iso || '없음')} · ${i.npo === '1' ? '금식' : ''}</p>${flags.map(f => `<span class="tag">${esc(f)}</span>`).join('')}`);
  const printWarn = () => printDoc('주의라벨', `${head()}${[...flags, ...(i.npo === '1' ? ['금식'] : []), ...(i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) ? [`알러지 ${i.allergy}`] : [])].map(f => `<span class="tag">${esc(f)}</span>`).join('') || '<p>주의 항목 없음</p>'}`);

  const ordSig = (o: Row) => [o.dose, o.unit, o.cnt, o.route, o.pri].map(x => x || '').join('|');
  const ordTxt = (o: Row) => `${o.dose || ''}${o.unit || ''} ${o.route || ''} ${o.cnt || ''} ${o.pri || ''}`.replace(/\s+/g, ' ').trim() || '-';
  const ackOf = (name: string) => data.memos.find(m => m.type === 'ordack' && m.name === name);
  const isChanged = (o: Row) => { const a = ackOf(o.name || ''); return !!a && a.sig !== ordSig(o) && o.st !== '추가'; };
  const ordAck = (o: Row) => setData(d => ({ ...d, memos: [...d.memos.filter(m => !(m.type === 'ordack' && m.name === o.name)), { type: 'ordack', name: o.name || '', sig: ordSig(o), text: ordTxt(o), author: userName, time: `${date} ${hm()}` }] }));
  const chgCnt = data.orders.filter(o => o.name && isChanged(o)).length;
  const ivMl = (r: Row) => {
    if (!isMed(r) || !/^(IV|CIV|IVF|IV-?DRIP)$/i.test((r.route || '').trim())) return 0;
    const amt = parseFloat(r.dose || '');
    return Number.isNaN(amt) ? 0 : /^l$/i.test((r.unit || '').trim()) ? amt * 1000 : /^(ml|cc)$/i.test((r.unit || '').trim()) ? amt : 0;
  };
  const flowAdd = (hh: string, delta: number) => setData(d => {
    const cur = d.memos.find(m => m.type === 'flow' && m.date === date && m.item === 'IV (mL)' && m.hour === hh);
    const rest = d.memos.filter(m => m !== cur);
    const nv = Math.max(0, (Number(cur?.text) || 0) + delta);
    return { ...d, memos: nv > 0 ? [...rest, { type: 'flow', date, item: 'IV (mL)', hour: hh, text: String(nv), author: userName }] : rest };
  });
  const patch = (idx: number, p: Row) => setData(d => ({ ...d, orders: d.orders.map((o, j) => (j === idx ? { ...o, ...p } : o)), info: d.info.slotDay ? d.info : { ...d.info, slotDay: todayStr } }));
  const slots = slotsOf;
  const perform = (it: Item) => {
    const used = slots(it.r);
    const next = `t${(used.length ? Number(used[used.length - 1].slice(1)) : 0) + 1}`;
    const p: Row = { ck: '1', [next]: `${hm()} ${duty}/${userName}` };
    if (HIGH.test(it.r.name || '') && dbl.trim()) p[`v${next.slice(1)}`] = dbl.trim();
    if (!isMed(it.r)) p.st = '완료';
    patch(it.i, p);
    // IV 투약량은 Flowsheet Intake(IV)에 자동 누적
    const ml = ivMl(it.r);
    if (ml > 0) flowAdd(hm().slice(0, 2), ml);
    // 검사 처방은 채혈(검체 채취) 시각을 남기고 결과를 일정 시간 뒤 자동 반영
    if (!isMed(it.r)) {
      const tests = labTestsFor(it.r.name || '');
      if (tests.length) {
        const now = vnow().getTime();
        setData(d => {
          const keep = d.labs.filter(l => l.value || !tests.some(t => t.name === l.name));
          const add = tests.map((t): Row => ({ name: t.name, value: '', unit: t.unit, min: String(t.min), max: String(t.max), sample: t.sample, time: `${date.slice(5)} ${hm()}`, col: `${date} ${hm()}`, due: String(now + 45 * 1000), ord: it.r.name || '' }));
          return { ...d, labs: [...keep, ...add] };
        });
      }
    }
    const used2 = matsFor(it.r);
    if (used2.length) {
      const act = isMed(it.r) ? '투약' : (it.r.name || '');
      setData(d => ({ ...d, mat: [...d.mat, ...used2.map(([item, qty]): Row => ({ time: `${date.slice(5)} ${hm()}`, item, qty: String(qty), unit: MATS.find(m => m[0] === item)?.[1] || 'ea', act, by: userName }))] }));
    }
  };
  const holdDose = (it: Item, reason: string, note: string) => {
    const txt = `${hm()} ${reason}${note.trim() ? ` (${note.trim()})` : ''}/${userName}`;
    patch(it.i, { hold: [it.r.hold, txt].filter(Boolean).join(' | ') });
    setData(d => ({ ...d, notes: [...d.notes, { time: `${date} ${hm()}`, focus: '투약 보류', text: `D)\n${it.r.name} ${it.r.dose || ''}${it.r.unit || ''} ${it.r.route || ''} 투약 보류. 사유: ${reason}${note.trim() ? ` (${note.trim()})` : ''}\n\nA)\n담당의에게 보고 필요 여부 확인함.`, author: userName, shift: duty }] }));
  };
  const [ordMsg, setOrdMsg] = useState('');
  const ask = (it: Item) => {
    if (!live) { setOrdMsg('조회일이 오늘이 아니라 수행 처리할 수 없습니다'); return; }
    if (it.r.st === '추가') { setOrdMsg(`'${it.r.name}' 처방을 먼저 접수하세요`); return; }
    setOrdMsg('');
    if (isMed(it.r)) { setC5({}); setDbl(''); setPt(''); setHold(null); setHoldNote(''); setChk(it); } else perform(it);
  };
  const undo = (it: Item) => {
    if (!live) { setOrdMsg('조회일이 오늘이 아니라 수행 취소할 수 없습니다'); return; }
    const used = slots(it.r);
    // 마지막 투약을 취소하면 Flowsheet Intake(IV)에서 같은 양을 뺀다
    if (used.length) { const ml = ivMl(it.r); const hh = (it.r[used[used.length - 1]] || '').slice(0, 2); if (ml > 0 && /^\d{2}$/.test(hh)) flowAdd(hh, -ml); }
    // 채혈을 취소하면 아직 결과 전인 검사는 대기 목록에서 뺀다
    if (!isMed(it.r)) setData(d => ({ ...d, labs: d.labs.filter(l => !(l.ord === it.r.name && !l.value)) }));
    if (!used.length) return patch(it.i, { ck: '', st: it.r.st === '완료' ? '' : it.r.st });
    patch(it.i, { [used[used.length - 1]]: '', ck: used.length > 1 ? '1' : '', ua: (it.r.ua || '').split(',').filter(x => x && x !== used[used.length - 1]).join(',') });
  };

  // 시간 경과 시뮬레이션: 검사 결과 자동 반영, 협진 접수 → 진행중 → 회신완료
  useEffect(() => {
    const tick = () => setData(d => {
      const now = vnow().getTime();
      const labs = resolveLabs(d.labs, now);
      let cch = false;
      const consult = d.consult.map(c => {
        if (c.st !== '접수' && c.st !== '진행중') return c;
        if (!c.rt) { cch = true; return { ...c, rt: String(now) }; }
        const el = now - Number(c.rt);
        if (el > 120000) {
          cch = true;
          return { ...c, st: '회신완료', rdoc: c.rdoc || '회신의', perf: c.perf || date, reply: c.reply || '의뢰 내용 확인함. 현재 처방 유지하며 경과 관찰 권고. 증상 악화 시 재협진 바랍니다.' };
        }
        if (el > 40000 && c.st === '접수') { cch = true; return { ...c, st: '진행중' }; }
        return c;
      });
      return labs === d.labs && !cch ? d : { ...d, labs, consult };
    });
    const id = setInterval(tick, 10000);
    tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  const memoOf = (t: string) => data.memos.filter(m => m.type === t);
  const sticky = data.memos.findIndex(m => m.type === '간호메모');
  const setSticky = (text: string) => setData(d => {
    const k = d.memos.findIndex(m => m.type === '간호메모');
    const row: Row = { type: '간호메모', text, time: `${date} ${hm()}`, author: userName, shift: duty };
    return { ...d, memos: k >= 0 ? d.memos.map((m, j) => (j === k ? { ...m, ...row } : m)) : [...d.memos, row] };
  });
  const [dcat, setDcat] = useState(DOC_CATS[0]);
  const [mcat, setMcat] = useState(NUR_CATS[0]);
  const addMemo = (type: string, t: string, done: () => void, cat = '') => {
    const text = t.trim();
    if (!text) return;
    setData(d => ({ ...d, memos: [...d.memos, { type, text, cat, time: `${date} ${hm()}`, author: userName, shift: duty }] }));
    done();
  };
  const sendMsg = () => addMemo('간호의사소통', msg, () => setMsg(''), mcat);
  const sendDoc = () => addMemo('진료메모', dmsg, () => setDmsg(''), dcat);
  const ck = (label: string) => (i[`ck:${label}`] === '1') || (label.endsWith('/금식') && i.npo === '1' && i[`ck:${label}`] !== '0');
  const toggle = (label: string) => setData(d => ({ ...d, info: { ...d.info, [`ck:${label}`]: ck(label) ? '0' : '1' } }));
  const find = () => {
    const t = q.trim();
    if (!t) return;
    const hit = roster.find(r => (r.ptNo || '').includes(t)) || roster.find(r => (r.name || '').includes(t));
    if (hit) { router.push(`/ehr/${hit.id}`); return; }
    // 병원 전체 검색: 아직 열어 본 적 없는 환자(샘플)도 찾아서 차트를 만들어 연다
    const sp = SMP.find(x => (x.data.info.ptNo || '').includes(t)) || SMP.find(x => (x.data.info.name || '').includes(t));
    if (!sp) { setQMsg('없는 환자예요'); return; }
    setQMsg('차트 여는 중…');
    fetch('/api/ehr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: sp.title, subject: sp.subject, data: shiftChart(migrate(sp.data)) }) })
      .then(r => r.json().catch(() => ({})))
      .then((j: { id?: string }) => { if (j.id) router.push(`/ehr/${j.id}`); else setQMsg('열 수 없어요'); })
      .catch(() => setQMsg('열 수 없어요'));
  };

  const isToday = date === `${vnow().getFullYear()}-${pad(vnow().getMonth() + 1)}-${pad(vnow().getDate())}`;
  const todo = todoOf(g, duty, isToday);
  const [scope, setScope] = useState<'me' | 'ward'>('me');
  const wardTodo = (() => {
    const pts: { id: string; bed: string; name: string; orders: Row[] }[] = list.map(r => ({ id: r.id, bed: r.bed || '', name: r.name || '', orders: r.ptNo === i.ptNo ? data.orders : r.orders || [] }));
    const have = new Set(roster.map(r => r.ptNo));
    SMP.forEach(sp => {
      const x = sp.data.info;
      if (x.ward !== ward || have.has(x.ptNo || '') || (team !== '전체' && teamOf(x.bed || '') !== team)) return;
      pts.push({ id: '', bed: x.bed || '', name: x.name || '', orders: sp.data.orders || [] });
    });
    return pts.flatMap(p => todoOf(group(p.orders), duty, isToday).filter(t => t.label !== '검사' && t.state !== '완료').map(t => ({ ...t, p })));
  })().sort((a, b) => a.time.localeCompare(b.time) || a.p.bed.localeCompare(b.p.bed, 'ko', { numeric: true }));

  const nowMin = Number(hm().slice(0, 2)) * 60 + Number(hm().slice(3));
  // 미인증 서명 인증: 처방 칸(ua)과 지난날 기록(mar.ua) 모두
  const certify = (idx: number, key: string) => setData(d => ({ ...d, orders: d.orders.map((o, j) => (j === idx ? { ...o, ua: (o.ua || '').split(',').filter(x => x && x !== key).join(',') } : o)) }));
  const certifyMar = (row: Row) => setData(d => ({ ...d, mar: d.mar.map(m => (m === row ? { ...m, ua: '' } : m)) }));
  const unauthOrders = data.orders.flatMap((o, i) => (o.ua || '').split(',').filter(Boolean).map(k => ({ i, k, o })));
  const unauthMar = data.mar.filter(m => m.ua === '1');
  const unSlot = async (it: Item) => { if (await confirmDialog('마지막 수행 기록을 취소할까요?')) undo(it); };
  // 처방 조회: 실제 OCS처럼 한 장의 표에 구분 띠(기본처방/투약/PRN/검사)와 1~N회 칸을 둔다
  const slotN = (it: Item, kind: 'med' | 'base' | 'prn' | 'lab') => (kind === 'prn' || kind === 'lab' ? slots(it.r).length + (kind === 'prn' ? 1 : 0) : Math.max(timesFor(it.r, kind).length, slots(it.r).length));
  const ocs = () => {
    const parts: { label: string; items: Item[]; kind: 'med' | 'base' | 'prn' | 'lab' }[] = [
      { label: '기본처방', items: g.base, kind: 'base' }, { label: '투 약', items: g.med, kind: 'med' },
      { label: '약주사 PRN', items: g.prn, kind: 'prn' }, { label: '진단검사', items: g.lab, kind: 'lab' },
    ];
    const N = Math.min(7, Math.max(3, ...parts.flatMap(pp => pp.items.map(it => slotN(it, pp.kind)))));
    const COLS = 7 + N;
    let seq = 0;
    return (
      <div className="ns-otw ns-ocs">
        <table className="ns-ot">
          <thead>
            <tr>
              <th style={{ width: 34 }}>순번</th><th>처방명</th><th>용량</th><th>경로</th><th>횟수</th><th>구분</th><th>진행상태</th>
              {Array.from({ length: N }, (_, k) => <th key={k} className="ns-ocn">{k + 1}회</th>)}
            </tr>
          </thead>
          <tbody>
            {parts.map(({ label, items, kind }) => (
              <Fragment key={label}>
                <tr className="ns-ocb"><td colSpan={COLS}>▶ {label} ◀</td></tr>
                {items.length === 0 && <tr><td colSpan={COLS} className="ns-nnone">No data to display</td></tr>}
                {(kind === 'med' ? [...items].sort((a, b) => subOf(a.r) - subOf(b.r)) : items).map((it, idx, arr) => {
                  const r = it.r;
                  const subHead = kind === 'med' && (idx === 0 || subOf(arr[idx - 1].r) !== subOf(r)) ? <tr key={`sh${it.i}`} className="ns-subh"><td colSpan={COLS}>[{SUBS[subOf(r)]}]</td></tr> : null;
                  const stop = r.pri === 'D/C' || r.st === '취소';
                  const done = slots(r);
                  const times = kind === 'prn' || kind === 'lab' ? [] : timesFor(r, kind);
                  const n = Math.max(times.length, done.length);
                  const labDone = r.st === '완료' || r.st === '집계완료';
                  seq += 1;
                  const cellFor = (k: number) => {
                    if (kind === 'lab') {
                      if (k !== 0) return null;
                      return labDone ? <button type="button" className="ns-sl ns-sl-done" disabled={stop || r.st === '집계완료'} onClick={() => unSlot(it)}>{r.st}</button> : !stop ? <button type="button" className="ns-sl ns-sl-next" onClick={() => ask(it)}>완료 처리</button> : null;
                    }
                    if (k < done.length) {
                      const last = k === done.length - 1;
                      if ((r.ua || '').split(',').includes(done[k])) return <button type="button" className="ns-sl ns-sl-done ns-sl-un" title="미인증 서명(PDA 액팅) — 누르면 인증" disabled={stop} onClick={() => certify(it.i, done[k])}>{r[done[k]]}</button>;
                      return <button type="button" className="ns-sl ns-sl-done" title={last ? '누르면 취소' : ''} disabled={stop || !last} onClick={() => unSlot(it)}>{r[done[k]]}{r[`v${done[k].slice(1)}`] ? ` (확인 ${r[`v${done[k].slice(1)}`]})` : ''}</button>;
                    }
                    if (kind === 'prn') return k === done.length && !stop ? <button type="button" className="ns-sl ns-sl-next" onClick={() => ask(it)}>+ 투약</button> : null;
                    if (kind === 'base' && times.length === 0) return k === 0 && !stop && done.length === 0 ? <button type="button" className="ns-sl ns-sl-next" onClick={() => ask(it)}>수행 기록</button> : null;
                    const t = times[k] || '';
                    if (!t) return null;
                    const next = k === done.length;
                    const th = Number(t.slice(0, 2));
                    const from = duty === 'D' ? 6 : duty === 'E' ? 14 : 22;
                    const inDuty = duty === 'N' ? (th >= 22 || th < 6) : (th >= from && th < from + 8);
                    const late = !stop && isToday && inDuty && nowMin - (th * 60 + Number(t.slice(3))) > 60;
                    return <button type="button" className={`ns-sl ${next && !stop ? (late ? 'ns-sl-late' : 'ns-sl-next') : 'ns-sl-wait'}`} disabled={stop || !next} onClick={() => ask(it)}>{t}</button>;
                  };
                  const status = stop ? (r.pri === 'D/C' ? 'D/C' : '취소') : r.st === '추가' ? <button type="button" className="ns-sl ns-sl-next" onClick={() => { patch(it.i, { st: '접수', rcv: `${hm()} ${userName}` }); ordAck(it.r); setOrdMsg(''); }}>접수</button> : kind === 'lab' ? r.st : n > 0 && done.length >= n ? '집계완료' : r.rcv ? <span title={`접수 ${r.rcv}`}>접수</span> : '';
                  return (
                    <Fragment key={it.i}>
                      {subHead}
                      <tr className={stop ? 'ns-x' : ''}>
                        <td className="ns-ocq">{seq}</td>
                        <td className="ns-otn"><b>{r.name}</b>{it.notes.map((m, k) => <span key={k} className="ns-onote">※ {m.replace(/^※\s*/, '')}</span>)}</td>
                        <td>{r.dose ? `${r.dose}${r.unit || ''}` : ''}</td><td title={USAGE_MAP.get(usageOf(r))?.text}>{usageOf(r)}</td><td>{r.cnt}</td>
                        <td className="ns-ocg">{r.pri && r.pri !== 'D/C' ? <i>{r.pri}</i> : null}{(r.opt || '').split(' ').filter(Boolean).map(o => <i key={o} className={o === '비급여' ? 'ns-nhi' : 'ns-alone'}>[{o}]</i>)}{r.hold && <span className="ns-sl ns-hold" title={r.hold}>보류</span>}</td>
                        <td className="ns-otst">{status}{isChanged(r) && <button type="button" className="ns-sl ns-sl-late" title={`이전 ${ackOf(r.name || '')?.text || ''} → 현재 ${ordTxt(r)}`} onClick={() => ordAck(r)}>변경됨 · 확인</button>}</td>
                        {Array.from({ length: N }, (_, k) => <td key={k} className="ns-ocs-c">{cellFor(k)}</td>)}
                      </tr>
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const cl = checklist(data);
  const stat = (it: Item) => (it.r.st === '추가' ? '신규' : it.r.pri === 'D/C' ? '중지' : '유지');
  const all = [...g.base, ...g.med, ...g.prn, ...g.lab];

  return (
    <div className={`ns-nu ${win ? 'ns-hasw' : ''}`}>
      <div className="ns-nmenu">
        <b>홈</b>
        <button type="button" className={mOpen ? 'ns-on' : ''} onClick={() => { setMOpen(mOpen ? 0 : 1); setCat(''); setMq(''); }}>메뉴 ▾</button>
        <input className="ns-mq" placeholder="메뉴찾기" aria-label="메뉴찾기" value={mq} onFocus={e => place(e.currentTarget)} onChange={e => { place(e.currentTarget); setMq(e.target.value); if (mOpen !== 2) setMOpen(2); }} />
        {mOpen >= 1 && <button type="button" className={`ns-wk ${mOpen === 2 ? 'ns-on' : ''}`} onClick={() => setMOpen(mOpen === 2 ? 1 : 2)}>업무</button>}
        {mOpen === 2 && <span className="ns-sepv" />}
        {mOpen === 2 && CATS.map(c => <button key={c.name} type="button" disabled={c.name === '최근사용' ? recent.length === 0 : c.name === '출력·퇴원' ? false : c.items.length === 0} className={cat === c.name ? 'ns-on' : ''} onClick={e => { place(e.currentTarget); setMq(''); setCat(cat === c.name ? '' : c.name); }}>{c.name}</button>)}
        <div className="ns-nav">{nav}</div>
      </div>
      {mOpen === 2 && ddPos && (mq.trim() || cat) && (() => {
        const ms = (ids: string[]) => ids.map(id => MENUS.find(m => m.id === id)).filter((m): m is { id: string; label: string } => !!m);
        const list: { key: string; label: string; disabled?: boolean; run: () => void }[] = mq.trim()
          ? MENUS.filter(m => m.label.includes(mq.trim())).map(m => ({ key: m.id, label: m.label, run: () => { openMenu(m.id); setMq(''); setCat(''); } }))
          : cat === '출력·퇴원'
            ? [...ms(['qr']).map(m => ({ key: m.id, label: m.label, run: () => { openMenu(m.id); setCat(''); } })), ...(actions || []).map(a => ({ key: a.label, label: a.label, disabled: a.disabled, run: () => { a.run(); setCat(''); } }))]
            : (cat === '최근사용' ? ms(recent) : ms(CATS.find(c => c.name === cat)?.items || [])).map(m => ({ key: m.id, label: m.label, run: () => { openMenu(m.id); setCat(''); } }));
        return (
          <>
            <button type="button" className="ns-ddbk" style={{ top: ddPos.top - 2 }} aria-label="닫기" onClick={() => { setCat(''); setMq(''); }} />
            <div className="ns-dd" style={{ left: ddPos.left, top: ddPos.top }}>
              {list.map(x => <button key={x.key} type="button" disabled={x.disabled} onClick={x.run}>{x.label}</button>)}
              {list.length === 0 && <span className="ns-nnone">No data to display</span>}
            </div>
          </>
        );
      })()}
      {(
        <div className="ns-ntabs">
          {tabs.map(id => (
            <span key={id} className={win === id || win2 === id ? 'ns-on' : ''}>
              <button type="button" title={win === id ? '누르면 최소화' : '누르면 열기'} onClick={() => { if (win === id) onClose(); else openMenu(id); }}>{id === 'staff' ? '의료진 · Notify' : MENUS.find(m => m.id === id)?.label}</button>
              {win && win !== id && win2 !== id && OWN.includes(id) && OWN.includes(win) && <button type="button" aria-label="나란히 보기" title="현재 창 옆에 나란히 열기" onClick={() => setWin2(id)}>▯▯</button>}
              {win2 === id && <button type="button" aria-label="분할 해제" title="분할 해제" onClick={() => setWin2(null)}>▢</button>}
              {win === id && <button type="button" aria-label="최소화" title="최소화" onClick={() => onClose()}>&minus;</button>}
              <button type="button" aria-label="탭 닫기" title="닫기" onClick={() => closeTab(id)}>&times;</button>
            </span>
          ))}
        </div>
      )}

      <div className="ns-ngrid">
        <aside className="ns-nl">
          <div className="ns-qs">
            <div className="ns-nsr">
              <input value={q} onChange={e => { setQ(e.target.value); setQMsg(''); }} onKeyDown={e => e.key === 'Enter' && find()} aria-label="환자 검색 (병원 전체)" placeholder="환자번호·이름 (병원 전체)" />
              <button type="button" onClick={find}>검색</button>
            </div>
            {qMsg && <p className="ns-nerr ns-qerr" role="status">{qMsg}</p>}
          </div>
          <div className="ns-npt">
            <div className="ns-nph">
              <b>{i.name || '이름 없음'}</b>
              {i.ageSex && <span className="ns-nsx">{i.ageSex}</span>}
              {i.blood && <span className="ns-nsx" title="혈액형">{i.blood}</span>}
              {i.ptNo && <span className="ns-nno">{i.ptNo}</span>}
            </div>
            <dl className="ns-nkv">
              {i.ward && <><dt>병실</dt><dd>{[i.ward, i.bed].filter(Boolean).join(' ')}</dd></>}
              {(i.dept || i.doctor) && <><dt>진료과</dt><dd><button type="button" className="ns-lnk" onClick={() => openMenu('staff')}>{[DEPTS.find(x => x.code === i.dept)?.name || i.dept].filter(Boolean).join(' · ')}</button></dd></>}
              {i.doctor && <><dt>지정의</dt><dd>{i.doctor}</dd></>}
              {i.attending && <><dt>주치의</dt><dd>{i.attending}</dd></>}
              {dd(i.admit) && !visit && <><dt>입원일</dt><dd>{dd(i.admit)}{dayN(i.admit) && <em>HD#{dayN(i.admit).replace('일째', '')}</em>}</dd></>}
              {dd(i.admit) && visit && <><dt>{i.ward === '응급실' ? '내원일' : '진료일'}</dt><dd>{dd(i.admit)}</dd></>}
              {dd(i.admit) && !visit && <><dt>재원기간</dt><dd>{dd(i.admit).replace(/-/g, '.')}~{dd(i.disDate) ? dd(i.disDate).replace(/-/g, '.') : ''}</dd></>}
              {dd(i.disDate) && !visit && <><dt>퇴원예정</dt><dd>{dd(i.disDate)}</dd></>}
              {data.surgery[0] && dd(data.surgery[0].date) && <><dt>수술일</dt><dd>{dd(data.surgery[0].date)}{podN(data.surgery[0].date) && <em>{podN(data.surgery[0].date)}</em>}</dd></>}
              {(dxMain || i.dx) && <><dt>진단명</dt><dd>{dxMain ? dxMain.name : i.dx}</dd></>}
            </dl>
            <div className="ns-ngrp"><button type="button" className="ns-gh" onClick={() => tg('g0')}>구분<em>{fold.g0 ? '▸' : '▾'}</em></button>{!fold.g0 && <div className="ns-nlinks">
              {(() => {
                const cur = i.ward === '외래' ? '외래' : i.ward === '응급실' ? '응급' : '병동';
                const lastW = (() => { try { return localStorage.getItem('ehr.lastWard') || ''; } catch { return ''; } })();
                const wardTo = cur === '병동' ? i.ward || '41병동' : lastW || '41병동';
                return [['외래', '외래'], ['병동', wardTo], ['응급', '응급']].map(([k, v]) => <button key={k} type="button" className={cur === k ? 'ns-on' : ''} aria-pressed={cur === k} onClick={() => router.push(skillMode ? '/ehr/skills' : `/ehr?view=${encodeURIComponent(v)}`)}>{k}</button>);
              })()}
              {['통합', '다학제'].map(k => <button key={k} type="button" disabled>{k}</button>)}
            </div>}</div>
            <div className="ns-ngrp"><button type="button" className="ns-gh" onClick={() => tg('g1')}>메뉴<em>{fold.g1 ? '▸' : '▾'}</em></button>{!fold.g1 && <div className="ns-nlinks">
              <button type="button" onClick={() => win && closeTab(win)}>OCS</button>
              {([['환자정보', 'patinfo'], ['QR', 'qr'], ['검사결과', 'labres'], ['상병등록', 'dxhist'], ['수술이력', 'surghist'], ['방종이력', 'vacc']] as const).map(([k, id]) => <button key={k} type="button" onClick={() => openMenu(id)}>{k}</button>)}
              {['PACS', 'CIS', '통합치료계획', '타병원', 'PROMS'].map(k => <button key={k} type="button" disabled>{k}</button>)}
            </div>}</div>
            <div className="ns-ngrp"><button type="button" className="ns-gh" onClick={() => tg('g2')}>조회<em>{fold.g2 ? '▸' : '▾'}</em></button>{!fold.g2 && <div className="ns-nlinks">
              {[['CPR', data.cpr.length ? `CPR 기록 ${data.cpr.length}건` : 'CPR 기록 없음'], ['약물이상반응', i.allergy ? `알러지: ${i.allergy}` : '등록된 약물이상반응 없음'], ['건강보험', '건강보험 자격 확인됨 (모의 · 심평원 조회)']].map(([k, v]) => <button key={k} type="button" className={chip === k ? 'ns-on' : ''} onClick={() => setChip(chip === k ? '' : k)}>{k}</button>)}
              {chip && <p>{[['CPR', data.cpr.length ? `CPR 기록 ${data.cpr.length}건` : 'CPR 기록 없음'], ['약물이상반응', i.allergy ? `알러지: ${i.allergy}` : '등록된 약물이상반응 없음'], ['건강보험', '건강보험 자격 확인됨 (모의 · 심평원 조회)']].find(x => x[0] === chip)?.[1]}</p>}
            </div>}</div>
            {abn.length > 0 && (
              <div className="ns-abn">
                <b>⚠ 활력징후 이상 ({lastV?.time})</b>
                <span>{abn.join(' · ')}</span>
                <button type="button" onClick={() => { setNotifyDraft(`활력징후 이상 보고: ${abn.join(', ')}. 확인 부탁드립니다.`); openMenu('staff'); }}>Notify 작성</button>
              </div>
            )}
            <div className="ns-nflags">
              {flags.map(f => <em key={f}>{f}</em>)}
              {i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) && <em className="ns-al">알러지 {i.allergy}</em>}
              {i.iso && i.iso !== '해당 없음' && i.iso !== '없음' && <em>{i.iso}</em>}
              {i.npo === '1' && <em>금식</em>}
            </div>
            <div className="ns-ngrp"><button type="button" className="ns-gh" onClick={() => tg('g3')}>출력<em>{fold.g3 ? '▸' : '▾'}</em></button>{!fold.g3 && <div className="ns-nlinks ns-nprt">
              <button type="button" onClick={printOrders}>처방출력</button>
              <button type="button" onClick={printBed}>침상카드</button>
              <button type="button" onClick={printWarn}>주의라벨</button>
            </div>}</div>
          </div>
          <div className="ns-nbox ns-mbox ns-mdoc">
            <button type="button" className="ns-gh" onClick={() => tg('m1')}>진료메모<small>{memoOf('진료메모').length}</small><em>{fold.m1 ? '▸' : '▾'}</em></button>
            {!fold.m1 && <>
              {memoOf('진료메모').slice(-3).reverse().map((m, k) => <p key={k}>{m.cat && <b className="ns-mc">[{m.cat}] </b>}{m.text}<i>{(m.time || '').slice(-5)} {m.author}</i></p>)}
              {memoOf('진료메모').length === 0 && <p className="ns-nnone">No data to display</p>}
              <div className="ns-nsr">
                <select value={dcat} onChange={e => setDcat(e.target.value)} aria-label="진료메모 분류" className="ns-mcs">{DOC_CATS.map(c => <option key={c}>{c}</option>)}</select>
                <input value={dmsg} onChange={e => setDmsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendDoc()} aria-label="진료메모" />
                <button type="button" onClick={sendDoc} disabled={!dmsg.trim()}>등록</button>
              </div>
            </>}
          </div>
          <div className="ns-nbox ns-mbox ns-mnur">
            <button type="button" className="ns-gh" onClick={() => tg('m2')}>간호의사소통<small>{memoOf('간호의사소통').length}</small><em>{fold.m2 ? '▸' : '▾'}</em></button>
            {!fold.m2 && <>
              {memoOf('간호의사소통').slice(-3).reverse().map((m, k) => <p key={k}>{m.cat && <b className="ns-mc">[{m.cat}] </b>}{m.text}<i>{(m.time || '').slice(-5)} {m.author}</i></p>)}
              {memoOf('간호의사소통').length === 0 && <p className="ns-nnone">No data to display</p>}
              <div className="ns-nsr">
                <select value={mcat} onChange={e => setMcat(e.target.value)} aria-label="간호의사소통 분류" className="ns-mcs">{NUR_CATS.map(c => <option key={c}>{c}</option>)}</select>
                <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} aria-label="간호의사소통" />
                <button type="button" onClick={sendMsg} disabled={!msg.trim()}>등록</button>
              </div>
            </>}
          </div>
          <div className="ns-nbox ns-duty">
            <div className="ns-nd3">
              <select value={ward} onChange={e => setWard(e.target.value)} aria-label="병동">
                {(wards.length ? wards : [i.ward || '']).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select value={team} onChange={e => setTeam(e.target.value)} aria-label="팀">
                {['전체', '1팀', '2팀'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={duty} onChange={e => setDuty(e.target.value)} aria-label="듀티">
                {['D', 'E', 'N'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <table className="ns-nlist">
              <thead><tr><th>병실</th><th>환자명</th><th>환자번호</th><th>주치의</th></tr></thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className={r.name === i.name && r.ptNo === i.ptNo ? 'ns-on' : ''} onClick={() => router.push(`/ehr/${r.id}`)}>
                    <td>{r.bed}</td><td>{r.name}</td><td>{r.ptNo}</td><td>{r.doctor}</td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={4} className="ns-nnone">No data to display</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="ns-tl">
            <h4>진료이력</h4>
            {[...(i.admit ? [{ date: dd(i.admit), kind: i.ward === '외래' ? '외래' : i.ward === '응급실' ? '응급' : '입원', dept: DEPTS.find(x => x.code === i.dept)?.name || i.dept || '', dx: i.dx || '' }] : []), ...data.history.map(h => ({ date: dd(h.date), kind: h.kind || '외래', dept: DEPTS.find(x => x.code === h.dept)?.name || h.dept || '', dx: h.dx || '' }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((h, k) => (
              <div key={k} className="ns-tli">
                <i className={`k_${h.kind}`} />
                <div><b>{h.date.slice(5)}</b> <em className={`k_${h.kind}`}>{h.kind}</em> {h.dept}<br /><span>{h.dx}</span></div>
              </div>
            ))}
            {data.history.length === 0 && !i.admit && <p className="ns-nnone">No data to display</p>}
          </div>
        </aside>

        <aside className={`ns-nf ${figOpen ? '' : 'ns-nfc'}`}>
          <div className="ns-fig">
            <div className="ns-fighd">
              {figOpen && <b>오버뷰</b>}
              <span>
                {figOpen && <button type="button" className="ns-figb" onClick={() => openMenu('overview')}>열기</button>}
                <button type="button" className="ns-figb" aria-expanded={figOpen} title={figOpen ? '접기' : '오버뷰 펼치기'} onClick={() => setFigOpen(v => !v)}>{figOpen ? '◀' : '▶'}</button>
              </span>
            </div>
            {figOpen && (<>
              <BodyFig dots={bodyDots(data)} width={206} />
              <div className="ns-figl">{bodyDots(data).length ? bodyDots(data).map((d, k) => <span key={k}><i style={{ background: d.c }} />{d.t}</span>) : <span className="ns-nnone">No data to display</span>}</div>
              <div className="ns-nfs">
                <section className="ns-nfsec dx">
                  <h4>간호진단 / 문제<b>{data.care.length}</b></h4>
                  {data.care.length === 0 ? <p className="ns-nnone">No data to display</p> : <ul>{data.care.map((c, k) => <li key={k}>{c.dx}</li>)}</ul>}
                </section>
                <section className="ns-nfsec memo">
                  <h4>처방 메모</h4>
                  {(() => { const ms = ordNotes; return ms.length ? <ul>{ms.map((o, k) => <li key={k}>{o.replace(/^※\s*/, '')}</li>)}</ul> : <p className="ns-nnone">No data to display</p>; })()}
                </section>
                <section className="ns-nfsec lab">
                  <h4>7일 내 미실시 검사</h4>
                  {(() => {
                    const labs = g.lab.filter(it => it.r.st !== '완료' && it.r.st !== '집계완료' && it.r.pri !== 'D/C');
                    const ap = data.appts.filter(a2 => a2.st !== '취소' && a2.st !== '진료완료');
                    return labs.length + ap.length === 0 ? <p className="ns-nnone">No data to display</p> : (
                      <ul>
                        {labs.map((it, k) => <li key={`l${k}`}><span>{it.r.name}</span><i>{it.r.t1 || date}</i></li>)}
                        {ap.map((a2, k) => <li key={`a${k}`}><span>{a2.purpose || a2.dept}</span><i>{a2.date} {a2.time}</i></li>)}
                      </ul>
                    );
                  })()}
                </section>
              </div>
            </>)}
          </div>
        </aside>

        <main className="ns-nc">
          <div className="ns-nhd">
            <span>처방조회</span>
            <button type="button" className="ns-arw" onClick={() => shift(-1)} aria-label="전날">&lt;</button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="처방조회일" />
            <button type="button" className="ns-arw" onClick={() => shift(1)} aria-label="다음날">&gt;</button>
            <button type="button" className="ns-cmp" onClick={() => setCmp(true)}>처방비교</button>
          </div>
          {ordMsg && <p className="ns-nerr">{ordMsg}</p>}
          {chgCnt > 0 && <p className="ns-nerr">변경된 처방 {chgCnt}건이 있어요. 내용을 확인하고 &apos;변경됨 · 확인&apos;을 눌러 주세요.</p>}
          {ocs()}
        </main>

        <aside className="ns-nr">
          {cl.length === 0 && <div className="ns-nbox"><h4>체크리스트</h4><p className="ns-nnone">No data to display</p></div>}
          {cl.map(g => (
            <div key={g.title} className="ns-nbox">
              <h4>체크리스트 · {g.title}</h4>
              {g.items.map(l => (
                <label key={l} className="ns-ncb"><input type="checkbox" checked={ck(`${g.title}/${l}`)} onChange={() => toggle(`${g.title}/${l}`)} />{l}</label>
              ))}
            </div>
          ))}
          <div className="ns-nbox">
            <div className="ns-fl-b">
              {([['meal', '식사'], ['sched', '치료일정'], ['cons', '협진'], ['appt', '타과예약']] as const).map(([k, l]) => <button key={k} type="button" className={rt === k ? 'ns-on' : ''} onClick={() => setRt(k)}>{l}</button>)}
            </div>
            <table className="ns-rt">
              <thead><tr>{(rt === 'meal' ? ['구분', '식이', '시작일', '종료일'] : rt === 'sched' ? ['시간', '구분', '내용'] : rt === 'cons' ? ['의뢰일자', '회신과', '회신의', '실시일자'] : ['예약일', '진료과', '의사']).map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {(rt === 'meal' ? data.dietord.map(r => [r.kind || '환자', r.type, r.start, r.end]) : rt === 'sched' ? data.sched.map(r => [r.time, r.kind, r.name]) : rt === 'cons' ? data.consult.map(r => [r.date, r.rdept, r.rdoc, r.perf]) : data.appts.map(r => [r.date, r.dept, r.doc])).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c || ''}</td>)}</tr>)}
                {(rt === 'meal' ? data.dietord : rt === 'sched' ? data.sched : rt === 'cons' ? data.consult : data.appts).length === 0 && <tr><td colSpan={4} className="ns-nnone">No data to display</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="ns-nbox">
            <h4>간호메모</h4>
            <div key={i.ptNo || 'x'}><RichMemo value={sticky >= 0 ? data.memos[sticky].text || '' : ''} onChange={setSticky} /></div>
          </div>
        </aside>
      </div>

      <div className="ns-bbar">
        <div>
          {([['환자정보', 'patinfo'], ['검사결과', 'labres'], ['간호기록', 'notes'], ['Flowsheet', 'flowsheet'], ['투약기록', 'medrec'], ['협진', 'consult'], ['상병등록', 'dxhist'], ['수술이력', 'surghist'], ['퇴원정보', 'discharge'], ['의료진', 'staff']] as const).map(([k, id]) => <button key={id} type="button" onClick={() => openMenu(id)}>{k} ›</button>)}
        </div>
        <div className="ns-bbr">
          <button type="button" className="ns-bp" onClick={() => openMenu('notes')}>간호활동</button>
          <button type="button" onClick={onLabel}>투약라벨 출력</button>
          <button type="button" onClick={printOrders}>처방출력</button>
          <button type="button" onClick={printBed}>침상카드</button>
          <button type="button" onClick={printWarn}>주의라벨</button>
        </div>
      </div>

      {cmp && <OrderCompare data={data} today={date} onClose={() => setCmp(false)} />}

      {chk && (() => {
        const r = chk.r;
        const al = (i.allergy || '').replace(/\(.*\)/, '').trim();
        const warn = al && !/^(없음|무|none|-)$/i.test(al) && (r.name || '').toLowerCase().includes(al.toLowerCase());
        const high = HIGH.test(r.name || '');
        const need = ['d', 'q', 'r', 't', ...(warn ? ['a'] : [])];
        const ptOk = pt.trim() !== '' && pt.trim() === (i.ptNo || '').trim();
        const ok = ptOk && need.every(k => c5[k]) && (!high || dbl.trim().length > 0);
        const row = (k: string, label: string) => <label className="ns-ncb"><input type="checkbox" disabled={!ptOk} checked={!!c5[k]} onChange={e => setC5(c => ({ ...c, [k]: e.target.checked }))} />{label}</label>;
        const REASONS = ['환자 거부', '금식·검사 예정', '구토·삼킴 곤란', '활력징후 이상', '처방 확인 필요', '약 미도착', '기타'];
        return (
          <div className="ns-nmd" role="dialog" aria-label="투약 확인">
            <button type="button" className="ns-nmk" aria-label="닫기" onClick={() => setChk(null)} />
            <div className="ns-nmb">
              <header><b>투약 확인</b><button type="button" onClick={() => setChk(null)}>닫기</button></header>
              <div className="ns-nmc">
                {hold === null ? (
                  <>
                    <div className="ns-nstep"><b>1. 환자 확인</b><span>{i.name} · 환자 팔찌의 환자번호를 입력</span></div>
                    <input className="ns-ndq" value={pt} onChange={e => setPt(e.target.value)} aria-label="환자번호 확인" />
                    {pt.trim() !== '' && !ptOk && <div className="ns-nwarn">환자번호가 달라요. 환자를 다시 확인하세요.</div>}
                    <div className="ns-nstep"><b>2. 약 확인</b><span>{r.name}</span></div>
                    {row('d', `약물: ${r.name}`)}
                    {row('q', `용량: ${r.dose || ''}${r.unit || ''}`)}
                    {row('r', `경로: ${r.route || '-'}`)}
                    {row('t', `시간: ${hm()}`)}
                    {warn && <div className="ns-nwarn">{row('a', `알러지 주의: ${i.allergy}. 처방의에게 확인했나요?`)}</div>}
                    {high && (
                      <div className="ns-nwarn">
                        <p>고위험 약물: 용량, 농도, 펌프 설정을 둘이서 확인하고 확인한 사람 이름을 입력하세요.</p>
                        <input className="ns-ndq" value={dbl} onChange={e => setDbl(e.target.value)} aria-label="이중확인자" />
                      </div>
                    )}
                    <div className="ns-nfa">
                      <button type="button" onClick={() => setHold('')}>보류·미투약</button>
                      <button type="button" onClick={() => setChk(null)}>취소</button>
                      <button type="button" className="ns-go" disabled={!ok} onClick={() => { perform(chk); setChk(null); }}>투약 완료</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ns-nstep"><b>보류·미투약 사유</b><span>{r.name}</span></div>
                    <select className="ns-ndq" value={hold} onChange={e => setHold(e.target.value)} aria-label="사유">
                      {['', ...REASONS].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input className="ns-ndq" value={holdNote} onChange={e => setHoldNote(e.target.value)} aria-label="추가 내용" />
                    <div className="ns-nfa">
                      <button type="button" onClick={() => setHold(null)}>돌아가기</button>
                      <button type="button" className="ns-go" disabled={!hold} onClick={() => { holdDose(chk, hold, holdNote); setChk(null); }}>보류 기록</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {[win, win2 && win && win2 !== win ? win2 : null].map((w, wi) => w && (
        <div key={wi} className={`ns-nwin ${win2 && win ? (wi ? 'ns-sp-b' : 'ns-sp-a') : maxed ? 'ns-max' : ''}`} role="dialog" aria-label={w} style={pos && !(win2 && win) ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', margin: 0 } : undefined}>
          <header
            onPointerDown={e => {
              if ((e.target as HTMLElement).closest('button')) return;
              const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              const dx = e.clientX - box.left;
              const dy = e.clientY - box.top;
              const move = (ev: PointerEvent) => setPos({ x: Math.max(0, ev.clientX - dx), y: Math.max(0, ev.clientY - dy) });
              const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
          >
            <b>{w === 'staff' ? '의료진 · Notify' : MENUS.find(m => m.id === w)?.label}</b>
            <span className="ns-wbtn">
              <button type="button" aria-label="최소화" title="최소화 (아래 탭으로)" onClick={() => (w === win ? onClose() : setWin2(null))}>&minus;</button>
              <button type="button" aria-label="최대화" title={maxed ? '이전 크기' : '최대화'} onClick={() => { setMaxed(m => !m); setPos(null); }}>{maxed ? '❐' : '□'}</button>
              <button type="button" aria-label="닫기" title="닫기" onClick={() => closeTab(w)}>&times;</button>
            </span>
          </header>
          <div className="ns-nwb">
            {w === 'todo' ? (
              <>
                <div className="ns-nhd">
                  <button type="button" className={`ns-arw ${scope === 'me' ? 'ns-sel' : ''}`} onClick={() => setScope('me')}>이 환자</button>
                  <button type="button" className={`ns-arw ${scope === 'ward' ? 'ns-sel' : ''}`} onClick={() => setScope('ward')}>{ward} {team} 전체</button>
                </div>
                {scope === 'me' ? (
                  <table className="ns-nlist ns-todo">
                    <thead><tr><th>시간</th><th>구분</th><th>내용</th><th>상태</th><th /></tr></thead>
                    <tbody>
                      {todo.map((t, k) => (
                        <tr key={k} className={t.state === '지연' ? 'ns-late' : t.state === '완료' ? 'ns-fin' : ''}>
                          <td>{t.time}</td><td>{t.label}</td>
                          <td><b>{t.name}</b>{t.detail && <span> {t.detail}</span>}</td>
                          <td>{isToday ? t.state : ''}</td>
                          <td>{isToday && t.state !== '완료' && t.first && t.label !== '검사' && <button type="button" className="ns-go" onClick={() => ask(t.it)}>수행</button>}</td>
                        </tr>
                      ))}
                      {todo.length === 0 && <tr><td colSpan={5} className="ns-nnone">No data to display</td></tr>}
                    </tbody>
                  </table>
                ) : (
                  <table className="ns-nlist ns-todo">
                    <thead><tr><th>시간</th><th>병상</th><th>환자</th><th>구분</th><th>내용</th><th>상태</th><th /></tr></thead>
                    <tbody>
                      {wardTodo.map((t, k) => (
                        <tr key={k} className={t.state === '지연' ? 'ns-late' : ''}>
                          <td>{t.time}</td><td>{t.p.bed}</td><td>{t.p.name}</td><td>{t.label}</td>
                          <td><b>{t.name}</b>{t.detail && <span> {t.detail}</span>}</td>
                          <td>{isToday ? t.state : ''}</td>
                          <td>{t.p.id && t.p.name !== i.name && <button type="button" className="ns-go" onClick={() => router.push(`/ehr/${t.p.id}`)}>열기</button>}</td>
                        </tr>
                      ))}
                      {wardTodo.length === 0 && <tr><td colSpan={7} className="ns-nnone">No data to display</td></tr>}
                    </tbody>
                  </table>
                )}
              </>
            ) : w === 'qr' ? (
              <QrView data={data} caseId={caseId} />
            ) : w === 'notes' ? (
              <NursingRecord data={data} setData={setData} userName={userName} duty={duty} today={date} />
            ) : w === 'patinfo' ? (
              <PatInfo data={data} />
            ) : w === 'dxhist' ? (
              <DxReg data={data} setData={setData} userName={userName} onClose={onClose} />
            ) : w === 'surghist' ? (
              <SurgHist data={data} />
            ) : w === 'vacc' ? (
              <VaccHist data={data} />
            ) : w === 'labres' ? (
              <LabResults data={data} setData={setData} userName={userName} />
            ) : w === 'medrec' ? (
              (() => {
                const rows: [string, Item][] = [
                  ...(mf === 'all' || mf === 'base' ? g.base.map(x => ['기본', x] as [string, Item]) : []),
                  ...(mf === 'all' || mf === 'med' ? [...g.med.map(x => ['투약', x] as [string, Item]), ...g.prn.map(x => ['PRN', x] as [string, Item])] : []),
                  ...(mf === 'all' || mf === 'lab' ? g.lab.map(x => ['검사', x] as [string, Item]) : []),
                ];
                const kindOf = (r: Row) => (/주사|IV|IM|SC|inj/i.test(`${r.route || ''}${r.name || ''}`) ? '주사약' : /PO|경구/i.test(r.route || '') ? '먹는약' : '');
                const tail = `출력일시 ${date} ${hm()} · 출력자 ${userName}`;
                return (
                  <div className="ns-mr">
                    <div className="ns-fl-b">
                      {([['all', '전체'], ['base', '기본'], ['med', '투약'], ['lab', '검사']] as const).map(([k, l]) => <button key={k} type="button" className={mf === k ? 'ns-on' : ''} onClick={() => setMf(k)}>{l}</button>)}
                      <span style={{ marginLeft: 'auto', fontSize: 13 }}>처방일자 {date}</span>
                    </div>
                    <h4 style={{ textAlign: 'center', margin: '10px 0' }}>투약기록</h4>
                    <table className="ns-rt">
                      <thead><tr>{['병실', '환자번호', '환자명', '종류', '투약구분', '처방명', '용량', '용법'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {rows.map(([k, it], n) => <tr key={n}><td>{[i.ward, i.bed].filter(Boolean).join(' ')}</td><td>{i.ptNo}</td><td>{i.name}</td><td>{k}</td><td>{kindOf(it.r)}</td><td>{it.r.name}</td><td>{it.r.dose}{it.r.unit}</td><td>{[it.r.route, it.r.cnt || it.r.q].filter(Boolean).join(' ')}</td></tr>)}
                        {rows.length === 0 && <tr><td colSpan={8} className="ns-nnone">No data to display</td></tr>}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12.5 }}>
                      <span>{tail}</span>
                      <button type="button" className="ns-fl-pb" onClick={() => printDoc('투약기록', `${head()}<table><tr>${['종류', '투약구분', '처방명', '용량', '용법'].map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(([k, it]) => `<tr><td>${k}</td><td>${kindOf(it.r)}</td><td>${esc(it.r.name || '')}</td><td>${esc(`${it.r.dose || ''}${it.r.unit || ''}`)}</td><td>${esc([it.r.route, it.r.cnt || it.r.q].filter(Boolean).join(' '))}</td></tr>`).join('')}</table><p>${esc(tail)}</p>`)}>인쇄</button>
                    </div>
                  </div>
                );
              })()
            ) : w === 'flowsheet' ? (
              <div className="ns-fl" onClick={() => setFCtx(null)}>
                <div className="ns-fl-t" ref={flowRef} hidden={fTab === 'io' || fTab === 'lab'}
                  onMouseDown={e => { if ((e.target as HTMLElement).closest('input,button')) return; drag.current = { x: e.clientX, l: e.currentTarget.scrollLeft }; }}
                  onMouseMove={e => { if (drag.current && e.buttons === 1) e.currentTarget.scrollLeft = drag.current.l - (e.clientX - drag.current.x); }}
                  onMouseUp={() => { drag.current = null; }} onMouseLeave={() => { drag.current = null; }}>
                  <table>
                    <thead>
                      <tr><th rowSpan={2} colSpan={2} className="ns-fl-c"><div className="ns-fl-s">{([['all', '24시간'], ['D', 'Day'], ['E', 'Evening'], ['N', 'Night']] as const).map(([k, l]) => <button key={k} type="button" className={fShift === k ? 'ns-on' : ''} onClick={() => setFShift(k)}>{l}</button>)}<button type="button" className={fCfg ? 'ns-on' : ''} onClick={e => { e.stopPropagation(); setFCfg(v => !v); }}>항목 설정</button></div></th>{FDAYS.map(d => <th key={d} colSpan={FR.filter(c => c.d === d).length} className={d === todayS ? 'ns-fl-today' : 'ns-fl-day'}>{d.slice(5).replace('-', '/')} ({'일월화수목금토'[new Date(`${d}T00:00:00`).getDay()]}){d === todayS ? ' · 오늘' : ''}{hdOf(d) > 0 && <span className="ns-hd">HD#{hdOf(d)}</span>}</th>)}</tr>
                      <tr>{FR.map(c => c.sum ? <th key={c.d + c.h + 's'} className="ns-fl-sum">{{ D: 'Day', E: 'Eve', N: 'Night' }[c.sum]}<br />합계</th> : <th key={c.d + c.h}>{c.h}시</th>)}</tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const cellOf = (it: string, c0: FRc, isIO: boolean) => {
                          const { d, h, sum } = c0;
                          const key = d + h + (sum || '');
                          if (sum) {
                            let v = '';
                            if (it === 'I/O Total (mL)') v = [...IN, ...OUT].some(x => sumAny(x, d, sum)) ? String(IN.reduce((a, x) => a + sumItem(x, d, sum), 0) - OUT.reduce((a, x) => a + sumItem(x, d, sum), 0)) : '';
                            else if (IN.includes(it) || OUT.includes(it)) v = sumAny(it, d, sum) ? String(sumItem(it, d, sum)) : '';
                            return <td key={key} className={isIO ? 'ns-fl-sumc' : 'ns-fl-sumg'} style={{ cursor: 'default' }}>{v}</td>;
                          }
                          const c = fGet(it, d, h);
                          const on = fEdit?.it === it && fEdit.h === h && fEdit.d === d;
                          if (it === 'I/O Total (mL)') {
                            const anyIO = [...IN, ...OUT].some(x => fGet(x, d, h));
                            return <td key={key} style={{ cursor: 'default', background: '#f6f8fb', fontWeight: 700 }}>{anyIO ? ioTotal(d, h) : ''}</td>;
                          }
                          const auto = !c ? vitAt(it, d, h) : '';
                          return (
                            <td key={key} className={`${c ? 'ns-fl-v' : auto ? 'ns-fl-a' : ''} ${!c && auto && vitRow(d, h)?.auth === '미인증' ? 'ns-fl-un' : ''}`} title={!c && auto && vitRow(d, h)?.auth === '미인증' ? '미인증 기록 (PDA) — 우클릭 → 인증저장' : undefined} onDoubleClick={() => { setFEdit({ it, d, h }); setFVal(c?.text || auto); }} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setFCtx({ x: e.clientX, y: e.clientY, it, d, h }); }}>
                              {on ? <input autoFocus value={fVal} onChange={e => setFVal(e.target.value)} onBlur={() => { fSet(it, d, h, fVal); setFEdit(null); }} onKeyDown={e => { if (e.key === 'Enter') { fSet(it, d, h, fVal); setFEdit(null); } if (e.key === 'Escape') setFEdit(null); }} /> : <>{c?.text || auto}{c?.memo && <sup title={c.memo}>●</sup>}</>}
                            </td>
                          );
                        };
                        if (fTab === 'state') {
                          return NFG.map(cat => {
                            const closed = fColl.includes(cat.g);
                            const hiddenHere = cat.subs.flatMap(x => x.items).filter(x => hid.includes(x));
                            return (
                              <Fragment key={cat.g}>
                                <tr className="ns-fl-g">
                                  <td colSpan={FR.length + 2}>
                                    <span className="ns-fl-gl">
                                      <button type="button" className="ns-fl-tg" onClick={() => setFColl(c => (c.includes(cat.g) ? c.filter(x => x !== cat.g) : [...c, cat.g]))}>{closed ? '⊕' : '⊖'} {cat.g}</button>
                                      <button type="button" className="ns-fl-bb" onClick={() => setFHidOpen(fHidOpen === cat.g ? null : cat.g)}>숨김항목{hiddenHere.length ? ` (${hiddenHere.length})` : ''}</button>
                                      <button type="button" className="ns-fl-bb" onClick={() => setFGuide(fGuide === cat.g ? null : cat.g)}>기록지침</button>
                                    </span>
                                    {fHidOpen === cat.g && <span className="ns-fl-pop">{hiddenHere.length ? hiddenHere.map(x => <button key={x} type="button" onClick={() => setHid(hid.filter(y => y !== x))}>↩ {x}</button>) : '숨긴 항목이 없습니다. 항목을 우클릭해 "항목숨기기"를 고르세요.'}</span>}
                                    {fGuide === cat.g && <span className="ns-fl-pop">{cat.guide}</span>}
                                  </td>
                                </tr>
                                {!closed && cat.subs.map(sb => {
                                  const its = sb.items.filter(x => !hid.includes(x));
                                  return its.map((it, ix) => (
                                    <tr key={it}>
                                      {ix === 0 && <th className="ns-fl-g1 ns-fl-sub" rowSpan={its.length}>{sb.s}</th>}
                                      <th className="ns-fl-c ns-fl-c2">{it}</th>
                                      {FR.map(c0 => cellOf(it, c0, false))}
                                    </tr>
                                  ));
                                })}
                              </Fragment>
                            );
                          });
                        }
                        return FG.map(g => {
                          const closed = fColl.includes(g.g);
                          const isIO = g.g === 'I/O Total' || g.items.some(x => IN.includes(x) || OUT.includes(x));
                          const tog = <button type="button" className="ns-fl-tg" onClick={() => setFColl(c => (c.includes(g.g) ? c.filter(x => x !== g.g) : [...c, g.g]))}>{closed ? '⊕' : '⊖'} {g.g}</button>;
                          if (closed) {
                            return (
                              <tr key={g.g}>
                                <th className="ns-fl-g1">{tog}</th>
                                <th className="ns-fl-c ns-fl-c2">{g.items.length}개 항목 (접힘)</th>
                                <td colSpan={FR.length} style={{ cursor: 'default' }} />
                              </tr>
                            );
                          }
                          return (
                            <Fragment key={g.g}>
                              {g.items.map((it, ix) => (
                                <tr key={it}>
                                  {ix === 0 && <th className="ns-fl-g1" rowSpan={g.items.length}>{tog}</th>}
                                  <th className="ns-fl-c ns-fl-c2">{it}</th>
                                  {FR.map(c0 => cellOf(it, c0, isIO))}
                                </tr>
                              ))}
                            </Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                {fCfg && (
                  <div className="ns-fl-cfg" style={{ left: 12, top: 56 }} onClick={e => e.stopPropagation()}>
                    <b>이 환자의 Flowsheet 항목</b>
                    {CATALOG.map(c => (
                      <div key={c.g}>
                        <h5>{c.g}{c.fixed ? ' (필수)' : ''}</h5>
                        {c.items.map(it => <label key={it}><input type="checkbox" checked={itemOn(it)} disabled={c.fixed} onChange={() => setCfg(cfgOn.includes(it) ? cfgOn.filter(x => x !== it) : [...cfgOn, it])} />{it}</label>)}
                      </div>
                    ))}
                    <p style={{ margin: '8px 0 0', color: 'var(--sub-text)' }}>활력징후는 항상 표시돼요. 환자 상태(욕창 위험 등)에 맞게 항목을 넣고 빼세요.</p>
                    <button type="button" style={{ marginTop: 6 }} onClick={() => setFCfg(false)}>닫기</button>
                  </div>
                )}
                <p className="ns-fl-h" hidden={fTab === 'io' || fTab === 'lab'}>표를 꾹 누른 채 좌우로 끌면 다른 시간대·날짜로 이동 · 칸 더블클릭=입력, 우클릭=메뉴(메모 / 간호기록 / 그룹입력) · 파란 글씨는 임상관찰 연동값</p>
                {fCtx && (
                  <div className="ns-fl-m" style={{ left: fCtx.x, top: fCtx.y }} onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => { const c = fGet(fCtx.it, fCtx.d, fCtx.h); if (!c) { setFCtx(null); return; } const m = window.prompt('메모', c.memo || ''); if (m !== null) setData(d => ({ ...d, memos: d.memos.map(x => (x === c ? { ...x, memo: m } : x)) })); setFCtx(null); }}>메모</button>
                    <button type="button" onClick={() => { const c = fGet(fCtx.it, fCtx.d, fCtx.h); if (c) setData(d => ({ ...d, notes: [...d.notes, { time: `${fCtx.d} ${fCtx.h}:00`, focus: fCtx.it.split(' (')[0], text: `D)\n${fCtx.h}시 ${fCtx.it} ${c.text}${c.memo ? ` (${c.memo})` : ''}`, author: userName, shift: duty }] })); setFCtx(null); }}>간호기록</button>
                    {vitRow(fCtx.d, fCtx.h)?.auth === '미인증' && <button type="button" onClick={() => { const vr = vitRow(fCtx.d, fCtx.h); setData(dd => ({ ...dd, vitals: dd.vitals.map(x => (x === vr ? { ...x, auth: '' } : x)) })); setFCtx(null); }}>인증저장 (PDA 입력값)</button>}
                    <button type="button" onClick={() => { fSet(fCtx.it, fCtx.d, fCtx.h, ''); setFCtx(null); }}>입력값 삭제</button>
                    <button type="button" onClick={() => { setFHist(fCtx.it); setFCtx(null); }}>이력조회</button>
                    {NFG.some(c => c.subs.some(x => x.items.includes(fCtx.it))) && <button type="button" onClick={() => { setHid([...hid, fCtx.it]); setFCtx(null); }}>항목숨기기</button>}
                    <button type="button" onClick={() => { const c = fGet(fCtx.it, fCtx.d, fCtx.h); if (c) { const i0 = FCOLS.findIndex(x => x.d === fCtx.d && x.h === fCtx.h); FCOLS.slice(i0 + 1, i0 + 4).forEach(x => { if (!fGet(fCtx.it, x.d, x.h)) fSet(fCtx.it, x.d, x.h, c.text); }); } setFCtx(null); }}>그룹입력 (이후 3칸 동일값)</button>
                  </div>
                )}
                {fHist && (
                  <div className="ns-fl-cfg" style={{ left: 40, top: 80 }} onClick={e => e.stopPropagation()}>
                    <b>이력조회 · {fHist}</b>
                    {(() => {
                      const rows = data.memos.filter(m => m.type === 'flow' && m.item === fHist).sort((a, b) => `${b.date} ${b.hour}`.localeCompare(`${a.date} ${a.hour}`)).slice(0, 14);
                      return rows.length ? <table style={{ minWidth: 0, marginTop: 6 }}><tbody>{rows.map((r, k) => <tr key={k}><td>{(r.date || '').slice(5)} {r.hour}시</td><td>{r.text}</td><td>{r.author}</td></tr>)}</tbody></table> : <p>No data to display</p>;
                    })()}
                    <button type="button" style={{ marginTop: 6 }} onClick={() => setFHist(null)}>닫기</button>
                  </div>
                )}
                <div className="ns-fl-b">
                  {([['obs', '임상관찰'], ['io', 'I/O'], ['state', '간호사정'], ['lab', 'LAB']] as const).map(([k, l]) => <button key={k} type="button" className={fTab === k ? 'ns-on' : ''} onClick={() => setFTab(k)}>{l}</button>)}
                </div>
                {fTab === 'io' && <div className="ns-fl-x">{(() => {
                  const num = (t?: string) => (t || '').match(/\d+(?:\.\d+)?/g)?.reduce((a, x) => a + Number(x), 0) || 0;
                  const days = FDAYS.slice(-7);
                  const rows = days.flatMap(d => (['D', 'E', 'N'] as const).map(sh => {
                    const rec = data.io.filter(r => (r.time || '').slice(0, 10) === d && (r.time || '').trim().slice(-1) === sh);
                    const i1 = rec.reduce((a, r) => a + num(r.intake), 0) + IN.reduce((a, x) => a + sumItem(x, d, sh), 0);
                    const o1 = rec.reduce((a, r) => a + num(r.output), 0) + OUT.reduce((a, x) => a + sumItem(x, d, sh), 0);
                    return { d, sh, i1, o1, has: rec.length > 0 || sumAny('IV (mL)', d, sh) };
                  }));
                  return <table style={{ minWidth: 0, width: '100%' }}><thead><tr><th>일자</th><th>근무</th><th>Intake (mL)</th><th>Output (mL)</th><th>I/O Total (mL)</th></tr></thead><tbody>{rows.map(r => <tr key={r.d + r.sh}><td>{r.d.slice(5)}</td><td>{r.sh}</td><td>{r.has ? r.i1 : ''}</td><td>{r.has ? r.o1 : ''}</td><td style={{ background: '#fff7c2', fontWeight: 700 }}>{r.has ? r.i1 - r.o1 : ''}</td></tr>)}</tbody></table>;
                })()}</div>}
                <div className="ns-fl-sc">{([['vitals', '환자 V/S'], ['bst', '혈당'], ['labres', '검사결과'], ['notes', '간호기록']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => openMenu(k)}>{l}</button>)}<button type="button" onClick={() => setFCfg(v => !v)}>항목 설정</button></div>
                {fTab === 'lab' && <div className="ns-fl-x">{data.labs.length ? data.labs.slice(0, 12).map((l, k) => <p key={k}>{l.name} {l.value} {l.unit}</p>) : <p className="ns-nnone">No data to display</p>}</div>}
              </div>
            ) : w === 'overview' ? (
              (() => {
                const dots = bodyDots(data);
                return (
                  <div className="ns-ovw">
                  <div className="ns-ov">
                    <BodyFig dots={dots} width={300} />
                    <div>
                      <div className="ns-nflags">{flags.length ? flags.map(f => <em key={f}>{f}</em>) : <em>No flags</em>}</div>
                      <h4>간호진단 · {data.care.length}문제</h4>
                      {data.care.map((c, k) => <p key={k}>{c.dx}</p>)}
                      <h4>삽입물·라인</h4>
                      {data.lines.filter(l => l.st !== '제거').map((l, k) => <p key={k}>{l.kind} {l.site} {l.ins && `(${l.ins})`}</p>)}
                      {data.lines.filter(l => l.st !== '제거').length === 0 && <p className="ns-nnone">No data to display</p>}
                      <h4>상처·욕창</h4>
                      {data.wounds.map((w, k) => <p key={k}>{w.kind} {w.site}</p>)}
                      {data.wounds.length === 0 && <p className="ns-nnone">No data to display</p>}
                    </div>
                  </div>
                  <div className="ns-ovd">
                    <h4>간호진단 / 문제</h4>
                    {data.care.length === 0 ? <p className="ns-nnone">No data to display</p> : <ul>{data.care.map((c, k) => <li key={k}>{c.dx}</li>)}</ul>}
                    <h4>처방 메모</h4>
                    {(() => { const ms = ordNotes; return ms.length ? <ul>{ms.map((o, k) => <li key={k}>{o}</li>)}</ul> : <p className="ns-nnone">No data to display</p>; })()}
                    <h4>7일 내 미실시 검사</h4>
                    <table className="ns-rt">
                      <thead><tr><th>검사명</th><th>채혈일</th><th>예약일시</th></tr></thead>
                      <tbody>
                        {g.lab.filter(it => it.r.st !== '완료' && it.r.st !== '집계완료' && it.r.pri !== 'D/C').map((it, k) => <tr key={`l${k}`}><td>{it.r.name}</td><td>{date}</td><td>{it.r.t1 || ''}</td></tr>)}
                        {data.appts.filter(a2 => a2.st !== '취소' && a2.st !== '진료완료').map((a2, k) => <tr key={`a${k}`}><td>{a2.purpose || a2.dept}</td><td /><td>{a2.date} {a2.time}</td></tr>)}
                        {g.lab.filter(it => it.r.st !== '완료' && it.r.st !== '집계완료').length === 0 && data.appts.length === 0 && <tr><td colSpan={3} className="ns-nnone">No data to display</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  </div>
                );
              })()
            ) : w === 'adm' ? (
              <>
                <div className="ns-nhd">
                  <button type="button" className="ns-arw" onClick={() => shiftA(-1)} aria-label="전날">&lt;</button>
                  <input type="date" value={adate} onChange={e => setAdate(e.target.value)} aria-label="조회일" />
                  <button type="button" className="ns-arw" onClick={() => shiftA(1)} aria-label="다음날">&gt;</button>
                </div>
                <label className="ns-admw">병동
                  <select value={admW} onChange={e => setAdmW(e.target.value)}>
                    <option value="">전체</option>
                    {Array.from(new Set(admRows(true).concat(admRows(false)).map(r => r.ward).filter((w): w is string => !!w))).sort().map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </label>
                {([['입원', admRows(true).filter(r => !admW || r.ward === admW)], ['퇴원예정', admRows(false).filter(r => !admW || r.ward === admW)]] as const).map(([t, rows]) => (
                  <div key={t}>
                    <h4>{t} ({rows.length})</h4>
                    <table className="ns-nlist">
                      <thead><tr><th>병동</th><th>병상</th><th>환자명</th><th>환자번호</th><th>주치의</th></tr></thead>
                      <tbody>
                        {rows.slice().sort((a, b) => `${a.ward || ''}${a.bed || ''}`.localeCompare(`${b.ward || ''}${b.bed || ''}`, 'ko', { numeric: true })).map(r => <tr key={r.ptNo + t} style={{ cursor: r.id ? 'pointer' : 'default' }} onClick={() => r.id && router.push(`/ehr/${r.id}`)}><td>{r.ward}</td><td>{r.bed}</td><td>{r.name}</td><td>{r.ptNo}</td><td>{r.doctor}</td></tr>)}
                        {rows.length === 0 && <tr><td colSpan={5} className="ns-nnone">No data to display</td></tr>}
                      </tbody>
                    </table>
                  </div>
                ))}
                <BedTransfer data={data} setData={setData} roster={roster} caseId={caseId} userName={userName} />
              </>
            ) : w === 'dir' ? (
              <div className="ns-org">
                <aside>
                  <input value={dq} onChange={e => setDq(e.target.value)} placeholder="이름·부서·내선 검색" aria-label="부서 검색" />
                  {!dq.trim() && ORG.map(g => (
                    <div key={g.name}>
                      <h5>{g.name}</h5>
                      {g.units.map(u => <button key={u.name} type="button" className={orgSel === u.name ? 'ns-on' : ''} onClick={() => setOrgSel(u.name)}>{u.name}<i>{u.ext}</i></button>)}
                    </div>
                  ))}
                </aside>
                <section>
                  {dq.trim() ? (
                    <table className="ns-nlist">
                      <thead><tr><th>부서</th><th>직급</th><th>이름</th><th>내선</th></tr></thead>
                      <tbody>
                        {ORG.flatMap(g => g.units.flatMap(u => [{ u, p: { rank: '대표', name: u.name, ext: u.ext } as { rank: string; name: string; ext: string; role?: string } }, ...u.people.map(p => ({ u, p }))])).filter(({ u, p }) => `${u.name}${p.name}${p.ext}${u.ext}${p.rank}`.includes(dq.trim())).slice(0, 60).map(({ u, p }, k) => <tr key={k}><td>{u.name}</td><td>{p.rank}</td><td>{p.name}</td><td>{p.ext}</td></tr>)}
                      </tbody>
                    </table>
                  ) : (() => {
                    const u = ORG.flatMap(g => g.units).find(x => x.name === orgSel) || ORG[0].units[0];
                    const g = ORG.find(x => x.units.includes(u));
                    return (
                      <>
                        <p className="ns-org-p">{g?.name} › <b>{u.name}</b> · 대표 {u.ext} · {u.loc}</p>
                        <table className="ns-nlist">
                          <thead><tr><th>직급</th><th>이름</th><th>내선</th><th>비고</th></tr></thead>
                          <tbody>{u.people.map((p, k) => <tr key={k}><td>{p.rank}</td><td>{p.name}</td><td>{p.ext}</td><td>{p.role || ''}</td></tr>)}</tbody>
                        </table>
                      </>
                    );
                  })()}
                </section>
              </div>
            ) : w === 'bulk' ? (
              <WardBulk pts={bulkPts} onClose={onClose} onSelf={row => setData(d => ({ ...d, vitals: [...d.vitals, row] }))} />
            ) : w === 'staff' ? (
              <Fragment key={notifyDraft}><StaffWin data={data} setData={setData} userName={userName} duty={duty} draft={notifyDraft} /></Fragment>
            ) : w === 'docreq' ? (
              <DocReqWin data={data} setData={setData} userName={userName} duty={duty} />
            ) : w === 'unauth' ? (
              <div className="rw-un">
                <p className="ns-fl-h">기록종류: 병동 처방액팅(모바일) · PDA로 액팅한 투약 서명은 미인증 상태로 남아요. 확인 후 인증하세요.</p>
                <table className="ns-nlist">
                  <thead><tr><th>일시</th><th>기록종류</th><th>처방명</th><th>용량</th><th>수행자</th><th /></tr></thead>
                  <tbody>
                    {unauthOrders.map(({ i: oi, k, o }) => <tr key={`${oi}${k}`}><td>{todayStr} {(o[k] || '').slice(0, 5)}</td><td>병동 처방액팅(모바일)</td><td>{o.name}</td><td>{o.dose}{o.unit}</td><td>{(o[k] || '').split('/')[1] || ''}</td><td><button type="button" onClick={() => certify(oi, k)}>인증</button></td></tr>)}
                    {unauthMar.map((m, k) => <tr key={`m${k}`}><td>{m.time}</td><td>병동 처방액팅(모바일)</td><td>{m.name}</td><td>{m.dose}</td><td>{m.by}</td><td><button type="button" onClick={() => certifyMar(m)}>인증</button></td></tr>)}
                    {unauthOrders.length + unauthMar.length === 0 && <tr><td colSpan={6} className="ns-nnone">No data to display</td></tr>}
                  </tbody>
                </table>
                {unauthOrders.length + unauthMar.length > 0 && <button type="button" className="ns-fl-pb" style={{ marginTop: 8 }} onClick={() => { unauthOrders.forEach(u => certify(u.i, u.k)); unauthMar.forEach(certifyMar); }}>전체 인증</button>}
              </div>
            ) : w === 'usage' ? (
              <UsageWin onClose={onClose} />
            ) : w === 'rxcmp' ? (
              <RxCompare data={data} onClose={onClose} />
            ) : w === 'futsch' ? (
              <FutureSched data={data} onClose={onClose} />
            ) : w === 'sticker' ? (
              <Sticker data={data} onClose={onClose} />
            ) : w === 'cmnreq' ? (
              <CommonReq data={data} setData={setData} userName={userName} onMat={() => openMenu('mat')} onClose={onClose} />
            ) : w === 'dcplan' ? (
              <DcPlan data={data} setData={setData} userName={userName} onClose={onClose} />
            ) : w === 'mat' ? (
              <ProcInput data={data} setData={setData} userName={userName} onClose={onClose} />
            ) : (w === 'vitals' || w === 'bst' || w === 'nact') ? (
              <NurseForm kind={w} data={data} setData={setData} userName={userName} />
            ) : drawer}
          </div>
          <footer className="ns-wst"><span>{SCR[w] || 'MNR000F1'}</span><span className="ok">★ 정상적으로 실행되었습니다.</span><span className="ns-wst-t">{(() => { const t = vnow(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`; })()}</span></footer>
        </div>
      ))}

      <style>{`
        .ns-nstep { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
        .ns-nstep span { color: var(--sub-text); font-size: 12px; }
        .ns-nlist.ns-todo { table-layout: auto; }
        .ns-nlist.ns-todo td, .ns-nlist.ns-todo th { text-align: center; white-space: nowrap; }
        .ns-nlist.ns-todo td:nth-child(3), .ns-nlist.ns-todo th:nth-child(3) { text-align: left; white-space: normal; width: 55%; }
        .ns-todo tr.ns-late td { background: rgba(239,68,68,.12); }
        .ns-todo tr.ns-fin td { color: var(--sub-text); }
        .ns-todo tbody tr { cursor: default; }
        .ns-hold { background: rgba(245,158,11,.18); color: #b9770e; }
        .ns-arw.ns-sel { background: var(--primary); color: #fff; }
        .ns-nav { margin-left: auto; display: flex; gap: 8px; align-items: center; padding: 4px 0; flex: none; }
        .ns-nav .back { border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; border-radius: 4px; padding: 5px 10px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .ns-nmenu .ns-tools { margin-left: auto; display: flex; align-items: center; gap: 8px; padding: 4px 0; }
        .ns-tools .back { border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; border-radius: 4px; padding: 5px 10px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ns-tools .st { color: #cbd5e1; font-size: 12px; }
        .ns-tools .subm { border-radius: 4px; padding: 5px 12px; }
        .ns-tools .mbtn { color: #fff; }
        .ns-nu { border: 1px solid #94a3b8; background: var(--background, #fff); color: var(--text); border-radius: 6px; overflow: clip; font-size: 13px; position: relative; }
        .ns-nmenu { display: flex; flex-wrap: nowrap; overflow-x: auto; align-items: center; gap: 2px; padding: 0 8px; background: linear-gradient(#233a5c, #17283f); }
        .ns-nmenu b { color: #e8c97a; padding: 0 12px 0 6px; }
        .ns-nmenu button { border: 0; background: transparent; color: #e5ebf3; padding: 11px 12px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-mq { width: 110px; flex: none; padding: 3px 6px; font-size: 12.5px; margin-left: 4px; }
        .ns-nmenu button:disabled { opacity: .45; cursor: default; }
        .ns-nmenu button.ns-on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .ns-nsub { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 10px; background: #eaf0f7; border-bottom: 1px solid var(--border); }
        .ns-nsub button { border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 5px 12px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ns-ntabs { display: flex; align-items: flex-end; gap: 2px; padding: 4px 8px 0; background: #dfe6ee; border-bottom: 1px solid var(--border); position: relative; z-index: 41; height: 34px; box-sizing: border-box; margin-left: 240px; margin-bottom: -34px; overflow-x: auto; }
        .ns-ntabs-e { align-self: center; font-style: normal; font-size: 12px; color: var(--sub-text); }
        .ns-ngrid > *:not(.ns-nl) { padding-top: 34px; box-sizing: border-box; }
        .ns-ntabs span { display: inline-flex; align-items: center; background: #f6f8fb; border: 1px solid var(--border); border-bottom: 0; border-radius: 6px 6px 0 0; }
        .ns-ntabs span.ns-on { background: #fff; font-weight: 700; }
        .ns-ntabs span:not(.ns-on) { opacity: .75; }
        .ns-ddbk { position: fixed; inset: 0; z-index: 40; border: 0; background: transparent; cursor: default; }
        .ns-dd { position: fixed; z-index: 41; min-width: 170px; max-height: 70vh; overflow-y: auto; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 4px; }
        .ns-dd button { border: 0; background: transparent; text-align: left; font: inherit; font-size: 13.5px; font-weight: 600; padding: 8px 12px; border-radius: 6px; cursor: pointer; color: var(--text); }
        .ns-dd button:hover:not(:disabled) { background: #eaf0f7; }
        .ns-dd button:disabled { opacity: .4; cursor: default; }
        .ns-ntabs button { border: 0; background: none; font: inherit; font-size: 12.5px; padding: 5px 8px; cursor: pointer; color: inherit; }
        .ns-nmenu .ns-ch { margin-left: auto; color: #e8c97a; }
        .ns-ngrid { display: grid; grid-template-columns: 240px auto minmax(0, 1fr) 240px; min-height: 70vh; }
        .ns-nf { border-right: 1px solid var(--border); padding: 10px; width: 226px; box-sizing: border-box; }
        .ns-nf.ns-nfc { width: 40px; padding: 10px 4px; }
        .ns-fighd { display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-bottom: 6px; font-size: 13px; color: var(--primary); }
        .ns-fighd span { display: inline-flex; gap: 4px; }
        .ns-nfc .ns-fighd { justify-content: center; }
        .ns-nfs { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .ns-nfsec { border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 4px; background: #fff; padding: 7px 9px 8px; font-size: 12.5px; }
        .ns-nfsec.memo { border-left-color: #d97706; background: #fffcf5; }
        .ns-nfsec.lab { border-left-color: #64748b; }
        .ns-nfsec h4 { margin: 0 0 5px !important; font-size: 12px !important; font-weight: 800; color: var(--text) !important; display: flex; justify-content: space-between; align-items: center; }
        .ns-nfsec h4 b { font-size: 11px; background: #e8f0f9; color: var(--primary); border-radius: 999px; padding: 0 7px; }
        .ns-nfsec ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .ns-nfsec li { line-height: 1.45; display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; border-top: 1px solid #eef2f6; }
        .ns-nfsec li:first-child { border-top: 0; padding-top: 0; }
        .ns-nfsec li i { font-style: normal; color: var(--sub-text); font-size: 11.5px; white-space: nowrap; }
        .ns-nfsec li span { min-width: 0; }
        .ns-nl { border-right: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ns-nr { border-left: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ns-nc { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .ns-nsr { display: flex; gap: 4px; }
        .ns-nsr input { flex: 1; min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 7px 8px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nsr button, .ns-nd3 + * button { border: 1px solid var(--primary); background: var(--primary); color: #fff; border-radius: 6px; padding: 6px 10px; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .ns-nsr button:disabled { opacity: .4; }
        .ns-qs { position: relative; }
        .ns-qerr { position: absolute; left: 0; top: calc(100% + 2px); z-index: 7; background: #fff; border: 1px solid #fca5a5; border-radius: 4px; padding: 2px 8px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
        .ns-nerr { margin: 0; color: #dc2626; font-size: 12px; }
        .ns-npt { background: var(--muted-background); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 3px; }
        .ns-arw { padding: 4px 10px; border: 1px solid var(--border); background: var(--background); color: var(--primary); font-weight: 700; border-radius: 4px; }
        .ns-npt b { font-size: 20px; }
        .ns-npt span { color: var(--sub-text); }
        .ns-npt { display: block !important; padding: 0 !important; overflow: hidden; }
        .ns-nph { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; padding: 10px 12px; background: linear-gradient(#233a5c, #17283f); }
        .ns-nph b { font-size: 18px; color: #fff; }
        .ns-nph .ns-nsx { color: #cbd5e1; font-size: 12px; }
        .ns-nph .ns-nno { margin-left: auto; font-size: 12px; font-weight: 700; color: #e8c97a; border: 1px solid rgba(232,201,122,.5); border-radius: 4px; padding: 1px 7px; }
        .ns-nkv { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; padding: 10px 12px; font-size: 13px; }
        .ns-nkv dt { color: var(--sub-text); font-size: 12px; white-space: nowrap; }
        .ns-nkv dd { margin: 0; font-weight: 600; }
        .ns-nkv dd em { font-style: normal; margin-left: 6px; font-size: 11px; font-weight: 700; color: var(--primary); }
        .ns-lnk { border: 0; background: transparent; color: var(--primary); font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; padding: 0; text-align: left; }
        .ns-npt .ns-nflags { padding: 0 12px 10px; margin-top: 0; }
        .ns-mr { padding: 10px 12px; }
        .ns-fl-pb { font: inherit; font-size: 12.5px; font-weight: 700; padding: 4px 14px; border: 1px solid var(--border); border-radius: 4px; background: #fff; cursor: pointer; }
        .ns-subh td { background: #f3f6fa; font-weight: 700; font-size: 12.5px; color: var(--primary); }
        .ns-nhi { color: #b91c1c !important; }
        .ns-alone { color: #1d4ed8 !important; }
        .ns-fl { position: relative; padding: 10px 12px; position: relative; }
        .ns-nbox button, .ns-nmenu button, .ns-fl-b button, .ns-nwin button, .ns-ntabs button, .ns-ngrp button, .ns-nf button, .ns-dd button { white-space: nowrap; word-break: keep-all; }
        .ns-fl-b { display: flex; flex-wrap: wrap; gap: 4px; }
        .ns-fl-b button { flex: 0 0 auto; }
        .ns-rt th, .ns-nwin th { white-space: nowrap; }
        .ns-nbox h4, .ns-nf h4, .ns-nwin header { word-break: keep-all; }
        .ns-rt { min-width: 0 !important; width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
        .ns-rt th, .ns-rt td { border: 1px solid var(--border); padding: 3px 5px; text-align: left; }
        .ns-rt th { background: #f6f8fb; }
        .ns-fl-t { overflow: auto; cursor: grab; user-select: none; max-height: 70vh; }
        .ns-fl-t:active { cursor: grabbing; }
        .ns-fl .ns-fl-c { position: sticky; left: 0; z-index: 2; background: #f6f8fb; min-width: 150px; text-align: left; }
        .ns-fl thead th { position: sticky; top: 0; background: #eaf0f7; z-index: 1; }
        .ns-fl thead th.ns-fl-c { z-index: 3; }
        .ns-fl thead tr:nth-child(2) th { top: 29px; }
        .ns-fl-day { background: #dfe6ee !important; border-left: 2px solid #94a3b8 !important; }
        .ns-fl-today { background: var(--primary) !important; color: #fff; border-left: 2px solid #94a3b8 !important; }
        .ns-ngrp { display: block; border-top: 1px solid var(--border); padding: 9px 12px 10px; }
        .ns-ngrp > span { display: block; padding: 0 0 5px; font-size: 11.5px; font-weight: 800; color: var(--sub-text); letter-spacing: .02em; }
        .ns-ngrp .ns-nlinks { margin: 0; padding: 0; }
        .ns-nu .ns-gh { display: flex; align-items: center; gap: 6px; width: 100%; padding: 0; border: 0; background: transparent; font: inherit; font-size: 12px; font-weight: 800; color: var(--sub-text); cursor: pointer; text-align: left; }
        .ns-nu .ns-gh em { margin-left: auto; font-style: normal; font-size: 10px; }
        .ns-nu .ns-gh small { font-size: 10.5px; font-weight: 700; background: #e5ebf3; color: #475569; border-radius: 8px; padding: 0 6px; }
        .ns-nu .ns-ngrp { padding: 6px 12px 6px; }
        .ns-nu .ns-ngrp .ns-nlinks { gap: 3px; padding-top: 5px; }
        .ns-nu .ns-ngrp .ns-nlinks button { padding: 1px 7px; font-size: 11.5px; line-height: 1.5; }
        .ns-nu .ns-mbox { margin: 8px 0 0; padding: 7px 10px 8px; border: 1px solid var(--border); border-left-width: 4px; border-radius: 8px; background: #fff; }
        .ns-nu .ns-mdoc { border-left-color: #2563eb; }
        .ns-nu .ns-mdoc .ns-gh { color: #1d4ed8; }
        .ns-nu .ns-mnur { border-left-color: #0d9488; }
        .ns-nu .ns-mnur .ns-gh { color: #0f766e; }
        .ns-nu .ns-mbox p { margin: 6px 0 0; font-size: 12.5px; padding-bottom: 5px; border-bottom: 1px dashed var(--border); }
        .ns-nu .ns-mbox .ns-nsr { margin-top: 6px; }
        .ns-nu .ns-mbox .ns-nsr input { padding: 4px 8px; }
        .ns-nu .ns-mbox .ns-nsr button { padding: 3px 10px; }
        .ns-admw { display: inline-flex; align-items: center; gap: 6px; margin: 6px 0; font-size: 13px; font-weight: 700; }
        .ns-sepv { width: 1px; height: 18px; background: rgba(255,255,255,.3); margin: 0 6px; }
        .ns-nmenu .ns-wk { color: #e8c97a; }
        .ns-fig { display: block; }
        .ns-figb { border: 1px solid var(--border); background: #fff; border-radius: 4px; font: inherit; font-size: 11.5px; padding: 0 7px; cursor: pointer; }
        .ns-figl { display: flex; flex-direction: column; gap: 2px; font-size: 12px; align-self: stretch; }
        .ns-figl i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .ns-pn { border: 1px solid rgba(255,255,255,.4); background: transparent; color: #fff; border-radius: 4px; font-size: 11px; padding: 1px 6px; cursor: pointer; }
        .ns-pn:disabled { opacity: .3; cursor: default; }
        .ns-abn { margin: 0 12px 8px; padding: 6px 8px; border: 1px solid #ef4444; background: rgba(239,68,68,.08); border-radius: 6px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
        .ns-abn b { color: #dc2626; }
        .ns-abn button { align-self: flex-start; border: 1px solid #dc2626; background: #fff; color: #dc2626; border-radius: 4px; padding: 2px 10px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ns-tl h4 { margin: 4px 0 6px; font-size: 13px; }
        .ns-tli { display: flex; gap: 8px; padding: 6px 0; border-top: 1px solid var(--border); font-size: 12.5px; }
        .ns-tli > i { flex: none; width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; background: #3b82f6; }
        .ns-tli > i.k_입원 { background: #10b981; } .ns-tli > i.k_응급 { background: #ef4444; }
        .ns-tli em { font-style: normal; font-weight: 700; color: #3b82f6; } .ns-tli em.k_입원 { color: #10b981; } .ns-tli em.k_응급 { color: #ef4444; }
        .ns-tli span { color: var(--sub-text); font-size: 12px; }
        .ns-org { display: grid; grid-template-columns: 220px 1fr; gap: 12px; padding: 10px 12px; }
        .ns-org aside { max-height: 70vh; overflow: auto; border: 1px solid var(--border); border-radius: 6px; padding: 6px; }
        .ns-org aside input { width: 100%; margin-bottom: 6px; padding: 6px 8px; font-size: 13px; }
        .ns-org aside h5 { margin: 8px 0 2px; font-size: 12px; color: var(--primary); }
        .ns-org aside button { display: flex; justify-content: space-between; width: 100%; border: 0; background: none; padding: 5px 8px; border-radius: 4px; font: inherit; font-size: 13px; cursor: pointer; text-align: left; }
        .ns-org aside button i { font-style: normal; color: var(--sub-text); font-size: 12px; }
        .ns-org aside button.ns-on { background: var(--primary); color: #fff; }
        .ns-org aside button.ns-on i { color: #dbe7f5; }
        .ns-org-p { margin: 0 0 8px; font-size: 13px; }
        @media (max-width: 700px) { .ns-org { grid-template-columns: 1fr; } }
        .ns-fl-a { color: #2563eb; }
        .ns-fl table { min-width: 0; border-collapse: collapse; font-size: 12.5px; width: 100%; }
        .ns-fl th, .ns-fl td { border: 1px solid var(--border); padding: 4px 6px; text-align: center; height: 28px; white-space: nowrap; }
        .ns-fl tbody th { text-align: left; background: #f6f8fb; font-weight: 600; }
        .ns-fl td { min-width: 52px; cursor: cell; }
        .ns-fl td input { width: 48px; padding: 2px 4px; font-size: 12.5px; }
        .ns-fl-s { display: flex; gap: 3px; margin-top: 3px; }
        .ns-fl-s button { font: inherit; font-size: 11px; padding: 1px 6px; border: 1px solid var(--border); border-radius: 3px; background: #fff; cursor: pointer; }
        .ns-fl-s button.ns-on { background: var(--primary); color: #fff; border-color: var(--primary); }
        .ns-hd { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 8px; background: #fde68a; color: #7c4a03; font-size: 11px; font-weight: 800; }
        .ns-fl-sum { background: #fff2a8 !important; font-size: 11px; line-height: 1.2; }
        .ns-fl-sumc { background: #fff7c2; font-weight: 700; }
        .ns-fl-sumg { background: #f3f4f6; }
        .ns-fl-g1 { position: sticky; left: 0; z-index: 2; background: #c9d9ee !important; min-width: 96px; vertical-align: top; text-align: left !important; }
        .ns-fl-tg { border: 0; background: transparent; font: inherit; font-weight: 800; color: #17324f; cursor: pointer; padding: 0; }
        .ns-fl .ns-fl-c2 { left: 96px; }
        .ns-mc { color: #1d4ed8; font-weight: 700; }
        .ns-mcs { font: inherit; font-size: 11.5px; max-width: 86px; padding: 2px 2px; }
        .ns-fl-un { font-style: italic; text-decoration: underline dotted; }
        .ns-fl-bb { margin-left: 8px; border: 1px solid #5b6f8a; background: #fff; border-radius: 3px; font: inherit; font-size: 11.5px; padding: 1px 8px; cursor: pointer; }
        .ns-fl-pop { display: inline-block; margin-left: 12px; font-weight: 500; font-size: 12px; position: sticky; left: 260px; }
        .ns-fl-pop button { margin-right: 6px; border: 1px solid var(--border); background: #fff; border-radius: 3px; font: inherit; font-size: 11.5px; cursor: pointer; }
        .ns-fl-sub { font-weight: 600; font-size: 12px; white-space: normal !important; max-width: 110px; }
        .ns-fl-sc { display: flex; gap: 6px; margin-top: 8px; }
        .ns-fl-sc button { font: inherit; font-size: 12px; padding: 3px 10px; border: 1px solid var(--border); border-radius: 4px; background: #f6f8fb; cursor: pointer; }
        .ns-fl-x table { border-collapse: collapse; } .ns-fl-x th, .ns-fl-x td { border: 1px solid var(--border); padding: 3px 10px; }
        .ns-fl-v { background: #eef6ff; font-weight: 700; }
        .ns-fl-g td { background: #c9d9ee; color: #17324f; text-align: left; font-weight: 800; cursor: default; border-top: 2px solid #8fa9c9; padding: 0; }
        .ns-fl-gl { position: sticky; left: 0; display: inline-block; padding: 5px 10px; }
        .ns-fl-cfg { position: absolute; z-index: 6; background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 10px 12px; max-width: 320px; font-size: 12.5px; }
        .ns-fl-cfg h5 { margin: 6px 0 2px; font-size: 12px; color: var(--primary); }
        .ns-fl-cfg label { display: inline-flex; align-items: center; gap: 4px; margin: 2px 10px 2px 0; }
        .ns-fl-h { font-size: 12px; color: var(--sub-text); margin: 6px 0; }
        .ns-fl-m { position: fixed; z-index: 90; background: #fff; border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,.18); display: flex; flex-direction: column; min-width: 190px; }
        .ns-fl-m button { text-align: left; border: 0; background: none; padding: 8px 12px; font: inherit; font-size: 13px; cursor: pointer; }
        .ns-fl-m button:hover { background: #eef2f7; }
        .ns-fl-b { display: flex; gap: 6px; margin-top: 8px; }
        .ns-fl-b button { font: inherit; font-size: 12.5px; font-weight: 700; padding: 4px 12px; border: 1px solid var(--border); border-radius: 4px; background: #fff; cursor: pointer; }
        .ns-fl-b button.ns-on { background: var(--primary); color: #fff; border-color: var(--primary); }
        .ns-fl-x p { margin: 3px 0; font-size: 13px; }
        .ns-ovw { padding-bottom: 12px; }
        .ns-ovd { padding: 0 14px; border-top: 1px solid var(--border); margin-top: 6px; }
        .ns-ovd h4 { margin: 12px 0 4px; font-size: 13px; }
        .ns-ovd ul { margin: 0; padding-left: 18px; font-size: 13px; }
        .ns-ov { display: flex; gap: 20px; padding: 14px; align-items: flex-start; }
        .ns-ov h4 { margin: 12px 0 4px; font-size: 13px; }
        .ns-ov p { margin: 2px 0; font-size: 13px; }
        .ns-nlinks { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 12px 8px; }
        .ns-nlinks button { font: inherit; font-size: 12px; font-weight: 700; padding: 3px 9px; border: 1px solid var(--border); border-radius: 4px; background: #fff; cursor: pointer; }
        .ns-nlinks button.ns-on { background: var(--primary); color: #fff; border-color: var(--primary); }
        .ns-nlinks p { flex-basis: 100%; margin: 2px 0 0; font-size: 12px; color: var(--sub-text); }
        .ns-nprt button { background: #f3f6fa; }
        .ns-nflags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .ns-nflags em { font-style: normal; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,.18); color: #b9770e; }
        .ns-nflags em.ns-al { background: rgba(239,68,68,.14); color: #dc2626; }
        .ns-nbox h4 { margin: 0 0 6px; font-size: 13px; color: var(--sub-text); }
        .ns-nbox p { margin: 0 0 6px; line-height: 1.4; white-space: pre-wrap; }
        .ns-nbox p i { display: block; font-size: 11px; color: var(--sub-text); font-style: normal; }
        .ns-nnone { color: var(--sub-text); margin: 4px 0; font-size: 12.5px; }
        .ns-nd3 { display: flex; gap: 4px; margin-bottom: 6px; }
        .ns-nd3 select, .ns-nd3 input { min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 6px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nd3 select { flex: 1; } .ns-nd3 select:last-child { flex: 0 0 56px; }
        .ns-nlist { width: 100%; min-width: 0; table-layout: fixed; border-collapse: collapse; font-size: 12.5px; }
        .ns-nlist td, .ns-nlist th { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ns-nlist th { text-align: left; color: var(--sub-text); font-weight: 600; padding: 4px; border-bottom: 1px solid var(--border); }
        .ns-nlist td { padding: 5px 4px; border-bottom: 1px solid var(--border); }
        .ns-nlist tbody tr { cursor: pointer; }
        .ns-nlist tr.ns-on { background: rgba(14,74,132,.12); font-weight: 700; }
        .ns-nhd { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ns-nhd span { font-weight: 700; }
        .ns-nhd input { border: 1px solid var(--border); border-radius: 6px; padding: 5px 8px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nhd .ns-cmp { margin-left: auto; border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
        .ns-otw { overflow-x: auto; }
        .ns-ocs .ns-ot { min-width: 760px; }
        .ns-ocb td { background: #cfe3e8; color: #1f3b45; text-align: center; font-weight: 800; padding: 5px; letter-spacing: 2px; }
        .ns-ocq { text-align: center; color: var(--sub-text); width: 34px; }
        .ns-ocn { min-width: 74px; }
        .ns-ocs-c { text-align: center; white-space: nowrap; padding: 3px 4px !important; }
        .ns-ocg i { display: block; font-style: normal; font-size: 11px; font-weight: 700; }
        .ns-ot td.ns-otn .ns-onote { display: block; margin-top: 2px; color: #c0267c; font-size: 12.5px; font-weight: 400; }
        .ns-ocm td { border-top: 0 !important; color: #c0267c; font-size: 12.5px; padding-top: 0 !important; }
        .ns-ocs .ns-subh td { background: #f2f6f8; font-weight: 700; color: #0e4a84; }
        .ns-ot { width: 100%; min-width: 560px; table-layout: auto; border-collapse: collapse; font-size: 13px; }
        .ns-ot th { background: var(--muted-background); border: 1px solid var(--border); padding: 5px 8px; font-size: 12px; white-space: nowrap; }
        .ns-ot td { border: 1px solid var(--border); padding: 6px 8px; vertical-align: top; }
        .ns-ot td.ns-otn { min-width: 180px; }
        .ns-ot td.ns-otn b { display: block; }
        .ns-ot td.ns-otn i { font-style: normal; font-size: 11px; font-weight: 700; color: var(--primary); }
        .ns-ot td.ns-otn em { display: block; font-style: normal; font-size: 12px; color: #b9770e; }
        .ns-ot td.ns-ots { min-width: 130px; }
        .ns-ot td.ns-otst { text-align: center; white-space: nowrap; font-weight: 700; color: var(--sub-text); }
        .ns-ot tr.ns-x b { text-decoration: line-through; opacity: .6; }
        .ns-sl { display: inline-block; margin: 0 4px 4px 0; padding: 3px 9px; border-radius: 4px; border: 1px solid var(--border); background: transparent; color: var(--text); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ns-sl:disabled { cursor: default; }
        .ns-sl-un { outline: 2px solid #dc2626; outline-offset: -1px; background: #fff0f0 !important; color: #b91c1c !important; }
        .ns-sl-done { background: rgba(16,185,129,.14); border-color: rgba(16,185,129,.4); color: #047857; }
        .ns-sl-next { border-color: var(--primary); color: var(--primary); }
        .ns-sl-late { border-color: #dc2626; color: #dc2626; background: rgba(239,68,68,.1); }
        .ns-sl-wait { opacity: .5; }
        .ns-nsec h3 { margin: 0; padding: 6px 10px; background: #ececec; color: #111; text-align: center; font-size: 14px; border: 1px solid #aaa; }
        .ns-nrow { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; padding: 8px 6px; border-bottom: 1px solid var(--border); }
        .ns-nrow.ns-x .ns-nm b { text-decoration: line-through; opacity: .6; }
        .ns-nm { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding-top: 12px; }
        .ns-nr { padding-top: 12px; }
        .ns-nm span { color: var(--sub-text); font-size: 12px; }
        .ns-nm em { font-style: normal; font-size: 12px; color: #b9770e; }
        .ns-nd { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; max-width: 55%; }
        .ns-nd button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 5px 10px; font: inherit; font-size: 12.5px; cursor: pointer; }
        .ns-nd .ns-go { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .ns-chip { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: rgba(16,185,129,.14); color: #047857; font-weight: 700; white-space: nowrap; }
        .ns-chip.ns-x { background: rgba(100,116,139,.2); color: #475569; }
        .ns-nft { display: flex; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 8px; margin-top: auto; }
        .ns-nft button { border: 1px solid #aaa; background: #ececec; color: #111; border-radius: 6px; padding: 8px 16px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-ncb { display: flex; align-items: center; gap: 8px; padding: 5px 2px; cursor: pointer; }
        .ns-ncb input { width: 16px; height: 16px; }
        .ns-nsticky { width: 100%; box-sizing: border-box; border: 1px solid #e6d9a3; border-radius: 6px; padding: 10px; font: inherit; background: #fcf1d0; color: #3b3320; resize: vertical; }
        .ns-nmd { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 12px; }
        .ns-nmk { position: absolute; inset: 0; border: 0; background: rgba(15,23,42,.45); }
        .ns-nmb { position: relative; width: min(460px, 100%); max-height: 80vh; overflow: auto; background: var(--background, #fff); color: var(--text); border-radius: 12px; }
        .ns-nwin header { background: linear-gradient(#233a5c, #17283f); color: #fff; cursor: move; touch-action: none; padding: 8px 12px; border-bottom: 0; }
        .ns-nmb header, .ns-nwin header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .ns-nmb header button, .ns-nwin header button { border: 0; background: transparent; color: var(--sub-text); font: inherit; cursor: pointer; }
        .ns-nmc { padding: 12px 16px 16px; } .ns-nmc h4 { margin: 10px 0 4px; } .ns-nmc p { margin: 0 0 4px; }
        .ns-nwarn { background: rgba(239,68,68,.1); border-radius: 8px; padding: 6px 10px; margin-top: 6px; }
        .ns-nwarn p { margin: 4px 0; font-size: 12.5px; color: #dc2626; font-weight: 700; }
        .ns-nfa { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .ns-nfa button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 8px; padding: 8px 18px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-nfa .ns-go { background: var(--primary); border-color: var(--primary); color: #fff; }
        .ns-nfa .ns-go:disabled { opacity: .4; }
        .ns-nwin { position: fixed; z-index: 55; inset: 0; margin: auto; width: min(1320px, 96vw); height: min(880px, 92vh); min-width: 320px; min-height: 240px; resize: both; overflow: hidden; background: var(--background, #fff); color: var(--text); border: 1px solid #1c2f4b; box-shadow: 0 12px 40px rgba(0,0,0,.35); display: flex; flex-direction: column; border-radius: 6px; }
        .ns-nwin.ns-max { width: 100vw; height: 100vh; resize: none; border-radius: 0; }
        .ns-nwin { display: flex; flex-direction: column; }
        .ns-nwin .ns-nwb { flex: 1; min-height: 0; }
        .ns-wst { display: flex; gap: 16px; align-items: center; padding: 3px 12px; font-size: 11.5px; background: #eef2f7; border-top: 1px solid var(--border); color: var(--sub-text); }
        .ns-wst .ok { color: #1a7f4b; font-weight: 700; flex: 1; }
        .ns-nwin.ns-sp-a { inset: auto; left: 0; top: 96px; width: 50vw; height: calc(100vh - 96px); margin: 0; resize: none; }
        .ns-nwin.ns-sp-b { inset: auto; left: 50vw; top: 96px; width: 50vw; height: calc(100vh - 96px); margin: 0; resize: none; }
        .ns-wbtn { display: inline-flex; gap: 2px; }
        .ns-nwin header button { color: #fff; font-size: 22px; line-height: 1; padding: 0 6px; }
        .ns-nwb .wbk { border: 0; padding: 0; margin: 0; }
        .ns-nwb { padding: 12px 14px 24px; overflow: auto; flex: 1; }
        .ns-ndq { width: 100%; box-sizing: border-box; border: 1px solid var(--border); border-radius: 6px; padding: 8px; font: inherit; margin-bottom: 8px; background: var(--background); color: var(--text); }
        .ns-bbar { position: sticky; bottom: 0; z-index: 40; margin-left: 240px; box-shadow: 0 -2px 6px rgba(0,0,0,.08); display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 10px; background: #dfe6ee; border-top: 1px solid var(--border); }
        .ns-bbar > div { display: flex; flex-wrap: wrap; gap: 4px; }
        .ns-bbar button { font: inherit; font-size: 12px; font-weight: 700; padding: 3px 10px; border: 1px solid var(--border); border-radius: 4px; background: #fff; color: var(--text); cursor: pointer; white-space: nowrap; }
        .ns-bbar .ns-bp { background: var(--primary); color: #fff; border-color: var(--primary); }
        @media (max-width: 980px) {
          .ns-ngrid { grid-template-columns: 1fr; }
          .ns-bbar { margin-left: 0; }
          .ns-ntabs { margin-left: 0; margin-bottom: 0; position: static; }
          .ns-ngrid > *:not(.ns-nl) { padding-top: 0; }
          .ns-nf, .ns-nf.ns-nfc { width: auto; border: 0; border-bottom: 1px solid var(--border); }
          .ns-nl, .ns-nr { border: 0; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}
