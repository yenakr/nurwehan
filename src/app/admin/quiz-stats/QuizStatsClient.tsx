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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
              📊 퀴즈 학습 현황 (관리자 전용)
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              학생들의 퀴즈 응시 이력, 과목별 정답률 및 학년별 학습 상태를 한눈에 파악합니다.
            </p>
          </div>
          <Link href="/admin" className="btn-outline" style={{ fontSize: '0.875rem' }}>
            ← 관리자 메인으로
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)', marginBottom: '4px' }}>
            총 퀴즈 풀이 수
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
            {data.totalAttempts}회
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #10B981' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)', marginBottom: '4px' }}>
            학습 참여 학생 수
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>
            {data.activeStudentsCount}명
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #F59E0B' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)', marginBottom: '4px' }}>
            전체 평균 정답률
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>
            {data.overallAvgScore}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'btn-primary' : 'btn-outline'}
            style={{ fontSize: '0.875rem', fontWeight: 700 }}
          >
            👨‍🎓 학생별 응시 현황 ({data.studentStats.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={activeTab === 'subjects' ? 'btn-primary' : 'btn-outline'}
            style={{ fontSize: '0.875rem', fontWeight: 700 }}
          >
            📚 과목별 정답률 ({data.subjectStats.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={activeTab === 'recent' ? 'btn-primary' : 'btn-outline'}
            style={{ fontSize: '0.875rem', fontWeight: 700 }}
          >
            ⏱️ 최근 응시 기록 ({data.recentAttempts.length})
          </button>
        </div>

        {/* Tab 1: Student Stats */}
        {activeTab === 'students' && (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학생 정보</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학년</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>총 응시 횟수</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>평균 점수</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>최근 응시일</th>
                </tr>
              </thead>
              <tbody>
                {data.studentStats.map((st, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text)' }}>{st.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sub-text)' }}>{st.studentId}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>{st.grade ? `${st.grade}학년` : '-'}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>{st.attemptsCount}회</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          backgroundColor: st.avgScore >= 80 ? '#DCFCE7' : st.avgScore >= 60 ? '#FEF9C3' : '#FEE2E2',
                          color: st.avgScore >= 80 ? '#166534' : st.avgScore >= 60 ? '#854D0E' : '#991B1B',
                        }}
                      >
                        {st.avgScore}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                      {new Date(st.lastAttemptAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {data.studentStats.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--sub-text)' }}>
                      아직 퀴즈를 응시한 학생이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Subject Stats */}
        {activeTab === 'subjects' && (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>과목명</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>총 응시 횟수</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>평균 정답률</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>난이도 평가</th>
                </tr>
              </thead>
              <tbody>
                {data.subjectStats.map((sub, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary)' }}>{sub.subject}</td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{sub.count}회</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          backgroundColor: sub.avgScore >= 80 ? '#DCFCE7' : sub.avgScore >= 60 ? '#FEF9C3' : '#FEE2E2',
                          color: sub.avgScore >= 80 ? '#166534' : sub.avgScore >= 60 ? '#854D0E' : '#991B1B',
                        }}
                      >
                        {sub.avgScore}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.84rem' }}>
                      {sub.avgScore >= 80 ? '🟢 쉬움 / 양호' : sub.avgScore >= 60 ? '🟡 보통' : '🔴 정답률 낮음 (보충 학습 권장)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Recent Attempts */}
        {activeTab === 'recent' && (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>응시 일시</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학생 정보</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>과목 / 카테고리</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>점수 (맞은 개수)</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>상세 보기</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAttempts.map(att => (
                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                      {new Date(att.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 800 }}>{att.user.name}</span>{' '}
                      <span style={{ fontSize: '0.78rem', color: 'var(--sub-text)' }}>({att.user.studentId})</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: 700 }}>{att.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{att.category}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 800, color: att.score >= 80 ? '#166534' : '#DC2626' }}>
                        {att.score}점 ({att.correctCount}/{att.totalQuestions})
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {att.details ? (
                        <button
                          onClick={() => setSelectedAttempt(att)}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          오답/상세
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>상세없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                📝 풀이 상세 결과: {selectedAttempt.user.name} ({selectedAttempt.subject})
              </h3>
              <button onClick={() => setSelectedAttempt(null)} className="btn-outline" style={{ padding: '4px 10px' }}>
                닫기 ✕
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
