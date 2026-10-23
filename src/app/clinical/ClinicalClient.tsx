'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MySchedule, { type ScheduleItem } from './MySchedule';

interface ClinicalClientProps {
  schedule: ScheduleItem[];
  user: any;
}

type Tab = 'mine' | 'prep' | 'after';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mine', label: '내 실습' },
  { id: 'prep', label: '준비 체크' },
  { id: 'after', label: '실습 후' },
];

const CHECKLIST = [
  { id: 'docs', title: '건강요건 서류', desc: '항체검사 결과지, 예방접종 증명서, 결핵검사 결과지' },
  { id: 'ot', title: '실습 OT·서약서', desc: '오리엔테이션 일정과 제출 서류 확인' },
  { id: 'gear', title: '실습복·준비물', desc: '실습복, 실습화, 펜라이트, 청진기, 수첩' },
  { id: 'study', title: '병동 사전학습', desc: '실습 병동의 주요 질환, 의학용어, 약물' },
];

const STORAGE_KEY = 'clinical-prep-checks';

export default function ClinicalClient({ schedule, user }: ClinicalClientProps) {
  const [tab, setTab] = useState<Tab>('mine');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '14px' }}>
          임상실습
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={tab === t.id ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '0.875rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mine' && (user ? <MySchedule schedule={schedule} /> : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 내 실습 일정을 볼 수 있어요.
        </div>
      ))}

      {tab === 'prep' && (
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '12px' }}>실습 전 체크</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {CHECKLIST.map(item => (
              <label
                key={item.id}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <input type="checkbox" checked={!!checked[item.id]} onChange={() => toggle(item.id)} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
                <span>
                  <span style={{ display: 'block', fontWeight: 700, textDecoration: checked[item.id] ? 'line-through' : 'none', opacity: checked[item.id] ? 0.6 : 1 }}>
                    {item.title}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{item.desc}</span>
                </span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--sub-text)', marginTop: '8px' }}>체크 상태는 이 기기에만 저장돼요.</p>
        </div>
      )}

      {tab === 'after' && (
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '6px' }}>실습 후 연습</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
            부족했던 술기는 OPEN LAB에서 바로 신청해 연습하세요.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/open-lab" className="btn-accent" style={{ flex: '1 1 180px', textAlign: 'center' }}>
              OPEN LAB 신청
            </Link>
            <Link href="/usage-logs/new" className="btn-outline" style={{ flex: '1 1 180px', textAlign: 'center' }}>
              사용일지 작성
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
