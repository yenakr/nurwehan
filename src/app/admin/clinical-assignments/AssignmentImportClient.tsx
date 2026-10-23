'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TermInfo {
  term: string;
  rows: number;
  start: string | null;
  end: string | null;
}

const SAMPLE = `이름\t조\t주차\t과목\t병원\t병동\t근무
홍길동\t1\t1\t성인1\t서울\t7층\t
홍길동\t1\t3\t간호과정\t서울\t8층\t
홍길동\t1\t5\t여성_산과\t서울\t분만실\tDay
홍길동\t1\t7\t성인2\t구리\t외과 91병동\tEve`;

export default function AssignmentImportClient({ terms }: { terms: TermInfo[] }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [week1, setWeek1] = useState('');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (dryRun: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/clinical/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, week1Start: week1, text, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || '실패했어요.', details: data.details });
      } else if (dryRun) {
        setMsg({ ok: true, text: `확인 완료: ${data.students}명, ${data.weeks}주, ${data.rows}건. 저장하면 '${term}' 학기 데이터가 이 내용으로 교체돼요.` });
      } else {
        setMsg({ ok: true, text: `저장했어요. (${data.students}명, ${data.rows}건)` });
        setText('');
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: '네트워크 오류' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: string) => {
    if (!confirm(`'${t}' 학기 배정 데이터를 모두 삭제할까요?`)) return;
    await fetch('/api/admin/clinical/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: t }),
    });
    router.refresh();
  };

  const ready = term.trim() && week1 && text.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <Link href="/admin" style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>← 관리자</Link>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginTop: '6px' }}>임상실습 배정표</h1>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>등록된 학기</h2>
        {terms.length === 0 ? (
          <div style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>등록된 배정이 없어요.</div>
        ) : (
          terms.map(t => (
            <div key={t.term} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span>
                <strong>{t.term}</strong> · {t.rows}건 · {t.start} ~ {t.end}
              </span>
              <button onClick={() => remove(t.term)} className="btn-outline" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>삭제</button>
            </div>
          ))
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--sub-text)', marginTop: '10px' }}>
          마지막 실습 주가 끝나고 14일이 지나면 그 학기 데이터는 자동으로 삭제돼요.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>새 학기 배정 올리기</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
            학기
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="2027-1" style={{ padding: '6px 8px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
            1주차 시작일 (월요일)
            <input type="date" value={week1} onChange={e => setWeek1(e.target.value)} style={{ padding: '6px 8px' }} />
          </label>
        </div>

        <label style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
          표 붙여넣기 (이름 · 조 · 주차 · 과목 · 병원 · 병동 · 근무)
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={SAMPLE}
          rows={10}
          style={{ width: '100%', marginTop: '6px', fontFamily: 'monospace', fontSize: '0.8125rem', padding: '8px' }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--sub-text)', margin: '6px 0 12px' }}>
          엑셀에서 칸을 복사해 붙여넣으면 돼요. 한 사람이 한 주에 한 줄이에요. 근무는 Day / Eve / 빈칸. 같은 학기 이름으로 올리면 기존 내용이 교체돼요.
        </p>

        {msg && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.875rem',
              backgroundColor: msg.ok ? '#ECFDF5' : '#FEF2F2',
              color: msg.ok ? '#065F46' : '#991B1B',
            }}
          >
            {msg.text}
            {msg.details && (
              <ul style={{ margin: '6px 0 0 16px' }}>
                {msg.details.map(d => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-outline" disabled={!ready || busy} onClick={() => send(true)}>
            먼저 확인
          </button>
          <button className="btn-primary" disabled={!ready || busy} onClick={() => send(false)}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
