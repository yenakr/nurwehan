'use client';

import { findPhi } from '../phi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChartData, Row } from '../types';
import { PHRASES, CARE_DX } from '../phrases';
import { VIEW_LIST } from '../samples';
import { ALLERGIES, DEPTS, DOCTORS, WARD_OPTIONS, bedOptions } from '../directory';
import { confirmDialog, notify } from '@/components/Dialog';
import { VitalsExtra, VitalsBulk, IoBulk, LabSets, IoTotals, printChart, useDictation } from './EhrExtras';
import AiMark from '@/components/AiMark';
import { NANDA, dxIssues } from '../nanda';
import ConsentPanel from './EhrConsent';
import VisitStrip from './EhrVisit';
import RegisterCard from './EhrRegister';
import MarPanel from './EhrMar';
import MemoPanel from './EhrMemo';
import { shiftOf, criticalFlags, badgesOf, BMI, DC_EDU, ISO } from '../emr';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import RxPanel from './EhrRx';
import SearchPick, { type PickItem } from './SearchPick';
import EhrNurse, { type Roster } from './EhrNurse';
import { printNameTag, printTickets, type TicketKind } from '../print';
import { DX, ACTS, MATS, DIETS, FORMS2, RET_KINDS, dxName, dxCode } from '../codes';
import FormPanel, { FORMS, FORM_CSS, type FormKey } from './EhrForms';

type ListKey =
  | 'progress' | 'vitals' | 'io' | 'bst' | 'diet' | 'dxcode' | 'nact' | 'mat' | 'dietord' | 'ret' | 'dcmed' | 'dcnote' | 'sched' | 'acu' | 'docs' | 'labs' | 'notes' | 'care'
  | 'transfusion' | 'nutrition' | 'consult' | 'consent' | 'surgery' | 'appts' | 'handover' | 'risk' | 'history' | 'imaging' | 'memos' | 'mar' | 'anes'
  | 'lines' | 'iv' | 'wounds' | 'edu' | 'specimen' | 'transport' | 'moves' | 'cpr';
type FormTab = 'f_morse' | 'f_braden' | 'f_pain' | 'f_preop';
type TabId = ListKey | 'rx' | 'orders' | 'admission' | 'nurseinfo' | 'discharge' | FormTab;
const isForm = (t: TabId): t is FormTab => t.startsWith('f_');

type MenuItem = { id: TabId; label: string };
type MenuNode = { label: string; items: MenuItem[] };
const MENU: MenuNode[] = [
  { label: '경과기록', items: [{ id: 'progress', label: '경과기록' }, { id: 'consult', label: '협진기록' }] },
  { label: '수술', items: [{ id: 'surgery', label: '수술기록' }, { id: 'anes', label: '마취기록' }, { id: 'f_preop', label: '수술 전 확인' }] },
  { label: '의사처방', items: [{ id: 'orders', label: '의사처방' }, { id: 'rx', label: '처방 관리' }, { id: 'mar', label: '투약' }, { id: 'ret', label: '약·주사 반납' }] },
  { label: '입원기록', items: [{ id: 'admission', label: '입원기록' }, { id: 'nurseinfo', label: '간호정보조사지' }, { id: 'history', label: '상병이력' }, { id: 'dxcode', label: '상병코드' }] },
  { label: '임상관찰', items: [{ id: 'vitals', label: '임상관찰' }, { id: 'bst', label: '혈당·인슐린' }] },
  { label: '치료/검사', items: [{ id: 'labs', label: '검사결과' }, { id: 'imaging', label: '영상검사' }, { id: 'transfusion', label: '수혈기록' }, { id: 'specimen', label: '검체 채취' }, { id: 'transport', label: '이송 의뢰' }] },
  { label: '간호관리', items: [{ id: 'nact', label: '간호행위' }, { id: 'mat', label: '처치재료' }, { id: 'dietord', label: '식이처방' }, { id: 'lines', label: '튜브·라인' }, { id: 'iv', label: 'IV 수액' }, { id: 'wounds', label: '상처·드레싱' }, { id: 'edu', label: '환자 교육' }] },
  { label: '응급', items: [{ id: 'cpr', label: 'CPR 기록지' }] },
  { label: '영양기록', items: [{ id: 'diet', label: '식이' }, { id: 'nutrition', label: '영양기록' }] },
  { label: '평가도구', items: FORMS.filter(f => f.key !== 'preop').map(f => ({ id: f.tab as TabId, label: f.label })) },
  { label: '간호기록', items: [{ id: 'notes', label: '간호기록' }, { id: 'risk', label: '위험도평가' }, { id: 'handover', label: '인계(SBAR)' }, { id: 'memos', label: '메모·인수인계' }, { id: 'acu', label: '중증도·고위험' }, { id: 'sched', label: '당일 일정' }] },
  { label: '간호과정', items: [{ id: 'care', label: '간호과정' }] },
  { label: '동의서', items: [{ id: 'consent', label: '동의서' }, { id: 'docs', label: '간호 서식지' }] },
  { label: '외래예약', items: [{ id: 'appts', label: '외래예약' }] },
  { label: '퇴원', items: [{ id: 'dcnote', label: '퇴원예고' }, { id: 'dcmed', label: '퇴원약' }, { id: 'discharge', label: '퇴원계획' }, { id: 'moves', label: '전동·전과·외출' }] },
];

type Col = { key: string; label: string; w: number; type?: 'area' | 'select' | 'ro' | 'pick'; list?: string; opts?: string[]; ph?: string };

export const COLS: Record<ListKey, Col[]> = {
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
  dxcode: [
    { key: 'kind', label: '구분', w: 80, type: 'select', opts: ['', '주상병', '부상병', '의증'] },
    { key: 'code', label: '상병코드', w: 100, type: 'pick', list: 'dl-dxc', ph: 'I50.0' },
    { key: 'name', label: '상병명', w: 260, type: 'pick', list: 'dl-dxn' },
    { key: 'date', label: '진단일', w: 100, ph: '2026-11-10' },
    { key: 'doc', label: '진단의', w: 80 },
  ],
  nact: [
    { key: 'time', label: '일시', w: 130, ph: '11-10 10:00' },
    { key: 'act', label: '간호행위', w: 220, type: 'pick', list: 'dl-act' },
    { key: 'mat', label: '사용 재료', w: 180 },
    { key: 'by', label: '수행자', w: 80 },
    { key: 'st', label: '상태', w: 80, type: 'select', opts: ['', '수행', '삭제'] },
    { key: 'note', label: '비고', w: 200 },
  ],
  mat: [
    { key: 'time', label: '일시', w: 130, ph: '11-10 10:00' },
    { key: 'item', label: '처치재료', w: 220, type: 'pick', list: 'dl-mat' },
    { key: 'qty', label: '수량', w: 60 },
    { key: 'unit', label: '단위', w: 60 },
    { key: 'act', label: '관련 행위', w: 160, type: 'pick', list: 'dl-act' },
    { key: 'by', label: '입력자', w: 80 },
  ],
  dietord: [
    { key: 'start', label: '시작일', w: 100, ph: '2026-11-10' },
    { key: 'end', label: '종료일', w: 100 },
    { key: 'type', label: '식이', w: 160, type: 'pick', list: 'dl-diet' },
    { key: 'st', label: '상태', w: 80, type: 'select', opts: ['등록', '변경', '중지'] },
    { key: 'by', label: '등록자', w: 80 },
    { key: 'note', label: '비고', w: 200 },
  ],
  ret: [
    { key: 'time', label: '일시', w: 130, ph: '11-10 10:00' },
    { key: 'kind', label: '구분', w: 130, type: 'select', opts: ['', ...RET_KINDS] },
    { key: 'name', label: '품목 (환자 처방)', w: 220, type: 'pick', list: 'dl-ptmed' },
    { key: 'qty', label: '수량·잔량', w: 90 },
    { key: 'reason', label: '사유', w: 180 },
    { key: 'by', label: '반납자', w: 80 },
    { key: 'chk', label: '확인자', w: 80 },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['반납대기', '반납완료'] },
  ],
  dcnote: [
    { key: 'date', label: '퇴원 예정일', w: 110, ph: '2026-11-12' },
    { key: 'doc', label: '지시 의사', w: 80 },
    { key: 'plan', label: '구분', w: 90, type: 'select', opts: ['퇴원', '전원', '자의퇴원', '가퇴원'] },
    { key: 'diet', label: '미래 식이처방 확인', w: 130, type: 'select', opts: ['', '확인', '미확인'] },
    { key: 'note', label: '비고', w: 220 },
  ],
  dcmed: [
    { key: 'name', label: '퇴원약 (환자 처방)', w: 240, type: 'pick', list: 'dl-ptmed' },
    { key: 'dose', label: '용량', w: 80 },
    { key: 'cnt', label: '횟수/일', w: 80 },
    { key: 'days', label: '일수', w: 60 },
    { key: 'st', label: '확인', w: 90, type: 'select', opts: ['', '확인', '미확인'] },
    { key: 'note', label: '복약 설명', w: 220 },
  ],
  sched: [
    { key: 'time', label: '시간', w: 80, ph: '14:00' },
    { key: 'kind', label: '구분', w: 90, type: 'select', opts: ['', '수술', '검사', 'PT', '시술', '외출', '병실이동', '기타'] },
    { key: 'name', label: '내용', w: 220 },
    { key: 'prep', label: '준비·특이사항', w: 240 },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['예정', '완료', '취소'] },
  ],
  acu: [
    { key: 'date', label: '일자', w: 100, ph: '2026-11-10' },
    { key: 'level', label: '중증도', w: 90, type: 'select', opts: ['', '1군', '2군', '3군', '4군'] },
    { key: 'risk', label: '고위험', w: 130, type: 'select', opts: ['', '낙상', '욕창', '감염 격리', '억제대', '자살·자해', '섬망', '출혈', '기타'] },
    { key: 'by', label: '평가자', w: 80 },
    { key: 'note', label: '비고', w: 240 },
  ],
  docs: [
    { key: 'name', label: '서식지', w: 200, type: 'pick', list: 'dl-doc' },
    { key: 'date', label: '일자', w: 100 },
    { key: 'st', label: '상태', w: 100, type: 'select', opts: ['', '출력', '설명 완료', '서명 받음', '스캔 등록'] },
    { key: 'by', label: '담당', w: 80 },
    { key: 'note', label: '비고', w: 200 },
  ],
  bst: [
    { key: 'time', label: '일시', w: 130, ph: '11-10 07:30' },
    { key: 'meal', label: '시점', w: 90, type: 'select', opts: ['', '식전', '식후 2h', '취침 전', '새벽', '수시'] },
    { key: 'glu', label: '혈당 (mg/dL)', w: 100 },
    { key: 'ins', label: '인슐린', w: 130, ph: 'Humalog' },
    { key: 'dose', label: '용량 (U)', w: 80 },
    { key: 'site', label: '주사 부위', w: 100 },
    { key: 'note', label: '비고', w: 220 },
  ],
  diet: [
    { key: 'date', label: '일자', w: 100, ph: '2026-11-10' },
    { key: 'meal', label: '끼니', w: 80, type: 'select', opts: ['', '아침', '점심', '저녁', '간식'] },
    { key: 'type', label: '식이 종류', w: 150, ph: '당뇨식, 연식' },
    { key: 'amt', label: '섭취량', w: 90, type: 'select', opts: ['', '전량', '3/4', '1/2', '1/4', '못 먹음', 'NPO'] },
    { key: 'note', label: '비고', w: 240 },
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
    { key: 'shift', label: '근무', w: 60, type: 'select', opts: ['', 'D', 'E', 'N'] },
    { key: 'mod', label: '수정 이력', w: 90, type: 'ro' },
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
    { key: 'date', label: '의뢰일자', w: 96 },
    { key: 'dept', label: '의뢰과', w: 64 },
    { key: 'doc', label: '의뢰의', w: 70 },
    { key: 'req', label: '의뢰내용', w: 260, type: 'area' },
    { key: 'rdept', label: '회신과', w: 110, type: 'select', opts: ['', ...DEPTS.map(d => d.code)] },
    { key: 'rdoc', label: '회신의', w: 70 },
    { key: 'reply', label: '회신내용', w: 260, type: 'area' },
    { key: 'perf', label: '실시일자', w: 96 },
    { key: 'st', label: '상태', w: 84, type: 'select', opts: ['', '접수', '진행중', '회신완료'] },
  ],
  consent: [
    { key: 'name', label: '동의서명', w: 240 },
    { key: 'date', label: '일자', w: 100 },
    { key: 'st', label: '상태', w: 100, type: 'select', opts: ['', '미작성', '작성', '서명완료', '거부'] },
    { key: 'doctor', label: '설명 의사', w: 90 },
    { key: 'signer', label: '서명자', w: 90 },
    { key: 'chk', label: '간호 확인', w: 90 },
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
  mar: [
    { key: 'time', label: '수행일시', w: 110 },
    { key: 'name', label: '약물', w: 240 },
    { key: 'dose', label: '용량', w: 80 },
    { key: 'route', label: '경로', w: 70 },
    { key: 'by', label: '수행자', w: 80 },
    { key: 'note', label: '특이사항', w: 200 },
  ],
  lines: [
    { key: 'kind', label: '종류', w: 100, type: 'select', opts: ['', 'IV catheter', 'Foley catheter', 'L-tube', 'Chest tube', 'JP drain', 'Hemovac', 'T-tube', 'Central line', '기타'] },
    { key: 'site', label: '부위·크기', w: 130, ph: '우측 전완 22G' },
    { key: 'ins', label: '삽입일', w: 100, ph: '11-10' },
    { key: 'chg', label: '교체 예정일', w: 100, ph: '11-13' },
    { key: 'out', label: '배액량 / 양상', w: 140 },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['유지', '교체', '제거'] },
    { key: 'note', label: '비고', w: 200 },
  ],
  iv: [
    { key: 'time', label: '시간', w: 90, ph: '10:00' },
    { key: 'fluid', label: '수액', w: 180, ph: 'N/S 1L' },
    { key: 'rate', label: '속도 (mL/hr)', w: 100 },
    { key: 'remain', label: '잔량 (mL)', w: 90 },
    { key: 'site', label: '부위', w: 110 },
    { key: 'st', label: '상태', w: 100, type: 'select', opts: ['주입 중', '교체', '중단', '완료'] },
    { key: 'by', label: '확인자', w: 80 },
  ],
  wounds: [
    { key: 'time', label: '시간', w: 110, ph: '11-10 10:00' },
    { key: 'site', label: '부위', w: 110 },
    { key: 'kind', label: '유형', w: 100, type: 'select', opts: ['', '수술 상처', '욕창', '열상', '화상', '삽입부위', '기타'] },
    { key: 'size', label: '크기 (cm)', w: 90 },
    { key: 'look', label: '양상·삼출물', w: 200, type: 'area' },
    { key: 'dress', label: '드레싱', w: 150 },
    { key: 'by', label: '수행자', w: 80 },
  ],
  edu: [
    { key: 'time', label: '일시', w: 110, ph: '11-10 10:00' },
    { key: 'topic', label: '교육 내용', w: 240 },
    { key: 'target', label: '대상', w: 90, type: 'select', opts: ['환자', '보호자', '환자·보호자'] },
    { key: 'method', label: '방법', w: 90, type: 'select', opts: ['구두', '시범', '유인물', '영상'] },
    { key: 'under', label: '이해도', w: 100, type: 'select', opts: ['', '충분', '보통', '재교육 필요'] },
    { key: 'by', label: '교육자', w: 80 },
  ],
  specimen: [
    { key: 'time', label: '채취일시', w: 110, ph: '11-10 06:00' },
    { key: 'test', label: '검사명', w: 180 },
    { key: 'tube', label: '용기', w: 110, type: 'select', opts: ['', 'EDTA', 'SST', 'Citrate', 'Heparin', 'Blood culture', '소변컵', '객담컵', '기타'] },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['접수', '채취', '이송', '결과'] },
    { key: 'by', label: '채취자', w: 80 },
  ],
  transport: [
    { key: 'time', label: '일시', w: 110, ph: '11-10 10:00' },
    { key: 'from', label: '출발', w: 100 },
    { key: 'to', label: '도착 (검사·부서)', w: 150 },
    { key: 'mode', label: '이송 수단', w: 100, type: 'select', opts: ['도보', '휠체어', '침대', '이동식 침대+산소'] },
    { key: 'escort', label: '동반자', w: 100 },
    { key: 'st', label: '상태', w: 90, type: 'select', opts: ['의뢰', '이송 중', '도착', '복귀'] },
  ],
  moves: [
    { key: 'time', label: '일시', w: 110, ph: '11-10 10:00' },
    { key: 'type', label: '구분', w: 90, type: 'select', opts: ['전동', '전과', '외출', '외박', '복귀'] },
    { key: 'from', label: '이전', w: 110 },
    { key: 'to', label: '이후', w: 110 },
    { key: 'reason', label: '사유', w: 240 },
  ],
  cpr: [
    { key: 'time', label: '시각 (초 단위)', w: 110, ph: '10:03:20' },
    { key: 'ev', label: '사건', w: 140, type: 'select', opts: ['', '의식·호흡 없음 확인', 'CPR 시작', '제세동', 'Epinephrine 1mg', 'Amiodarone', '기관 삽관', 'ROSC', '사망 선언', '기타'] },
    { key: 'detail', label: '내용', w: 260, type: 'area' },
    { key: 'by', label: '기록자', w: 80 },
  ],
  anes: [
    { key: 'time', label: '시각', w: 100, ph: '11-17 09:30' },
    { key: 'ev', label: '구분', w: 120, type: 'select', opts: ['', '마취 전 평가', '마취 시작', '기관 삽관', '수술 시작', '수술 종료', '발관', '회복실 입실', '회복실 퇴실'] },
    { key: 'detail', label: '내용 (약물·용량·활력징후)', w: 340, type: 'area' },
    { key: 'by', label: '마취 담당', w: 90 },
  ],
  memos: [
    { key: 'time', label: '일시', w: 110 },
    { key: 'type', label: '구분', w: 90 },
    { key: 'text', label: '내용', w: 520, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
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
  { key: 'dsSummary', label: '입원 경과 요약', rows: 4 },
  { key: 'dsCond', label: '퇴원 시 상태', rows: 2 },
  { key: 'dsMeds', label: '퇴원 약 처방', rows: 3 },
  { key: 'disEdu', label: '퇴원 교육 내용', rows: 5 },
  { key: 'disFu', label: '외래 추적관찰', rows: 3 },
];

// 입원 시 간호정보조사지
const NURSE: { key: string; label: string; opts?: string[] }[] = [
  { key: 'route', label: '입 원 경 로', opts: ['외래', '응급실', '전원', '기타'] },
  { key: 'method', label: '입 원 방 법', opts: ['도보', '휠체어', '침대', '안고 옴'] },
  { key: 'informant', label: '정보제공자', opts: ['환자', '보호자', '환자, 보호자', '의무기록', '기타'] },
  { key: 'job', label: '직 업' },
  { key: 'religion', label: '종 교', opts: ['무', '기독교', '천주교', '불교', '기타'] },
  { key: 'marital', label: '결 혼', opts: ['미혼', '기혼', '사별', '이혼'] },
  { key: 'lang', label: '언 어', opts: ['한국어', '영어', '기타'] },
  { key: 'cc', label: '주 호 소' },
  { key: 'purpose', label: '입원목적', opts: ['treatment', 'operation', 'examination', 'delivery', 'observation', 'rehabilitation'] },
  { key: 'insight', label: '병식(insight)', opts: ['유', '부분', '무'] },
  { key: 'allergy', label: '알레르기' },
  { key: 'social', label: '사회적특수성' },
  { key: 'drink', label: '음 주 력', opts: ['무', '월 1~2회', '주 1~2회', '주 3회 이상', '매일'] },
  { key: 'smoke', label: '흡 연 력', opts: ['무', '과거 흡연', '현재 흡연'] },
  { key: 'bedsore', label: '욕 창 (Braden)' },
  { key: 'fall', label: '낙 상 (Morse)' },
  { key: 'pain', label: '통 증', opts: ['NRS 0', 'NRS 1', 'NRS 2', 'NRS 3', 'NRS 4', 'NRS 5', 'NRS 6', 'NRS 7', 'NRS 8', 'NRS 9', 'NRS 10'] },
];

const ORDER_STATUS = ['', '집계완료', '접수', '추가', '완료', '취소'];
const ROUTES = ['', 'PO', 'IV', 'IM', 'SC', 'SL', 'Inh', 'CIV', 'Top'];

const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// 간호기록 작성: 형식(Focus DAR, SOAPIE, 서술)을 고르고, DAR은 상용구를 눌러 채운 뒤 직접 수정해서 기록한다
type NFmt = 'DAR' | 'SOAPIE' | 'SOAPIER' | 'NARR';
const NFMT: Record<NFmt, { label: string; fields: { k: string; label: string }[] }> = {
  DAR: { label: 'Focus DAR', fields: [{ k: 'D', label: 'D (자료)' }, { k: 'A', label: 'A (중재)' }, { k: 'R', label: 'R (반응)' }] },
  SOAPIE: { label: 'SOAPIE', fields: [{ k: 'S', label: 'S (주관적 자료)' }, { k: 'O', label: 'O (객관적 자료)' }, { k: 'A', label: 'A (사정)' }, { k: 'P', label: 'P (계획)' }, { k: 'I', label: 'I (중재)' }, { k: 'E', label: 'E (평가)' }] },
  SOAPIER: { label: 'SOAPIER', fields: [{ k: 'S', label: 'S (주관적 자료)' }, { k: 'O', label: 'O (객관적 자료)' }, { k: 'A', label: 'A (사정)' }, { k: 'P', label: 'P (계획)' }, { k: 'I', label: 'I (중재)' }, { k: 'E', label: 'E (평가)' }, { k: 'R', label: 'R (수정)' }] },
  NARR: { label: '서술', fields: [{ k: 'N', label: '서술 기록' }] },
};

function NoteComposer({ onAdd, author }: { onAdd: (n: Row) => void; author: string }) {
  const [fmt, setFmt] = useState<NFmt>('DAR');
  const [focus, setFocus] = useState('');
  const [txt, setTxt] = useState<Record<string, string>>({});
  const [time, setTime] = useState(nowStamp);
  const [act, setAct] = useState('');
  const [draftMsg, setDraftMsg] = useState('');
  const DK = 'ehr-note-draft';
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DK) || 'null');
      if (d) { setFmt(d.fmt); setFocus(d.focus || ''); setTxt(d.txt || {}); setDraftMsg('임시저장된 내용을 불러왔어요'); }
    } catch { /* 저장소 사용 불가 */ }
  }, []);
  const saveDraft = () => {
    try { localStorage.setItem(DK, JSON.stringify({ fmt, focus, txt })); setDraftMsg('임시저장 완료'); } catch { setDraftMsg('임시저장 실패'); }
  };
  const ph = PHRASES.find(p => p.focus === focus);
  const fields = NFMT[fmt].fields;

  const append = (k: string, t: string) => setTxt(v => ({ ...v, [k]: v[k] ? `${v[k]}${v[k].endsWith('\n') ? '' : ' '}${t}` : t }));
  const dict = useDictation(t => append(act || fields[0].k, t));
  const push = (k: string, phrase: string) => setTxt(t => ({ ...t, [k]: t[k] ? `${t[k]}\n${phrase}` : phrase }));
  const empty = fields.every(f => !(txt[f.k] || '').trim());

  const [err, setErr] = useState('');
  const add = () => {
    if (empty) return;
    if (fmt === 'DAR' && !focus.trim()) { setErr('Focus를 입력하거나 선택하세요'); return; }
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(time.trim()) && !/^\d{2}-\d{2} \d{2}:\d{2}$/.test(time.trim())) { setErr('기록일시를 확인하세요'); return; }
    const body = fmt === 'NARR'
      ? (txt.N || '').trim()
      : fields.map(f => (txt[f.k] || '').trim() && `${f.k})\n${txt[f.k].trim()}`).filter(Boolean).join('\n\n');
    onAdd({ time: time || nowStamp(), focus, text: body, author, shift: shiftOf() });
    setTxt({});
    setTime(nowStamp());
    setErr('');
    setDraftMsg('');
    try { localStorage.removeItem(DK); } catch { /* 무시 */ }
    if (dict.on) dict.stop();
  };

  return (
    <div className="nc">
      <div className="ncHead">
        <b>간호기록 작성</b>
        <label>
          기록일시
          <input value={time} onChange={e => setTime(e.target.value)} />
        </label>
        <label>
          Focus
          <input value={focus} onChange={e => setFocus(e.target.value)} />
        </label>
      </div>
      <div className="fmts">
        {(Object.keys(NFMT) as NFmt[]).map(k => (
          <button key={k} type="button" className={fmt === k ? 'on' : ''} onClick={() => { setFmt(k); setAct(''); }}>{NFMT[k].label}</button>
        ))}
        {dict.supported && (
          <button type="button" className={`mic ${dict.on ? 'on' : ''}`} onClick={dict.on ? dict.stop : dict.start}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>
            {dict.on ? '듣는 중 (누르면 멈춤)' : '음성 입력'}
          </button>
        )}
      </div>
      {fmt === 'DAR' && (
        <div className="chips">
          {PHRASES.map(p => (
            <button key={p.focus} type="button" className={focus === p.focus ? 'on' : ''} onClick={() => setFocus(p.focus)}>{p.focus}</button>
          ))}
        </div>
      )}
      <div className={`ncGrid ${fields.length === 6 ? 'six' : fields.length === 1 ? 'one' : ''}`}>
        {fields.map(f => (
          <div key={f.k} className="ncCol">
            <div className="lbl">{f.label}</div>
            {fmt === 'DAR' && (
              <div className="phs">
                {ph ? (ph[f.k.toLowerCase() as 'd' | 'a' | 'r'] || []).map(t => (
                  <button key={t} type="button" onClick={() => push(f.k, t)}>{t}</button>
                )) : <span className="hint">Focus를 선택하세요</span>}
              </div>
            )}
            <textarea rows={fmt === 'NARR' ? 8 : 4} value={txt[f.k] || ''} onFocus={() => setAct(f.k)} onChange={e => setTxt(t => ({ ...t, [f.k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="ncFoot">
        {err && <span style={{ color: '#dc2626', fontWeight: 700, marginRight: 'auto' }}>{err}</span>}
        {draftMsg && !err && <span style={{ color: 'var(--sub-text)', fontSize: 12, marginRight: 'auto' }}>{draftMsg}</span>}
        <button type="button" className="clr" disabled={empty} onClick={saveDraft}>임시저장</button>
        <button type="button" className="clr" onClick={() => { setTxt({}); setErr(''); setDraftMsg(''); try { localStorage.removeItem(DK); } catch { /* 무시 */ } }}>삭제</button>
        <button type="button" className="sv" disabled={empty} onClick={add}>제출</button>
      </div>
    </div>
  );
}

// 간호과정 작성: 간호진단을 고르고 상용구를 눌러 사정·목표·중재·평가를 채운 뒤 직접 수정해서 저장한다
function CareComposer({ onAdd }: { onAdd: (r: Row) => void }) {
  const [dx, setDx] = useState('');
  const [txt, setTxt] = useState<{ data: string; goal: string; plan: string; eval: string }>({ data: '', goal: '', plan: '', eval: '' });
  const lib = CARE_DX.find(c => c.dx === dx);
  const q = dx.trim().toLowerCase();
  const allDx = (() => {
    const m = new Map<string, { ko: string; en: string; dom: string; tpl: boolean }>();
    NANDA.forEach(g => g.items.forEach(([ko, en]) => m.set(ko, { ko, en, dom: g.domain, tpl: false })));
    CARE_DX.forEach(c => { const o = m.get(c.dx); m.set(c.dx, { ko: c.dx, en: o?.en || '', dom: o?.dom || '', tpl: true }); });
    return [...m.values()].sort((x, y) => x.ko.localeCompare(y.ko, 'ko'));
  })();
  const dxRows = q ? allDx.filter(r => r.ko.toLowerCase().includes(q) || r.en.toLowerCase().includes(q)) : allDx;
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
          <input value={dx} onChange={e => setDx(e.target.value)} />
        </label>
      </div>
      {dxIssues(dx).length > 0 && <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12.5, color: '#b45309', fontWeight: 700 }}>{dxIssues(dx).map(m => <li key={m}>{m}</li>)}</ul>}
      <div className="dxt">
        <style>{`
          .dxt { border: 1px solid var(--border); border-radius: 10px; max-height: 240px; overflow: auto; }
          .dxt table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .dxt th { position: sticky; top: 0; background: var(--bg, #fff); text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); font-weight: 700; white-space: nowrap; }
          .dxt td { padding: 6px 10px; border-bottom: 1px solid var(--border); cursor: pointer; }
          .dxt tr.on td { background: color-mix(in srgb, var(--primary) 14%, transparent); font-weight: 700; }
          .dxt td.en, .dxt td.dm { color: var(--sub-text); font-size: 12px; }
          .dxt td b { color: var(--primary); font-size: 11px; margin-left: 6px; }
        `}</style>
        <table>
          <thead><tr><th>간호진단</th><th>영문</th><th>영역</th></tr></thead>
          <tbody>
            {dxRows.length === 0 && <tr><td colSpan={3} className="hint">일치하는 진단이 없어요</td></tr>}
            {dxRows.map(r => (
              <tr key={r.ko} className={dx === r.ko ? 'on' : ''} onClick={() => setDx(r.ko)}>
                <td>{r.ko}{r.tpl && <b>예시 문구</b>}</td><td className="en">{r.en}</td><td className="dm">{r.dom}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

let PICKS_ORD: { name: string; dose: string; cnt: string }[] = [];
const PICKS: Record<string, PickItem[]> = {
  'dl-ptmed': [],
  'dl-dxc': DX.map(d => [d[0], d[1]]),
  'dl-dxn': DX.map(d => [d[1], d[0]]),
  'dl-act': ACTS.map(a => [a[0], a[1]]),
  'dl-mat': MATS.map(m => [m[0], m[1]]),
  'dl-diet': DIETS.map(d => [d, '']),
  'dl-doc': FORMS2.map(d => [d, '']),
};

type RuleCtx = { user: string; dept: string; doctor: string };
const todayYmd = () => { const t = new Date(); const p = (x: number) => String(x).padStart(2, '0'); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`; };
function applyRules(lk: string, n: Row, k: string, v: string, ctx?: RuleCtx) {
  if (lk === 'ret') {
    if (k === 'name' && v) { if (!n.qty) n.qty = '1'; if (!n.st) n.st = '반납대기'; }
    if (k === 'st' && v === '반납완료') { if (!n.chk) n.chk = ctx?.user || ''; }
    if (k === 'st' && v === '반납대기') n.chk = '';
  }
  if (lk === 'consult') {
    if (k === 'reply' && v.trim()) { n.st = '회신완료'; if (!n.perf) n.perf = todayYmd(); if (!n.rdoc) n.rdoc = '회신의'; }
    if (k === 'rdept' && v && !n.st) n.st = '접수';
    if (k === 'st' && v === '회신완료' && !n.perf) n.perf = todayYmd();
  }
  if (lk === 'dcmed' && k === 'name') {
    const o = PICKS_ORD.find(x => x.name === v);
    if (o) { if (!n.dose) n.dose = o.dose; if (!n.cnt) n.cnt = o.cnt; if (!n.days) n.days = '14'; if (!n.st) n.st = '미확인'; }
  }
  if (lk === 'dxcode') {
    if (k === 'code') { const nm = dxName(v); if (nm) n.name = nm; }
    if (k === 'name') { const cd = dxCode(v); if (cd) n.code = cd; }
  }
  if (lk === 'mat' && k === 'item') { const u = MATS.find(m => m[0] === v)?.[1]; if (u) { n.unit = u; if (!n.qty) n.qty = '1'; } }
  if (lk === 'nact' && k === 'act') { const m = ACTS.find(a => a[0] === v)?.[1]; if (m && !n.mat) n.mat = m; if (!n.st) n.st = '수행'; }
}

export default function EhrEditor({
  id,
  initialTitle,
  subject,
  initial,
  ai,
  aiLeft,
  userName,
  printKind,
  roster,
}: {
  printKind?: string;
  roster?: Roster[];
  ai: boolean;
  aiLeft?: number;
  userName?: string;
  id: string;
  initialTitle: string;
  subject: string | null;
  initial: ChartData;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<ChartData>(initial);
  const [tab, setTab] = useState<TabId>('notes');
  const [noteQ, setNoteQ] = useState('');
  const [screen, setScreen] = useState<'main' | 'chart'>('main');
  const [win, setWin] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);
  const [wardOpen, setWardOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editInfo, setEditInfo] = useState(false); // 기본정보는 수정 버튼을 눌러야 편집
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const first = useRef(true);
  const dirty = useRef(false);
  const latest = useRef({ title, subject, data });
  latest.current = { title, subject, data };
  // 탭을 닫거나 화면을 떠날 때 아직 저장되지 않은 내용이 있으면 한 번 더 저장
  useEffect(() => {
    const flush = () => {
      if (!dirty.current || latest.current.data.info.submitted) return;
      dirty.current = false;
      try {
        fetch(`/api/ehr/${id}`, { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(latest.current) });
      } catch {}
    };
    const vis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', vis); };
  }, [id]);
  useEffect(() => {
    if (printKind === '투약' || printKind === '주사' || printKind === '수액') printTickets(latest.current.data, printKind);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [aiOn, setAiOn] = useState(true);
  const [fb, setFb] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [fbLeft, setFbLeft] = useState(aiLeft ?? 0);
  useEffect(() => {
    try { setAiOn(localStorage.getItem('ehr:ai') !== '0'); } catch {}
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (data.info.submitted) return; // 제출한 차트는 저장하지 않는다
    setStatus('saving');
    dirty.current = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ehr/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, subject, data }),
        });
        if (res.ok) dirty.current = false;
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
  const locked = !!info.submitted;
  const toggleAi = () => {
    const v = !aiOn;
    setAiOn(v);
    try { localStorage.setItem('ehr:ai', v ? '1' : '0'); } catch {}
  };
  const askFb = async () => {
    setFbBusy(true);
    try {
      // 방금 쓴 내용이 저장된 뒤에 본다
      await fetch(`/api/ehr/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, subject, data }) });
      const r = await fetch(`/api/ehr/${id}/feedback`, { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setFb(j.text); if (typeof j.left === 'number') setFbLeft(j.left); }
      else notify(r.status === 400 ? '간호기록이나 간호과정을 먼저 써 주세요.' : r.status === 422 ? '실제 정보로 보이는 번호가 있어요. 가상 정보로 바꿔 주세요.' : r.status === 429 ? '오늘 피드백 횟수를 다 썼어요.' : '피드백을 받지 못했어요.');
    } finally { setFbBusy(false); }
  };
  const submit = async () => {
    const phi = findPhi(data);
    if (phi.length) { notify(`${phi.join(', ')}으로 보이는 내용이 있어요. 가상 정보로 바꾼 뒤 제출하세요.`); return; }
    if (!(await confirmDialog('제출하면 교수님이 볼 수 있고, 확인 전까지만 취소할 수 있어요. 제출할까요?'))) return;
    const sv = await fetch(`/api/ehr/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, subject, data }) });
    const r = sv.ok ? await fetch(`/api/ehr/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on: true }) }) : sv;
    if (r.ok) { setData(d => ({ ...d, info: { ...d.info, submitted: new Date().toISOString() } })); notify('제출했어요.'); }
    else notify('제출하지 못했어요.');
  };
  const unsubmit = async () => {
    const r = await fetch(`/api/ehr/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on: false }) });
    if (r.ok) setData(d => { const { submitted: _s, ...rest } = d.info; return { ...d, info: rest }; });
    else notify('교수님이 이미 확인한 차트는 고칠 수 없어요.');
  };
  const setInfo = (k: string, v: string) => setData(d => ({ ...d, info: { ...d.info, [k]: v } }));
  const ruleCtx: RuleCtx = { user: userName || '', dept: DEPTS.find(x => x.code === info.dept)?.name || info.dept || '', doctor: info.doctor || '' };
  PICKS_ORD = data.orders.filter(o => o.kind !== 'sec' && o.kind !== 'memo' && o.name && o.pri !== 'D/C').map(o => ({ name: o.name || '', dose: `${o.dose || ''}${o.unit || ''}`, cnt: o.cnt || '' }));
  PICKS['dl-ptmed'] = PICKS_ORD.map(o => [o.name, `${o.dose} ${o.cnt}`.trim()]);
  type AnyList = ListKey | 'orders';
  const setCell = (lk: AnyList, i: number, k: string, v: string) =>
    setData(d => ({ ...d, [lk]: d[lk].map((r, j) => {
      if (j !== i) return r;
      const n = { ...r, [k]: v };
      if (lk === 'notes' && k === 'text' && r.text && r.text !== v) {
        const t = new Date(); const p = (x: number) => String(x).padStart(2, '0');
        n.mod = `${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
      }
      applyRules(lk, n, k, v, ruleCtx);
      return n;
    }) }));
  const addRow = (lk: AnyList, init: Row = {}) => setData(d => ({ ...d, [lk]: [...d[lk], { ...init }] }));
  const delRow = (lk: AnyList, i: number) => setData(d => ({ ...d, [lk]: d[lk].filter((_, j) => j !== i) }));

  const toggleDischarge = async () => {
    const wasDischarged = !!data.info.discharged;
    if (!wasDischarged && !(await confirmDialog('퇴원 처리할까요? 기록은 그대로 남아요.'))) return;
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

  // 환자 상황에 따라 상단 메뉴가 달라진다 (수술 환자 / 응급 / 외래)
  const surgical = info.surg === '0' ? false : info.surg === '1' || data.surgery.length > 0;
  const menu = MENU.filter(g =>
    (g.label !== '응급' || info.ward === '응급실') &&
    (g.label !== '수술' || surgical) &&
    (info.ward !== '외래' || (g.label !== '퇴원' && g.label !== '간호관리')),
  );
  useEffect(() => {
    if (!menu.some(g => g.items.some(i => i.id === tab))) setTab('notes');
  }, [menu.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const crit = criticalFlags(data);
  const bd = badgesOf(data);
  useEffect(() => {
    if ((data.info.badges || '') !== bd && !data.info.submitted) setData(d => ({ ...d, info: { ...d.info, badges: bd } }));
  }, [bd]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const tbl = (lk: ListKey, keep?: (r: Row) => boolean) => {
    const cols = COLS[lk];
    if (!cols) return null;
    const rows = data[lk] || [];
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
              if (keep && !keep(row)) return null;
              const flag = lk === 'labs' ? labFlag(row) : '';
              return (
                <tr key={i}>
                  {cols.map(c => {
                    const v = row[c.key] || '';
                    const bad = (lk === 'vitals' && vitalBad(c.key, v)) || (lk === 'bst' && c.key === 'glu' && (+v > 0) && (+v < 70 || +v > 250));
                    const cls = bad ? 'bad' : lk === 'labs' && (c.key === 'value') ? (flag === 'H' ? 'hi' : flag === 'L' ? 'lo' : '') : '';
                    return (
                      <td key={c.key}>
                        {lk === 'labs' && c.key === 'value' && flag && <span className={`mk ${cls}`}>{flag === 'H' ? '▲' : '▼'}</span>}
                        {c.type === 'ro' ? (
                          <span className="ro">{v}</span>
                        ) : c.type === 'area' ? (
                          <textarea rows={['notes', 'progress', 'nutrition', 'imaging'].includes(lk) ? 5 : 3} value={v} onChange={e => setCell(lk, i, c.key, e.target.value)} />
                        ) : c.type === 'pick' ? (
                          <SearchPick items={PICKS[c.list || ''] || []} value={v} onChange={nv => setCell(lk, i, c.key, nv)} />
                        ) : c.type === 'select' ? (
                          <select value={v} onChange={e => setCell(lk, i, c.key, e.target.value)}>
                            {(c.opts!.includes(v) ? c.opts! : [...c.opts!, v]).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input className={cls} value={v} onChange={e => setCell(lk, i, c.key, e.target.value)} />
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
  const tabBody = (
    <>
            {tab === 'orders' && (
              <div className="tw">
                <div className="ohead">
                  <span>처방일자 </span>
                  <input className="od" value={info.orderDate || ''} onChange={e => setInfo('orderDate', e.target.value)} />
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
                      <th style={{ minWidth: 64 }}>구분</th>
                      {[1, 2, 3, 4, 5, 6].map(n => <th key={n} style={{ minWidth: 64 }}>{n}회</th>)}
                      <th className="x" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && <tr><td colSpan={16} className="none">처방이 없어요</td></tr>}
                    {orders.map((r, i) => {
                      if (r.kind === 'sec') {
                        return (
                          <tr key={i} className="sec">
                            <td colSpan={15}>
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
                            <td colSpan={13}>
                              <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            </td>
                            <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                          </tr>
                        );
                      }
                      seq += 1;
                      return (
                        <tr key={i} className={r.pri === 'D/C' ? 'dcr' : ''}>
                          <td className="ck">
                            <button type="button" className={r.ck ? 'on' : ''} aria-pressed={!!r.ck} aria-label="수행 확인" onClick={() => setCell('orders', i, 'ck', r.ck ? '' : '1')}>✓</button>
                          </td>
                          <td className="seq">{seq}</td>
                          <td>
                            <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            <select value={r.opt || ''} onChange={e => setCell('orders', i, 'opt', e.target.value)} aria-label="단독·비급여">
                              {['', '단독', '비급여', '단독 비급여'].map(o => <option key={o} value={o}>{o || '-'}</option>)}
                            </select>
                          </td>
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
                          <td>
                            <select value={r.pri || ''} onChange={e => setCell('orders', i, 'pri', e.target.value)}>
                              {['', 'PRN', 'STAT', 'D/C'].map(o => <option key={o} value={o}>{o}</option>)}
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
                <div className="nhd2" style={{ display: 'flex', gap: 12, fontSize: 13, fontWeight: 700, padding: '6px 0', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <span>기록분류/선택</span>
                  <span>{[info.ward, info.bed].filter(Boolean).join(' ')}</span>
                  <span>{info.ptNo}</span>
                  <span>{info.name}</span>
                </div>
                <NoteComposer author={userName || ''} onAdd={n => setData(d => ({ ...d, notes: [n, ...d.notes] }))} />
                {data.notes.some(n => n.fb) && (
                  <div className="pfb">
                    <style>{`.pfb { border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 8px; padding: 10px 12px; margin: 8px 0; font-size: 13.5px; line-height: 1.6; } .pfb p { margin: 2px 0 6px; white-space: pre-wrap; } .pfb small { color: var(--sub-text); }`}</style>
                    <b>교수님 코멘트</b>
                    {data.notes.filter(n => n.fb).map((n, i) => <div key={i}><small>{n.time} {n.focus}</small><p>{n.fb}</p></div>)}
                  </div>
                )}
                <div className="nsr">
                  <style>{`.nsr { display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 13px; } .nsr input { width: 220px; }`}</style>
                  <b>간호기록 검색</b>
                  <input value={noteQ} onChange={e => setNoteQ(e.target.value)} />
                  {noteQ && <button type="button" className="clr" onClick={() => setNoteQ('')}>지우기</button>}
                </div>
                {tbl('notes', noteQ.trim() ? (r => `${r.focus || ''} ${r.text || ''} ${r.author || ''}`.includes(noteQ.trim())) : undefined)}
              </>
            )}

            {(tab === 'admission' || tab === 'discharge') && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>{tab === 'admission' ? '입원기록' : '퇴원계획'}</span></div>
                {tab === 'discharge' && (() => {
                  const eduN = (info.dcEdu || '').split(',').filter(Boolean).length;
                  const note = data.dcnote[data.dcnote.length - 1];
                  const meds = data.dcmed;
                  const medOk = meds.filter(m => m.st === '확인').length;
                  const appt = data.appts.find(a => a.st !== '취소');
                  const items: [string, boolean, string][] = [
                    ['퇴원예고', !!note, note ? `${(note.date || '').slice(0, 10)} ${note.plan || ''}` : '미등록'],
                    ['미래 식이처방 확인', note?.diet === '확인', note?.diet || '미확인'],
                    ['퇴원약 확인', meds.length > 0 && medOk === meds.length, meds.length ? `${medOk}/${meds.length}건` : '처방 없음'],
                    ['퇴원 교육', eduN === DC_EDU.length, `${eduN}/${DC_EDU.length}항목`],
                    ['외래 예약', !!appt, appt ? `${appt.date} ${appt.time || ''}` : '없음'],
                    ['남은 라인·배액관', !data.lines.some(l => l.st !== '제거'), `${data.lines.filter(l => l.st !== '제거').length}건`],
                  ];
                  const left = items.filter(x => !x[1]).length;
                  return (
                    <div className="ds dcsum">
                      <style>{`.dcsum .g { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 6px; } .dcsum .g div { border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 13px; display: flex; justify-content: space-between; gap: 8px; } .dcsum .g .ok { background: rgba(16,185,129,.1); } .dcsum .g .no { background: rgba(245,158,11,.14); } .dcsum p { margin: 6px 0 0; font-weight: 700; }`}</style>
                      <h4>■ 퇴원 준비 현황</h4>
                      <div className="g">{items.map(([k, ok, v]) => <div key={k} className={ok ? 'ok' : 'no'}><span>{ok ? '✔' : '△'} {k}</span><b>{v}</b></div>)}</div>
                      <p>{left === 0 ? '모든 퇴원 준비가 끝났어요.' : `미완료 ${left}항목 — 확인 후 퇴원 처리하세요.`}</p>
                    </div>
                  );
                })()}
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
                {tab === 'discharge' && (
                  <div className="ds">
                    <h4>■ 퇴원 교육 체크리스트</h4>
                    <div className="chk">
                      {DC_EDU.map((t, n) => {
                        const set = (info.dcEdu || '').split(',').filter(Boolean);
                        const on = set.includes(String(n));
                        return (
                          <label key={t}>
                            <input type="checkbox" checked={on} onChange={() => setInfo('dcEdu', (on ? set.filter(x => x !== String(n)) : [...set, String(n)]).join(','))} />
                            {t}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'nurseinfo' && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>입원 시 간호정보조사지</span></div>
                <div className="nl">
                  {NURSE.map(f => (
                    <label key={f.key}>
                      <b>[ {f.label} ]</b>
                      {f.opts ? (
                        <select value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)}>
                          {['', ...f.opts, ...(info[f.key] && !f.opts.includes(info[f.key]) ? [info[f.key]] : [])].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab === 'vitals' && (
              <>
                <h4 className="ph">활력징후</h4>
                <VitalsBulk onApply={rs => setData(d => ({ ...d, vitals: [...d.vitals, ...rs] }))} />
                {tbl('vitals')}
                <VitalsExtra rows={data.vitals} />
                <h4 className="ph">섭취/배설 (I&amp;O)</h4>
                <IoBulk onApply={rs => setData(d => ({ ...d, io: [...d.io, ...rs] }))} />
                {tbl('io')}
                <IoTotals rows={data.io} />
              </>
            )}
            {tab === 'rx' && <RxPanel data={data} author={userName || ''} onChange={orders => setData(d => ({ ...d, orders }))} />}
            {tab === 'bst' && (
              <>
                <h4 className="ph">혈당·인슐린</h4>
                {tbl('bst')}
              </>
            )}

            {isForm(tab) && (() => {
              const f = FORMS.find(x => x.tab === tab)!;
              return <FormPanel kind={f.key as FormKey} rows={data.forms?.[f.key] || []} onChange={rows => setData(d => ({ ...d, forms: { ...(d.forms || {}), [f.key]: rows } }))} />;
            })()}

            {tab === 'consent' && <ConsentPanel rows={data.consent} dept={info.dept} onChange={rs => setData(d => ({ ...d, consent: rs }))} />}
            {tab === 'mar' && <MarPanel data={data} author={userName || ''} onChange={(orders, mar) => setData(d => ({ ...d, orders, mar }))} />}
            {tab === 'memos' && <MemoPanel rows={data.memos} author={userName || ''} onChange={rs => setData(d => ({ ...d, memos: rs }))} />}
            {tab === 'labs' && <LabSets onApply={rs => setData(d => ({ ...d, labs: [...d.labs, ...rs] }))} />}
            {!isForm(tab) && tab !== 'notes' && tab !== 'care' && tab !== 'orders' && tab !== 'admission' && tab !== 'discharge' && tab !== 'nurseinfo' && tab !== 'vitals' && tab !== 'bst' && tab !== 'rx' && tab !== 'memos' && tab !== 'mar' && tab !== 'consent' && (
              <>
                {tab === 'progress' && (
                  <div className="adds" style={{ marginBottom: 6 }}>
                    <button type="button" className="add" onClick={() => { const t = new Date(); const p = (x: number) => String(x).padStart(2, '0'); addRow('progress', { time: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`, text: '주관적 소견 (S)\n\n객관적 소견 (O)\n\n평가 (A)\n\n치료계획 (P)\n', author: userName || '' }); }}>+ SOAP 양식</button>
                  </div>
                )}
                {tbl(tab)}
              </>
            )}
    </>
  );
  const CUSTOM = ['vitals', 'labs', 'care', 'notes', 'consent', 'memos', 'mar', 'rx', 'orders', 'admission', 'discharge', 'nurseinfo'];
  const tabLabel = MENU.flatMap(g => g.items).find(i => i.id === tab)?.label || '';
  const formCols: Col[] | null = !isForm(tab) && !CUSTOM.includes(tab) && (COLS as Record<string, Col[]>)[tab] ? (COLS as Record<string, Col[]>)[tab].filter(c => c.type !== 'ro') : null;
  const [inp, setInp] = useState(false);
  const [draft, setDraft] = useState<Row>({});
  const blank = (cols: Col[]): Row => {
    const t = new Date(); const p = (x: number) => String(x).padStart(2, '0');
    const r: Row = {};
    cols.forEach(c => {
      if (c.key === 'by' || c.key === 'author') r[c.key] = userName || '';
      else if (c.key === 'time' || c.key === 'date' || c.key === 'start') {
        const ph = c.ph || '';
        r[c.key] = /^\d{4}-/.test(ph) ? `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}` : /^\d{2}:\d{2}/.test(ph) ? `${p(t.getHours())}:${p(t.getMinutes())}` : c.key === 'time' ? `${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}` : `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
      } else if (c.type === 'select' && c.opts) r[c.key] = c.opts.find(o => o) && !c.opts[0] ? '' : c.opts[0] || '';
    });
    if (tab === 'consult') { r.dept = r.dept || info.dept || ''; r.doc = r.doc || info.doctor || ''; r.st = r.st || '접수'; r.date = r.date || todayYmd(); }
    if (tab === 'ret') r.st = '반납대기';
    return r;
  };
  const openInput = () => { setDraft(formCols ? blank(formCols) : {}); setInp(true); };
  const setDraftVal = (k: string, v: string) => setDraft(d => { const n = { ...d, [k]: v }; applyRules(tab, n, k, v, ruleCtx); return n; });
  const saveDraft = () => { addRow(tab as AnyList, draft); setInp(false); };

  const tools = (
    <>
        <button type="button" className="back" onClick={() => router.push(`/ehr?view=${encodeURIComponent(info.ward === '응급실' ? '응급' : info.ward || '')}`)}>&larr; {info.ward === '응급실' ? '응급' : info.ward || '목록'}</button>
          <button type="button" className="back" onClick={() => { setWin(null); setScreen(screen === 'main' ? 'chart' : 'main'); }}>{screen === 'main' ? '전체 차트' : '간호 화면'}</button>
          <span className={`st ${status}`}>{status === 'saved' ? '저장됨' : status === 'saving' ? '저장 중…' : '저장 실패'}</span>
          {ai && !locked && aiOn && <button type="button" className="aib" onClick={askFb} disabled={fbBusy || fbLeft <= 0}><AiMark size={14} />{fbBusy ? '살펴보는 중' : `AI 피드백 ${fbLeft}회`}</button>}
          {locked
            ? (!info.reviewed && <button type="button" className="subm out" onClick={unsubmit}>제출 취소</button>)
            : <button type="button" className="subm" onClick={submit}>제출</button>}
          <div className="more">
            <button type="button" className="mbtn" aria-label="더보기" onClick={() => setMoreOpen(o => !o)}>&middot;&middot;&middot;</button>
            {moreOpen && (
              <>
                <button type="button" className="mbk" aria-label="닫기" onClick={() => setMoreOpen(false)} />
                <div className="mm">
                  <button type="button" onClick={() => { setMoreOpen(false); printNameTag(info); }}>네임지 출력</button>
                  {(['투약', '주사', '수액'] as const).map(k => <button key={k} type="button" onClick={() => { setMoreOpen(false); printTickets(data, k as TicketKind); }}>{k} 티켓 출력</button>)}
                  <button type="button" onClick={() => { setMoreOpen(false); if (!printChart(title, data, userName || '')) notify('팝업을 허용해 주세요.'); }}>인쇄</button>
                  <button type="button" disabled={locked} onClick={() => { setMoreOpen(false); toggleDischarge(); }}>{info.discharged ? '퇴원 취소' : '퇴원'}</button>
                  {ai && !locked && <button type="button" onClick={() => { toggleAi(); setMoreOpen(false); }}>AI 피드백 {aiOn ? '끄기' : '켜기'}</button>}
                  <button
                    type="button"
                    className="del"
                    onClick={async () => {
                      setMoreOpen(false);
                      if (!(await confirmDialog('이 차트를 삭제할까요? 모든 기록이 사라지고 되돌릴 수 없어요.'))) return;
                      const res = await fetch(`/api/ehr/${id}`, { method: 'DELETE' });
                      if (res.ok) router.push('/ehr');
                    }}
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
    </>
  );

  return (
    <div className="ehr">
      <div className="bar">
        <Link href="/" className="home" aria-label="홈">NUR위한</Link>
        <span className="ttl" />
        <span className="who">{userName}</span>
        <LogoutButton />
      </div>

      <p className="pvn">실제 환자 정보(이름, 환자번호, 생년월일, 병실 등)는 쓰지 마세요. 가상 정보로 바꿔서 연습하세요.</p>
      {screen === 'chart' && <div className="etool">{tools}</div>}
      {locked && <div className="lkb">{info.reviewed ? '교수님이 확인했어요' : '제출했어요. 교수님 확인 전에는 제출 취소로 고칠 수 있어요'}</div>}
      {info.comment && <div className="cmt"><b>교수님 의견</b><p>{info.comment}</p></div>}
      {fb && <div className="cmt ai"><b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><AiMark size={14} />AI 피드백</b><button type="button" className="cx" aria-label="닫기" onClick={() => setFb('')}>&times;</button><p>{fb}</p></div>}

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {screen === 'main' ? (
        <EhrNurse
          data={data}
          setData={setData}
          userName={userName || ''}
          roster={roster || []}
          win={win}
          onOpen={id => { if (MENU.some(g => g.items.some(it => it.id === id))) setTab(id as TabId); setWin(win === id ? null : id); }}
          onClose={() => setWin(null)}
          drawer={tabBody}
          tools={tools}
          onChart={() => setScreen('chart')}
          onLabel={() => printTickets(data, '전체')}
        />
      ) : (
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
            {menu.map(g => {
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
            {info.admit && !editInfo && (() => {
              const day = (v: string) => { const t = new Date(`${v.slice(0, 10)}T00:00:00`).getTime(); return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : null; };
              const hd = day(info.admit);
              const ops = data.surgery.map(r => day(r.date || '')).filter((n): n is number => n !== null && n >= 0);
              const pod = ops.length ? Math.min(...ops) : null;
              return hd !== null && hd >= 0 ? <div className="sd"><em>HD / POD</em><span className="v">HD {hd + 1}{pod !== null ? ` · POD ${pod}` : ''}</span></div> : null;
            })()}
            {side('dx', '진단명')}
            {sel('allergy', '알레르기', ALLERGIES.map(a => ({ v: a, l: a })))}
            {side('height', '키 (cm)')}
            {side('weight', '체중 (kg)')}
            {BMI(info.height, info.weight) && <div className="sd"><em>BMI</em><span className="v">{BMI(info.height, info.weight)}</span></div>}
            {sel('surg', '수술 여부', [{ v: '1', l: '수술 환자' }, { v: '0', l: '해당 없음' }])}
            {sel('iso', '격리', ISO.map(v => ({ v, l: v })))}
            {sel('npo', '금식', [{ v: '1', l: '금식' }, { v: '0', l: '해당 없음' }])}
            {hasAllergy && <div className="alg">알레르기 있음</div>}
            {info.discharged && <div className="dcb">퇴원 {info.discharged}</div>}
            <button type="button" className="ed" onClick={() => setEditInfo(v => !v)}>{editInfo ? '완료' : '수정'}</button>
          </aside>

          <section className="main">
            {crit.length > 0 && <div className="cw" role="alert">위험 수치: {crit.join(' · ')}</div>}
            {(info.ward === '외래' || info.ward === '응급실') && <VisitStrip info={info} set={setInfo} />}
            {!locked && !info.name?.trim() && (
              <RegisterCard
                info={info}
                onRegister={patch => {
                  setData(d => ({ ...d, info: { ...d.info, ...patch } }));
                  setTitle(`${patch.name} · ${patch.dx}`.slice(0, 100));
                }}
              />
            )}
            <button type="button" className="inb" onClick={openInput}>+ {tabLabel} 입력</button>
            <fieldset className="vw" disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{tabBody}</fieldset>
            {inp && (
              <div className="mdl" role="dialog" aria-label={`${tabLabel} 입력`}>
                <button type="button" className="mdk" aria-label="닫기" onClick={() => setInp(false)} />
                <div className="mdb">
                  <header><b>{tabLabel} 입력</b><button type="button" onClick={() => setInp(false)}>닫기</button></header>
                  <div className="mdc">
                    {formCols ? (
                      <>
                        <div className="rf">
                          {formCols.map(c => (
                            <label key={c.key} className="rfl">
                              <span>{c.label}</span>
                              {c.type === 'area' ? (
                                <textarea rows={4} value={draft[c.key] || ''} onChange={e => setDraftVal(c.key, e.target.value)} />
                              ) : c.type === 'select' ? (
                                <select value={draft[c.key] || ''} onChange={e => setDraftVal(c.key, e.target.value)}>
                                  {c.opts!.map(o => <option key={o} value={o}>{o || '선택'}</option>)}
                                </select>
                              ) : (
                                c.type === 'pick' ? (
                                <SearchPick items={PICKS[c.list || ''] || []} value={draft[c.key] || ''} onChange={nv => setDraftVal(c.key, nv)} />
                              ) : (
                                <input value={draft[c.key] || ''} onChange={e => setDraftVal(c.key, e.target.value)} />
                              )
                              )}
                            </label>
                          ))}
                        </div>
                        <div className="rfa">
                          <button type="button" onClick={() => setInp(false)}>취소</button>
                          <button type="button" className="go" disabled={!formCols.some(c => (draft[c.key] || '').trim() && c.key !== 'time' && c.key !== 'by' && c.key !== 'author')} onClick={saveDraft}>저장</button>
                        </div>
                      </>
                    ) : tabBody}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      )}
      </fieldset>

      <style>{FORM_CSS}</style>
      <style jsx global>{`
        .ehr { --nv1: #1c2f4b; --nv2: #13233a; --tl: #cfe5e6; --ln: #cfd5dc; }
        .ehr .etool { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; padding: 6px 10px; border-radius: 6px; background: linear-gradient(#233a5c, #17283f); }
        .ehr .etool .back { border-color: rgba(255,255,255,.35); color: #fff; }
        .ehr .etool .st { color: #cbd5e1; }
        .ehr .etool .mbtn { color: #fff; }
        .ehr .etool .st { margin-left: auto; }
        .ehr .bar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .ehr .back { border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .ehr .home { font-weight: 800; color: var(--primary); text-decoration: none; letter-spacing: -0.5px; padding-right: 4px; }
        .ehr .who { font-size: 0.8125rem; color: var(--sub-text); white-space: nowrap; }
        .ehr .bar .btn-outline { padding: 4px 10px !important; }
        .ehr .more { position: relative; }
        .ehr .mbtn { border: 0; background: transparent; color: var(--sub-text); font-size: 1.25rem; line-height: 1; letter-spacing: 1px; padding: 2px 8px; cursor: pointer; }
        .ehr .mbk { position: fixed; inset: 0; background: transparent; border: 0; z-index: 30; cursor: default; }
        .ehr .mm { position: absolute; right: 0; top: calc(100% + 4px); z-index: 31; min-width: 150px; background: var(--background, #fff); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.14); padding: 4px; display: flex; flex-direction: column; }
        .ehr .mm button { border: 0; background: transparent; color: var(--text); text-align: left; font: inherit; font-size: 0.875rem; padding: 9px 12px; border-radius: 7px; cursor: pointer; }
        .ehr .mm button:hover { background: var(--muted-background); }
        .ehr .mm button:disabled { opacity: .4; cursor: default; }
        .ehr .mm button.del { color: #b91c1c; }
        .ehr .subm.out { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
        .ehr .back { font-size: 0.8125rem; color: var(--sub-text); text-decoration: none; white-space: nowrap; }
        .ehr .ttl { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 1rem; font-weight: 800; color: var(--text); font-family: inherit; padding: 4px 0; }
        .ehr .ttl:focus { outline: none; border-bottom: 2px solid var(--primary); }
        .ehr .st { font-size: 0.75rem; color: var(--sub-text); white-space: nowrap; }
        .ehr .dis { border: 0; background: transparent; color: var(--sub-text); font-size: 0.75rem; font-family: inherit; cursor: pointer; }
        .ehr .st.error { color: #b91c1c; font-weight: 700; }

        .ehr .inb { align-self: flex-start; margin: 0 0 8px; border: 1px solid var(--primary); background: var(--primary); color: #fff; border-radius: 8px; padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .ehr .vw input, .ehr .vw select, .ehr .vw textarea { opacity: 1; color: inherit; -webkit-text-fill-color: currentColor; background: transparent; border-color: transparent; appearance: none; -webkit-appearance: none; resize: none; pointer-events: none; }
        .ehr .vw button { pointer-events: none; }
        .ehr .vw .add, .ehr .vw .adds, .ehr .vw td.x button, .ehr .vw th.x { display: none; }
        .ehr .mdl { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; }
        .ehr .mdk { position: absolute; inset: 0; border: 0; background: rgba(15,23,42,0.45); cursor: default; }
        .ehr .mdb { position: relative; width: min(760px, 100%); max-height: 88vh; display: flex; flex-direction: column; background: var(--background, #fff); color: var(--text); border-radius: 14px 14px 0 0; box-shadow: 0 -6px 24px rgba(0,0,0,0.25); }
        @media (min-width: 720px) { .ehr .mdl { align-items: center; } .ehr .mdb { border-radius: 14px; } }
        .ehr .mdb header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .ehr .mdb header button { border: 0; background: transparent; color: var(--sub-text); font: inherit; cursor: pointer; }
        .ehr .mdc { padding: 14px 16px 18px; overflow: auto; }
        .ehr .rf { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .ehr .rfl { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--sub-text); }
        .ehr .rfl input, .ehr .rfl select, .ehr .rfl textarea { border: 1px solid var(--border); border-radius: 8px; padding: 8px; font: inherit; font-size: 14px; background: var(--background); color: var(--text); }
        .ehr .rfa { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .ehr .rfa button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 8px; padding: 8px 18px; font: inherit; font-weight: 600; cursor: pointer; }
        .ehr .rfa .go { background: var(--primary); border-color: var(--primary); color: #fff; }
        .ehr .rfa .go:disabled { opacity: .4; }
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

        .ehr .body { display: grid; grid-template-columns: 188px minmax(0, 1fr); min-height: calc(100vh - 250px); }
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
        .ehr .subm { border: 0; border-radius: 999px; background: var(--primary); color: #fff; font: inherit; font-size: 0.75rem; font-weight: 700; padding: 6px 14px; cursor: pointer; white-space: nowrap; }
        .ehr .aib { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--primary); border-radius: 999px; background: none; color: var(--primary); font: inherit; font-size: 0.75rem; font-weight: 700; padding: 5px 12px; cursor: pointer; white-space: nowrap; }
        .ehr .aib:disabled { opacity: .6; }
        .ehr .aisw { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--sub-text); cursor: pointer; }
        .ehr .spk { display: flex; flex-direction: column; gap: 2px; font-size: 11.5px; color: #475569; }
        .ehr .spk b { font-size: 13px; color: #1e293b; }
        .ehr .sparks { display: flex; flex-wrap: wrap; gap: 8px 22px; padding: 10px 4px; }
        .ehr .news { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding: 0 4px 10px; font-size: 12.5px; }
        .ehr .news i { flex-basis: 100%; font-style: normal; font-size: 11.5px; color: #64748b; }
        .ehr .nw { padding: 2px 9px; border-radius: 999px; background: #e8f0fb; color: #1d4e89; font-weight: 700; }
        .ehr .nw.md { background: #fde9c8; color: #9a5b00; }
        .ehr .nw.hi { background: #fbd5d5; color: #b91c1c; }
        .ehr .iot { display: flex; flex-wrap: wrap; gap: 6px 18px; padding: 8px 4px; font-size: 13px; color: #475569; }
        .ehr .iot b { color: #1e293b; }
        .ehr .fmts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
        .ehr .fmts button { border: 1px solid var(--ln); background: #fff; padding: 5px 12px; font: inherit; font-size: 12.5px; font-weight: 700; color: #475569; cursor: pointer; }
        .ehr .fmts button.on { background: #1d4e89; border-color: #1d4e89; color: #fff; }
        .ehr .fmts .mic { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; color: #1d4e89; }
        .ehr .fmts .mic.on { background: #dc2626; border-color: #dc2626; color: #fff; }
        .ehr .ncGrid.six { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .ehr .ncGrid.one { grid-template-columns: 1fr; }
        .ehr .pvn { margin: 0 0 8px; font-size: 0.6875rem; color: #b45309; font-weight: 600; }
        .ehr .lkb { margin-bottom: 8px; padding: 8px 12px; border-radius: 8px; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); font-size: 0.8125rem; font-weight: 700; }
        .ehr .cmt { position: relative; margin-bottom: 8px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--primary); background: var(--white); }
        .ehr .cmt.ai { border-color: var(--line); background: color-mix(in srgb, var(--primary) 6%, transparent); }
        .ehr .cmt b { font-size: 0.8125rem; color: var(--primary); }
        .ehr .cmt p { margin: 6px 0 0; font-size: 0.875rem; line-height: 1.7; white-space: pre-wrap; }
        .ehr .cmt .cx { position: absolute; top: 6px; right: 8px; border: 0; background: none; font-size: 1.25rem; color: var(--sub-text); cursor: pointer; }
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
        .ehr .ord tr.dcr input { text-decoration: line-through; color: #94a3b8; }
        .ehr .ro { font-size: 12px; color: #b45309; padding: 4px; display: block; }
        .ehr .cw { background: #7f1d1d; color: #fee2e2; font-weight: 700; font-size: 13px; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
        .ehr .chk { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; font-size: 14px; }
        .ehr .chk label { display: flex; gap: 8px; align-items: center; }
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
        .ehr .nl select { flex: 1; min-width: 0; padding: 4px; font-size: 13px; border: 0; border-bottom: 1px dashed #d5dae0; background: transparent; }
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
        .ehr .mi > button, .ehr .wardSel > button { white-space: nowrap; }
        @media (max-width: 860px) {
          .ehr .bar { flex-wrap: wrap; }
          .ehr .bar .ttl { order: 1; flex: 1 1 100%; }
          .ehr .top { flex-wrap: wrap; }
          .ehr .nav { flex: 1 1 100%; }
          .ehr .body { grid-template-columns: 1fr; }
          .ehr .side { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; }
          .ehr .brand { grid-column: 1 / -1; padding-bottom: 6px; }
          .ehr .alg, .ehr .dcb, .ehr .ed { grid-column: 1 / -1; }
          .ehr .nl { grid-template-columns: 1fr; }
          .ehr .doc { padding: 12px; }
          .ehr .main { padding-bottom: calc(var(--bnav-h, 0px) + 24px); }
        }
      `}</style>
    </div>
  );
}
