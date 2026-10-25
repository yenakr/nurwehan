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
  const [onlyWrong, setOnlyWrong] = useState(true);

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
                  <button className="more" onClick={() => { setSelectedAttempt(att); setOnlyWrong((att.wrongCount ?? 0) > 0); }}>상세</button>
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
        .ov { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
        .sheet { background: var(--background); border-radius: 18px; width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; padding: 20px; gap: 14px; }
        .sh-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .sh-name { font-size: 1.125rem; font-weight: 800; color: var(--text); }
        .sh-sub { font-size: 0.8125rem; color: var(--sub-text); margin-top: 2px; }
        .sh-close { border: none; background: #f1f5f9; color: var(--sub-text); border-radius: 8px; padding: 6px 12px; font-size: 0.8125rem; font-weight: 700; cursor: pointer; flex: 0 0 auto; }
        .sh-score { display: flex; align-items: baseline; gap: 10px; }
        .sh-score b { font-size: 2.25rem; font-weight: 800; line-height: 1; }
        .sh-score b i { font-size: 1rem; font-style: normal; margin-left: 2px; }
        .sh-score b.good { color: #16a34a; } .sh-score b.mid { color: #ca8a04; } .sh-score b.low { color: #dc2626; }
        .sh-score span { font-size: 0.875rem; color: var(--sub-text); }
        .seg.sm button { padding: 7px 0; font-size: 0.875rem; }
        .sh-list { overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin: 0 -4px; padding: 0 4px; }
        .qi { border-left: 3px solid; background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
        .qi.ok { border-color: #22c55e; } .qi.no { border-color: #ef4444; }
        .qi-q { font-weight: 800; font-size: 0.9375rem; color: var(--text); }
        .qi-a { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; font-size: 0.8125rem; color: var(--sub-text); line-height: 1.5; }
        .qi-a .mine { color: #dc2626; }
        .qi-a .ans { color: #15803d; font-weight: 600; }
      `}</style>

      {/* Detail Modal */}
      {selectedAttempt && (() => {
        const items: any[] = Array.isArray(selectedAttempt.details) ? selectedAttempt.details : [];
        const shown = onlyWrong ? items.filter(it => !it.isCorrect) : items;
        return (
          <div className="ov" onClick={() => setSelectedAttempt(null)}>
            <div className="sheet" onClick={e => e.stopPropagation()}>
              <div className="sh-head">
                <div>
                  <div className="sh-name">{selectedAttempt.user.name}</div>
                  <div className="sh-sub">{selectedAttempt.subject}{selectedAttempt.category ? ` · ${selectedAttempt.category}` : ''} · {fmt(selectedAttempt.createdAt, true)}</div>
                </div>
                <button className="sh-close" onClick={() => setSelectedAttempt(null)} aria-label="닫기">닫기</button>
              </div>
              <div className="sh-score">
                <b className={tone(selectedAttempt.score)}>{selectedAttempt.score}<i>점</i></b>
                <span>정답 {selectedAttempt.correctCount} · 오답 {selectedAttempt.wrongCount}</span>
              </div>
              <div className="seg sm">
                <button className={onlyWrong ? 'on' : ''} onClick={() => setOnlyWrong(true)}>오답 {items.filter(it => !it.isCorrect).length}</button>
                <button className={!onlyWrong ? 'on' : ''} onClick={() => setOnlyWrong(false)}>전체 {items.length}</button>
              </div>
              <div className="sh-list">
                {shown.map((item, idx) => (
                  <div key={idx} className={`qi ${item.isCorrect ? 'ok' : 'no'}`}>
                    <div className="qi-q">{item.questionText}</div>
                    <div className="qi-a">
                      {item.isCorrect ? (
                        <span>{item.correctAnswer}</span>
                      ) : (
                        <>
                          <span className="mine">내 답 · {item.userAnswer || '미응답'}</span>
                          <span className="ans">정답 · {item.correctAnswer}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {shown.length === 0 && <div className="empty">오답이 없어요.</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
