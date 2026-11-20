'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { ScheduleItem } from './MySchedule';
import { LEVELS, SUBJECTS, type Store } from './practicum-data';

export interface Note {
  id: string;
  date: string;
  ward: string;
  content: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const label = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${m}/${d}(${WD[new Date(y, m - 1, d).getDay()]})`;
};
const MAX = 3000;

// AI 답변의 **강조**를 남색 굵은 글씨로 보여 준다
const Rich = ({ text }: { text: string }) => (
  <>
    {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i} style={{ color: 'var(--primary)', fontWeight: 800 }}>{part}</b> : part.replace(/\*\*/g, '')))}
  </>
);

const addDay = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

export default function ClinicalNotes({
  progress,
  schedule,
  notes,
  setNotes,
  unavailable,
  targetDate,
}: {
  progress: Record<string, Store>;
  schedule: ScheduleItem[];
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  unavailable: boolean;
  targetDate?: string;
}) {
  // 실습 평일 목록 (배정된 주의 월~금)
  const practiceDays = useMemo(() => {
    const days: string[] = [];
    schedule.forEach(s => {
      for (let i = 0; i < 5; i++) days.push(addDay(s.startDate, i));
    });
    return Array.from(new Set(days)).sort();
  }, [schedule]);

  const [date, setDate] = useState(() => {
    if (targetDate) return targetDate;
    const t = todayStr();
    if (!practiceDays.length || practiceDays.includes(t)) return t;
    // 오늘이 실습일이 아니면 가장 가까운 다음 실습일(없으면 마지막 실습일)
    return practiceDays.find(d => d > t) ?? practiceDays[practiceDays.length - 1];
  });
  const [wardInput, setWardInput] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (targetDate) setDate(targetDate);
  }, [targetDate]);

  // 그 날짜의 내 배정 병동 (없으면 직접 입력)
  const scheduled = useMemo(() => {
    const it = schedule.find(s => s.startDate <= date && date <= s.endDate);
    return it ? `${it.hospital} ${it.ward}` : '';
  }, [schedule, date]);
  const ward = scheduled || wardInput.trim();

  // 날짜/병동이 바뀌면 저장된 내용을 불러온다
  useEffect(() => {
    const found = notes.find(n => n.date === date && n.ward === ward);
    setContent(found?.content ?? '');
    setStatus('idle');
  }, [date, ward, notes]);

  // 이날 체크리스트에 기록한 항목
  const checked = useMemo(() => {
    const out: { l: string; t: string; a: string[] }[] = [];
    SUBJECTS.forEach(sub =>
      sub.groups.forEach(g =>
        g.items.forEach(it => {
          (progress[sub.key]?.r?.[it.id] || []).forEach(r => {
            const l = LEVELS.find(x => x.k === r.l)?.label ?? '';
            if (r.d !== date) return;
            const ans = [r.a, r.b].filter((x): x is string => !!x);
            const hit = out.find(o => o.l === l && o.t === it.t);
            if (hit) ans.forEach(x => { if (!hit.a.includes(x)) hit.a.push(x); });
            else out.push({ l, t: it.t, a: ans });
          });
        })
      )
    );
    return out;
  }, [progress, date]);
  // 이날 체크리스트 기록을 시간순으로(질문 답변·AI 답장 포함)
  const entries = useMemo(() => {
    const out: { id: string; h: string; label: string; t: string; m?: string; a?: string; f?: string; b?: string; g?: string }[] = [];
    SUBJECTS.forEach(sub =>
      sub.groups.forEach(g =>
        g.items.forEach(it => {
          (progress[sub.key]?.r?.[it.id] || []).forEach(r => {
            if (r.d !== date) return;
            out.push({ id: r.id, h: r.h || '', label: LEVELS.find(x => x.k === r.l)?.label ?? '', t: it.t, m: r.m, a: r.a, f: r.f, b: r.b, g: r.g });
          });
        })
      )
    );
    return out.sort((x, y) => (x.h || '99:99').localeCompare(y.h || '99:99'));
  }, [progress, date]);
  const [openE, setOpenE] = useState<Set<string>>(new Set());
  const insertOne = (e: (typeof entries)[number]) => {
    const line = [`${e.label}: ${e.t}${e.m ? ` - ${e.m}` : ''}`, ...(e.a ? [`  내 답: ${e.a}`] : []), ...(e.b ? [`  내 답: ${e.b}`] : [])].join('\n');
    setContent(c => `${c}${c && !c.endsWith('\n') ? '\n' : ''}${line}\n`.slice(0, MAX));
  };
  // 이날 기록으로 메모 초안을 만든다: 한 것 / 배운 점(내가 쓴 답) / 궁금한 점. 이미 메모에 있는 항목은 제외
  const missing = checked.filter(c => !content.includes(c.t));
  const insert = () => {
    const doing = LEVELS.map(l => {
      const names = missing.filter(c => c.l === l.label).map(c => c.t);
      return names.length ? `${l.label}: ${names.join(', ')}` : '';
    }).filter(Boolean);
    const learned = missing.filter(c => c.a.length).map(c => `${c.t} - ${c.a.join(' / ')}`);
    const draft = ['[한 것]', ...doing, ...(learned.length ? ['', '[배운 점]', ...learned] : []), '', '[궁금한 점]', ''].join('\n');
    setContent(c => `${c}${c && !c.endsWith('\n') ? '\n\n' : ''}${draft}`.slice(0, MAX));
  };

  const save = async () => {
    if (!ward) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/clinical/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ward, content }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(prev => {
        const rest = prev.filter(n => !(n.date === date && n.ward === ward));
        if (data.deleted) return rest;
        return [{ id: `${date}-${ward}`, date, ward, content: content.trim() }, ...rest].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  const step = (dir: 1 | -1) => {
    if (practiceDays.length) {
      const next = dir === 1 ? practiceDays.find(d => d > date) : [...practiceDays].reverse().find(d => d < date);
      if (next) setDate(next);
    } else {
      setDate(addDay(date, dir));
    }
  };
  const hasPrev = practiceDays.length ? practiceDays.some(d => d < date) : true;
  const hasNext = practiceDays.length ? practiceDays.some(d => d > date) : true;

  const open = (n: Note) => {
    setDate(n.date);
    const inSchedule = schedule.some(s => s.startDate <= n.date && n.date <= s.endDate && `${s.hospital} ${s.ward}` === n.ward);
    if (!inSchedule) setWardInput(n.ward);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {unavailable && (
        <div className="card" style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>
          메모 저장소가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button className="btn-outline" onClick={() => step(-1)} disabled={!hasPrev} aria-label="이전 실습일" style={{ padding: '4px 12px' }}>
            ‹
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value || todayStr())} style={{ padding: '6px 8px' }} />
          <button className="btn-outline" onClick={() => step(1)} disabled={!hasNext} aria-label="다음 실습일" style={{ padding: '4px 12px' }}>
            ›
          </button>
          {scheduled ? (
            <span style={{ fontWeight: 700 }}>{scheduled}</span>
          ) : practiceDays.length === 0 ? (
            <input
              value={wardInput}
              onChange={e => setWardInput(e.target.value)}
              placeholder="병동 (예: 서울 7층)"
              style={{ padding: '6px 8px', flex: '1 1 160px' }}
            />
          ) : null}
        </div>
        {entries.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <b>이날 체크리스트</b>
              <button className="btn-outline" onClick={insert} disabled={!missing.length} style={{ padding: '3px 10px', fontSize: '0.75rem' }}>전체 메모에 넣기</button>
            </div>
            {entries.map(e => {
              const more = !!(e.a || e.f || e.b || e.g);
              const open = openE.has(e.id);
              return (
                <div key={e.id} style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: 'var(--sub-text)', minWidth: 38, fontVariantNumeric: 'tabular-nums' }}>{e.h || '--:--'}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{e.label}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{e.t}</span>
                    {more && (
                      <button type="button" onClick={() => setOpenE(p => { const n = new Set(p); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })} style={{ border: 0, background: 'none', color: 'var(--sub-text)', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 4px' }}>{open ? '접기' : '대화'}</button>
                    )}
                    <button type="button" onClick={() => insertOne(e)} style={{ border: 0, background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '2px 4px' }}>넣기</button>
                  </div>
                  {e.m && <div style={{ marginLeft: 46, marginTop: 2, lineHeight: 1.5 }}>{e.m}</div>}
                  {open && (
                    <div style={{ marginLeft: 46, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.55 }}>
                      {e.a && <div><span style={{ color: 'var(--sub-text)' }}>내 답 </span>{e.a}</div>}
                      {e.f && <div><span style={{ color: 'var(--sub-text)' }}>AI </span><Rich text={e.f} /></div>}
                      {e.b && <div><span style={{ color: 'var(--sub-text)' }}>내 답 </span>{e.b}</div>}
                      {e.g && <div><span style={{ color: 'var(--sub-text)' }}>AI </span><Rich text={e.g} /></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <textarea
          value={content}
          onChange={e => {
            setContent(e.target.value.slice(0, MAX));
            setStatus('idle');
          }}
          rows={9}
                    style={{ width: '100%', padding: '10px', fontSize: '0.9375rem', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
            {content.length}/{MAX}
            {status === 'saved' && ' · 저장됨'}
            {status === 'error' && ' · 저장 실패'}
          </span>
          <button className="btn-primary" onClick={save} disabled={!ward || status === 'saving'}>
            {status === 'saving' ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px' }}>지난 메모</h3>
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => open(n)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderTop: '1px solid var(--border)',
                padding: '10px 0',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                {label(n.date)} · {n.ward}
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--sub-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.content}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
