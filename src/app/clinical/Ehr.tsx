'use client';

import { useEffect, useRef, useState } from 'react';
import { confirmDialog, notify } from '@/components/Dialog';
import EhrSheet, { emptyData, type EhrData, type EhrScenario } from './EhrSheet';

type Item = { id: string; title: string; status: string; reviewedAt: string | null; updatedAt: string };
type Full = { id: string; title: string; scenario: EhrScenario; data: EhrData; status: string; comment: string | null; reviewedAt: string | null };

const TOPICS = ['신경계', '호흡기', '심혈관', '소화기', '혈액·종양', '근골격계', '응급', '산과', '부인과', '내분비'];
const LEVELS = [{ k: 'easy', l: '쉬움' }, { k: 'normal', l: '보통' }, { k: 'hard', l: '어려움' }];

const AI_KEY = 'ehr:ai';

export default function Ehr() {
  const [list, setList] = useState<Item[] | null>(null);
  const [aiOn, setAiOn] = useState(true);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [level, setLevel] = useState('normal');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Full | null>(null);
  const [data, setData] = useState<EhrData>(emptyData());
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [fb, setFb] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [useFb, setUseFb] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const load = async () => {
    try {
      const r = await fetch('/api/ehr/cases');
      if (!r.ok) { setList([]); return; }
      const j = await r.json();
      setList(j.cases || []);
      setAiOn(!!j.ai);
    } catch { setList([]); }
  };

  useEffect(() => {
    load();
    try { setUseFb(localStorage.getItem(AI_KEY) !== '0'); } catch {}
  }, []);

  const toggleFb = () => {
    const v = !useFb;
    setUseFb(v);
    try { localStorage.setItem(AI_KEY, v ? '1' : '0'); } catch {}
  };

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/ehr/cases', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic, level }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        notify(r.status === 429 ? '오늘 만들 수 있는 사례 수를 다 썼어요.' : r.status === 503 ? 'AI가 꺼져 있어요.' : '사례를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        return;
      }
      await openCase(j.id);
      load();
    } finally { setBusy(false); }
  };

  const openCase = async (id: string) => {
    const r = await fetch(`/api/ehr/cases/${id}`);
    if (!r.ok) { notify('불러오지 못했어요.'); return; }
    const j = await r.json();
    setOpen(j.case);
    setData(j.case.data);
    setFb('');
    setSaved('idle');
    dirty.current = false;
  };

  const save = async (d: EhrData, id: string) => {
    setSaved('saving');
    try {
      const r = await fetch(`/api/ehr/cases/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: d }) });
      setSaved(r.ok ? 'ok' : 'err');
      if (r.ok) dirty.current = false;
    } catch { setSaved('err'); }
  };

  const change = (d: EhrData) => {
    if (!open || open.status !== 'DRAFT') return;
    setData(d);
    dirty.current = true;
    setSaved('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(d, open.id), 900);
  };

  // 나갈 때 저장 안 된 내용이 있으면 한 번 더 저장
  const close = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (open && dirty.current && open.status === 'DRAFT') await save(data, open.id);
    setOpen(null);
    load();
  };

  const submit = async () => {
    if (!open) return;
    if (!(await confirmDialog('제출하면 교수님이 볼 수 있어요. 제출할까요?'))) return;
    if (timer.current) clearTimeout(timer.current);
    await save(data, open.id);
    const r = await fetch(`/api/ehr/cases/${open.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'submit' }) });
    if (r.ok) { setOpen({ ...open, status: 'SUBMITTED' }); notify('제출했어요.'); } else notify('제출하지 못했어요.');
  };

  const reopen = async () => {
    if (!open) return;
    const r = await fetch(`/api/ehr/cases/${open.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'reopen' }) });
    if (r.ok) setOpen({ ...open, status: 'DRAFT' });
    else notify('교수님이 이미 확인한 기록은 고칠 수 없어요.');
  };

  const askFb = async () => {
    if (!open) return;
    setFbBusy(true);
    try {
      const r = await fetch(`/api/ehr/cases/${open.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'feedback', data }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setFb(j.text);
      else notify(r.status === 400 ? '간호기록이나 간호진단을 먼저 써 주세요.' : r.status === 429 ? '오늘 피드백 횟수를 다 썼어요.' : '피드백을 받지 못했어요.');
    } finally { setFbBusy(false); }
  };

  if (open) {
    const ro = open.status !== 'DRAFT';
    return (
      <div className="ep">
        <div className="eph">
          <button type="button" className="eb" onClick={close}>&lsaquo; 목록</button>
          <b>{open.title}</b>
          <span className="es">{ro ? (open.reviewedAt ? '확인 완료' : '제출됨') : saved === 'saving' ? '저장 중' : saved === 'ok' ? '저장됨' : saved === 'err' ? '저장 실패' : ''}</span>
        </div>

        <EhrSheet scenario={open.scenario} data={data} onChange={change} readOnly={ro} />

        {open.comment && (
          <div className="ecm"><b>교수님 의견</b><p>{open.comment}</p></div>
        )}

        {useFb && !ro && (
          <div className="efb">
            <button type="button" className="eai" onClick={askFb} disabled={fbBusy}>{fbBusy ? '살펴보는 중' : 'AI 피드백 받기'}</button>
            {fb && <p>{fb}</p>}
          </div>
        )}
        {fb && ro && <div className="efb"><p>{fb}</p></div>}

        <div className="eft">
          <label className="esw"><input type="checkbox" checked={useFb} onChange={toggleFb} /><span>AI 피드백 사용</span></label>
          {ro
            ? (!open.reviewedAt && <button type="button" className="eb2" onClick={reopen}>제출 취소하고 고치기</button>)
            : <button type="button" className="eb2 pri" onClick={submit}>제출하기</button>}
        </div>
        <Styles />
      </div>
    );
  }

  return (
    <div className="ep">
      <div className="enew">
        <b>새 연습 사례</b>
        <div className="chips">{TOPICS.map(t => <button key={t} type="button" className={topic === t ? 'on' : ''} onClick={() => setTopic(t)}>{t}</button>)}</div>
        <div className="chips">{LEVELS.map(l => <button key={l.k} type="button" className={level === l.k ? 'on' : ''} onClick={() => setLevel(l.k)}>{l.l}</button>)}</div>
        <button type="button" className="eb2 pri" onClick={create} disabled={busy || !aiOn}>{busy ? '사례를 만드는 중' : aiOn ? 'AI로 사례 만들기' : 'AI가 꺼져 있어요'}</button>
      </div>

      <div className="elist">
        {list === null && <p className="ehint">불러오는 중</p>}
        {list && list.length === 0 && <p className="ehint">아직 만든 사례가 없어요.</p>}
        {list?.map(c => (
          <button key={c.id} type="button" className="eitem" onClick={() => openCase(c.id)}>
            <span className="et1">{c.title}</span>
            <span className={`est ${c.status === 'SUBMITTED' ? (c.reviewedAt ? 'rv' : 'sb') : ''}`}>{c.status === 'SUBMITTED' ? (c.reviewedAt ? '확인 완료' : '제출됨') : '작성 중'}</span>
          </button>
        ))}
      </div>
      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .ep { display: flex; flex-direction: column; gap: 14px; }
      .eph { display: flex; align-items: center; gap: 10px; }
      .eph b { flex: 1; font-size: 16px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .eb { border: 0; background: none; color: var(--primary); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; padding: 4px 0; }
      .es { font-size: 12px; color: var(--sub-text); }
      .enew { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-radius: 14px; background: color-mix(in srgb, var(--primary) 7%, transparent); }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .chips button { border: 0; background: var(--white); color: var(--text); border-radius: 999px; padding: 7px 13px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
      .chips button.on { background: var(--primary); color: #fff; }
      .eb2 { border: 1px solid var(--line); background: none; color: var(--primary); border-radius: 999px; padding: 10px 18px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
      .eb2.pri { background: var(--primary); border-color: var(--primary); color: #fff; }
      .eb2:disabled { opacity: .5; cursor: default; }
      .elist { display: flex; flex-direction: column; gap: 8px; }
      .eitem { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid var(--line); background: none; color: var(--text); border-radius: 12px; padding: 14px 16px; font: inherit; text-align: left; cursor: pointer; }
      .et1 { font-weight: 700; font-size: 15px; }
      .est { font-size: 12px; font-weight: 700; color: var(--sub-text); white-space: nowrap; }
      .est.sb { color: var(--primary); }
      .est.rv { color: #2f7a46; }
      .ehint { margin: 0; text-align: center; font-size: 13px; color: var(--sub-text); padding: 18px 0; }
      .efb { border-radius: 12px; padding: 12px 14px; background: color-mix(in srgb, var(--primary) 7%, transparent); display: flex; flex-direction: column; gap: 8px; }
      .efb p { margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
      .eai { align-self: flex-start; border: 0; background: var(--primary); color: #fff; border-radius: 999px; padding: 9px 16px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
      .eai:disabled { opacity: .6; }
      .ecm { border-radius: 12px; padding: 12px 14px; border: 1px solid var(--primary); }
      .ecm b { font-size: 13px; color: var(--primary); }
      .ecm p { margin: 6px 0 0; font-size: 14px; line-height: 1.65; white-space: pre-wrap; }
      .eft { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .esw { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sub-text); cursor: pointer; }
    `}</style>
  );
}
