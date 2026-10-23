'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StudentStat {
  studentId: string;
  name: string;
  grade: number | null;
  attemptsCount: number;
  avgScore: number;
  lastAttemptAt: string;
}

interface SubjectStat {
  subject: string;
  count: number;
  avgScore: number;
}

interface RecentAttempt {
  id: string;
  subject: string;
  category: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  createdAt: string;
  user: {
    name: string;
    studentId: string;
    grade: number | null;
  };
  details?: any;
}

export default function QuizStatsClient() {
  const [data, setData] = useState<{
    totalAttempts: number;
    activeStudentsCount: number;
    overallAvgScore: number;
    studentStats: StudentStat[];
    subjectStats: SubjectStat[];
    recentAttempts: RecentAttempt[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'subjects' | 'recent'>('students');
  const [selectedAttempt, setSelectedAttempt] = useState<RecentAttempt | null>(null);

  useEffect(() => {
    fetch('/api/admin/quiz/stats')
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--sub-text)' }}>퀴즈 학습 현황을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#EF4444' }}>데이터를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const tone = (n: number) => (n >= 80 ? 'good' : n >= 60 ? 'mid' : 'low');
  const fmt = (d: string, full = false) =>
    new Date(d).toLocaleDateString('ko-KR', full
      ? { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
      : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="qs">
      <div className="top">
        <h1>퀴즈 학습 현황</h1>
        <Link href="/admin" className="back">← 관리자 메인</Link>
      </div>

      <div className="stats">
        <div><b>{data.totalAttempts}</b><span>총 풀이</span></div>
        <div><b>{data.activeStudentsCount}</b><span>참여 학생</span></div>
        <div><b>{data.overallAvgScore}<i>%</i></b><span>평균 정답률</span></div>
      </div>

      <div className="seg" role="tablist">
        <button className={activeTab === 'students' ? 'on' : ''} onClick={() => setActiveTab('students')}>학생별</button>
        <button className={activeTab === 'subjects' ? 'on' : ''} onClick={() => setActiveTab('subjects')}>과목별</button>
        <button className={activeTab === 'recent' ? 'on' : ''} onClick={() => setActiveTab('recent')}>최근 기록</button>
      </div>

      <div className="list">
        {activeTab === 'students' && (
          <>
            {data.studentStats.map((st, idx) => (
              <div key={idx} className="row">
                <div className="main">
                  <div className="nm">{st.name} <span>{st.studentId}</span></div>
                  <div className="sub">{st.grade ? `${st.grade}학년 · ` : ''}{st.attemptsCount}회 · 최근 {fmt(st.lastAttemptAt)}</div>
                </div>
                <span className={`pill ${tone(st.avgScore)}`}>{st.avgScore}%</span>
              </div>
            ))}
            {data.studentStats.length === 0 && <div className="empty">아직 응시한 학생이 없어요.</div>}
          </>
        )}

        {activeTab === 'subjects' && (
          <>
            {data.subjectStats.map((sub, idx) => (
              <div key={idx} className="row">
                <div className="main">
                  <div className="nm">{sub.subject}</div>
                  <div className="bar"><i className={tone(sub.avgScore)} style={{ width: `${Math.min(100, sub.avgScore)}%` }} /></div>
                  <div className="sub">{sub.count}회 응시</div>
                </div>
                <span className={`pill ${tone(sub.avgScore)}`}>{sub.avgScore}%</span>
              </div>
            ))}
            {data.subjectStats.length === 0 && <div className="empty">데이터가 없어요.</div>}
          </>
        )}

        {activeTab === 'recent' && (
          <>
            {data.recentAttempts.map(att => (
              <div key={att.id} className="row">
                <div className="main">
                  <div className="nm">{att.user.name} <span>{att.subject}{att.category ? ` · ${att.category}` : ''}</span></div>
                  <div className="sub">{fmt(att.createdAt)} · {att.correctCount}/{att.totalQuestions}</div>
                </div>
                <span className={`pill ${tone(att.score)}`}>{att.score}점</span>
                {att.details && (
                  <button className="more" onClick={() => setSelectedAttempt(att)}>상세</button>
                )}
              </div>
            ))}
            {data.recentAttempts.length === 0 && <div className="empty">기록이 없어요.</div>}
          </>
        )}
      </div>

      <style jsx>{`
        .qs { display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 0 auto; }
        .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .top h1 { font-size: 1.375rem; font-weight: 800; color: var(--text); margin: 0; }
        .back { font-size: 0.875rem; font-weight: 700; color: var(--sub-text); white-space: nowrap; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--background); border: 1px solid var(--border); border-radius: 14px; }
        .stats > div { padding: 14px 8px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .stats > div + div { border-left: 1px solid var(--border); }
        .stats b { font-size: 1.5rem; font-weight: 800; color: var(--primary); line-height: 1.2; }
        .stats b i { font-size: 0.9rem; font-style: normal; margin-left: 1px; }
        .stats span { font-size: 0.75rem; font-weight: 600; color: var(--sub-text); }
        .seg { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        .seg button { flex: 1; padding: 9px 0; border: none; background: transparent; border-radius: 9px; font-size: 0.9375rem; font-weight: 700; color: #64748b; cursor: pointer; white-space: nowrap; }
        .seg button.on { background: #fff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .list { background: var(--background); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .row { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-top: 1px solid #f1f5f9; }
        .row:first-child { border-top: none; }
        .main { flex: 1; min-width: 0; }
        .nm { font-weight: 800; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nm span { font-size: 0.8125rem; font-weight: 500; color: #94a3b8; margin-left: 4px; }
        .sub { font-size: 0.8125rem; color: #94a3b8; margin-top: 2px; }
        .bar { height: 6px; background: #f1f5f9; border-radius: 999px; margin-top: 7px; overflow: hidden; }
        .bar i { display: block; height: 100%; border-radius: 999px; }
        .bar i.good { background: #22c55e; } .bar i.mid { background: #eab308; } .bar i.low { background: #ef4444; }
        .pill { font-size: 0.875rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; flex: 0 0 auto; }
        .pill.good { background: #dcfce7; color: #166534; } .pill.mid { background: #fef9c3; color: #854d0e; } .pill.low { background: #fee2e2; color: #991b1b; }
        .more { border: 1px solid var(--border); background: transparent; color: var(--sub-text); border-radius: 8px; padding: 5px 10px; font-size: 0.8125rem; font-weight: 700; cursor: pointer; flex: 0 0 auto; }
        .empty { text-align: center; color: #94a3b8; padding: 40px 12px; }
      `}</style>

      {/* Detail Modal */}
      {selectedAttempt && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                풀이 상세: {selectedAttempt.user.name} ({selectedAttempt.subject})
              </h3>
              <button onClick={() => setSelectedAttempt(null)} className="btn-outline" style={{ padding: '4px 10px' }}>
                닫기
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
              <div><strong>점수:</strong> {selectedAttempt.score}점 (정답 {selectedAttempt.correctCount} / 오답 {selectedAttempt.wrongCount})</div>
              <div><strong>응시 일시:</strong> {new Date(selectedAttempt.createdAt).toLocaleString('ko-KR')}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.isArray(selectedAttempt.details) && selectedAttempt.details.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: item.isCorrect ? '#BBF7D0' : '#FECACA',
                    backgroundColor: item.isCorrect ? '#F0FDF4' : '#FEF2F2',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '6px' }}>
                    {idx + 1}. {item.questionText}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: item.isCorrect ? '#166534' : '#991B1B' }}>
                    <div><strong>제출한 답:</strong> {item.userAnswer || '(미응답)'}</div>
                    <div><strong>정답:</strong> {item.correctAnswer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
