'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface NursingTerm {
  id: string;
  subject: string;
  term: string;
  englishTerm?: string | null;
  definition: string;
  example?: string | null;
  category?: string | null;
}

interface QuizClientProps {
  initialTerms: NursingTerm[];
}

export default function QuizClient({ initialTerms }: QuizClientProps) {
  // Navigation tab: 'study' (용어 목록) vs 'quiz_setup' (퀴즈 설정) vs 'quiz_play' (퀴즈 풀이) vs 'quiz_result' (결과/오답노트)
  const [activeTab, setActiveTab] = useState<'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result'>('study');

  // Term filters for Study Mode
  const [studySubject, setStudySubject] = useState<string>('간호관리학');
  const [studyCategory, setStudyCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hideDefinition, setHideDefinition] = useState<boolean>(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});

  // Quiz Setup States
  const [quizSubject, setQuizSubject] = useState<string>('간호관리학');
  const [quizCategory, setQuizCategory] = useState<string>('all');
  const [quizType, setQuizType] = useState<'def_to_term' | 'term_to_def'>('def_to_term'); // Default: 뜻 보고 용어 쓰기
  const [quizOrder, setQuizOrder] = useState<'shuffle' | 'normal'>('shuffle'); // Default: 셔플 순서
  const [quizCount, setQuizCount] = useState<number | 'all'>(10);

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<NursingTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  
  // User answers record: Array of { term: NursingTerm, userAns: string, isCorrect: boolean }
  const [quizResults, setQuizResults] = useState<
    Array<{ term: NursingTerm; userAns: string; isCorrect: boolean; overrideCorrect?: boolean }>
  >([]);

  // Unique subjects and categories from terms
  const subjects = useMemo(() => {
    return Array.from(new Set(initialTerms.map(t => t.subject).filter(Boolean)));
  }, [initialTerms]);

  const categories = useMemo(() => {
    const targetSubjectTerms = initialTerms.filter(t => t.subject === studySubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [initialTerms, studySubject]);

  const quizCategories = useMemo(() => {
    const targetSubjectTerms = initialTerms.filter(t => t.subject === quizSubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [initialTerms, quizSubject]);

  // Filtered terms for study list
  const filteredStudyTerms = useMemo(() => {
    return initialTerms.filter(t => {
      if (studySubject !== 'all' && t.subject !== studySubject) return false;
      if (studyCategory !== 'all' && t.category !== studyCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const termMatch = t.term.toLowerCase().includes(q);
        const engMatch = t.englishTerm?.toLowerCase().includes(q);
        const defMatch = t.definition.toLowerCase().includes(q);
        if (!termMatch && !engMatch && !defMatch) return false;
      }
      return true;
    });
  }, [initialTerms, studySubject, studyCategory, searchTerm]);

  // Start Quiz
  const handleStartQuiz = (customTermsList?: NursingTerm[]) => {
    let pool = customTermsList || initialTerms.filter(t => {
      if (quizSubject !== 'all' && t.subject !== quizSubject) return false;
      if (quizCategory !== 'all' && t.category !== quizCategory) return false;
      return true;
    });

    if (pool.length === 0) {
      alert('조건에 맞는 용어가 없습니다. 다른 카테고리를 선택해 주세요.');
      return;
    }

    // Shuffle if selected
    if (quizOrder === 'shuffle') {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    // Limit count
    if (typeof quizCount === 'number' && pool.length > quizCount) {
      pool = pool.slice(0, quizCount);
    }

    setQuizQuestions(pool);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setQuizResults([]);
    setActiveTab('quiz_play');
  };

  // Current Question
  const currentQuestion = quizQuestions[currentIndex];

  // Answer Evaluation Helper
  const checkAnswerCorrectness = (input: string, term: NursingTerm) => {
    const cleanInput = input.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanInput) return false;

    const cleanKorean = term.term.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEng = term.englishTerm?.trim().toLowerCase().replace(/\s+/g, '') || '';

    if (quizType === 'def_to_term') {
      // User must write term (Korean or English)
      return cleanInput === cleanKorean || (cleanEng !== '' && cleanInput === cleanEng);
    } else {
      // Term to definition: Check key words in definition
      const keywords = term.term.split(' ');
      return cleanInput.length > 1 && keywords.some(k => cleanInput.includes(k.toLowerCase()));
    }
  };

  // Submit Answer for current question
  const handleSubmitAnswer = () => {
    if (!currentQuestion || isAnswerSubmitted) return;

    const isCorrect = checkAnswerCorrectness(userAnswer, currentQuestion);

    const resultItem = {
      term: currentQuestion,
      userAns: userAnswer,
      isCorrect,
    };

    setQuizResults(prev => [...prev, resultItem]);
    setIsAnswerSubmitted(true);
  };

  // Toggle Self Correction
  const handleToggleSelfCorrection = (index: number) => {
    setQuizResults(prev => {
      const copy = [...prev];
      const target = copy[index];
      const newStatus = target.overrideCorrect !== undefined ? !target.overrideCorrect : !target.isCorrect;
      copy[index] = { ...target, overrideCorrect: newStatus };
      return copy;
    });
  };

  // Next Question
  const handleNextQuestion = () => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setShowHint(false);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz Finished!
      setActiveTab('quiz_result');
    }
  };

  // Calculate final score
  const correctCount = quizResults.filter(r => (r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect)).length;
  const totalQuizCount = quizQuestions.length;
  const scorePercent = totalQuizCount > 0 ? Math.round((correctCount / totalQuizCount) * 100) : 0;
  const wrongResults = quizResults.filter(r => !(r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#0E4A84',
          color: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px 20px',
          boxShadow: '0 4px 12px rgba(14, 74, 132, 0.15)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.85, marginBottom: '4px' }}>
              한양대학교 간호대학 전학년 전공용어 암기 센터
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
              📚 간호학 핵심 용어 & 퀴즈 학습
            </h1>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              간호관리학 등 주요 전공 과목의 필수 용어를 목록으로 암기하고 실전 퀴즈로 바로 점검하세요.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('study')}
              className={activeTab === 'study' ? 'btn-accent' : 'btn-outline'}
              style={{
                backgroundColor: activeTab === 'study' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeTab === 'study' ? '#0E4A84' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              📖 용어 목록 (암기)
            </button>
            <button
              onClick={() => setActiveTab('quiz_setup')}
              className={activeTab !== 'study' ? 'btn-accent' : 'btn-outline'}
              style={{
                backgroundColor: activeTab !== 'study' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeTab !== 'study' ? '#0E4A84' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              ✍️ 퀴즈 테스트 모드
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 용어 목록 (Study Mode) */}
      {activeTab === 'study' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls & Filters */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Subject Tabs */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--sub-text)' }}>과목:</span>
                {subjects.map(subj => (
                  <button
                    key={subj}
                    onClick={() => {
                      setStudySubject(subj);
                      setStudyCategory('all');
                    }}
                    className={studySubject === subj ? 'btn-primary' : 'btn-outline'}
                    style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              {/* Hide Definition Toggle */}
              <button
                onClick={() => setHideDefinition(!hideDefinition)}
                className="btn-outline"
                style={{
                  fontSize: '0.8125rem',
                  backgroundColor: hideDefinition ? '#FEF3C7' : '#FFFFFF',
                  color: hideDefinition ? '#92400E' : 'var(--text)',
                  borderColor: hideDefinition ? '#F59E0B' : 'var(--border)',
                }}
              >
                {hideDefinition ? '👁️ 뜻 전체 보이기' : '🙈 뜻 가리기 (암기 연습)'}
              </button>
            </div>

            {/* Category Sub-Filters & Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>단원:</span>
                <button
                  onClick={() => setStudyCategory('all')}
                  className={studyCategory === 'all' ? 'btn-accent' : 'btn-outline'}
                  style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
                >
                  전체 ({initialTerms.filter(t => t.subject === studySubject).length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setStudyCategory(cat)}
                    className={studyCategory === cat ? 'btn-accent' : 'btn-outline'}
                    style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
                  >
                    {cat} ({initialTerms.filter(t => t.subject === studySubject && t.category === cat).length})
                  </button>
                ))}
              </div>

              <div style={{ marginLeft: 'auto', flex: '1 1 200px', maxWidth: '300px' }}>
                <input
                  type="text"
                  placeholder="🔍 용어, 영문, 뜻 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          {/* Terms Grid List */}
          {filteredStudyTerms.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredStudyTerms.map((t, idx) => {
                const isRevealed = revealedCardIds[t.id];
                const isHidden = hideDefinition && !isRevealed;

                return (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '4px solid var(--primary)',
                      padding: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '0.75rem' }}>
                          {t.category || t.subject}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
                          #{idx + 1}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                        {t.term}
                      </h3>
                      {t.englishTerm && (
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sub-text)', marginBottom: '10px' }}>
                          {t.englishTerm}
                        </div>
                      )}

                      <div
                        onClick={() => {
                          if (hideDefinition) {
                            setRevealedCardIds(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                          }
                        }}
                        style={{
                          backgroundColor: isHidden ? '#F1F5F9' : '#F8FAFC',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          minHeight: '60px',
                          cursor: hideDefinition ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isHidden ? (
                          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.84rem', fontWeight: 600 }}>
                            🔒 클릭하여 뜻 확인하기
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.5, margin: 0 }}>
                            {t.definition}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>
              검색 조건에 해당되는 용어가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 퀴즈 설정 (Quiz Setup Mode) */}
      {activeTab === 'quiz_setup' && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto', width: '100%', padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✍️</span> 퀴즈 테스트 모드 설정
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Subject */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                1. 과목 선택
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {subjects.map(subj => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setQuizSubject(subj);
                      setQuizCategory('all');
                    }}
                    className={quizSubject === subj ? 'btn-primary' : 'btn-outline'}
                    style={{ fontSize: '0.875rem', padding: '8px 16px' }}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Category */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                2. 세부 단원 선택
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setQuizCategory('all')}
                  className={quizCategory === 'all' ? 'btn-accent' : 'btn-outline'}
                  style={{ fontSize: '0.84rem', padding: '6px 12px' }}
                >
                  전체 단원 ({initialTerms.filter(t => t.subject === quizSubject).length}개)
                </button>
                {quizCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuizCategory(cat)}
                    className={quizCategory === cat ? 'btn-accent' : 'btn-outline'}
                    style={{ fontSize: '0.84rem', padding: '6px 12px' }}
                  >
                    {cat} ({initialTerms.filter(t => t.subject === quizSubject && t.category === cat).length}개)
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Quiz Type (Urgent: 뜻 보고 용어 쓰기) */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                3. 문제 유형 선택
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setQuizType('def_to_term')}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: quizType === 'def_to_term' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: quizType === 'def_to_term' ? '#EFF6FF' : '#FFFFFF',
                    color: quizType === 'def_to_term' ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>✍️ 뜻 보고 용어 쓰기</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    정의/설명을 보고 한글 용어 또는 영문명을 입력합니다.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizType('term_to_def')}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: quizType === 'term_to_def' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: quizType === 'term_to_def' ? '#EFF6FF' : '#FFFFFF',
                    color: quizType === 'term_to_def' ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>📖 용어 보고 뜻 설명하기</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    용어가 제시되면 핵심 의미와 개념을 작성합니다.
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Question Order (Shuffle / Normal) */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                4. 출제 순서
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setQuizOrder('shuffle')}
                  className={quizOrder === 'shuffle' ? 'btn-primary' : 'btn-outline'}
                  style={{ flex: 1, padding: '10px', fontSize: '0.875rem' }}
                >
                  🔀 셔플 (랜덤 섞기)
                </button>
                <button
                  type="button"
                  onClick={() => setQuizOrder('normal')}
                  className={quizOrder === 'normal' ? 'btn-primary' : 'btn-outline'}
                  style={{ flex: 1, padding: '10px', fontSize: '0.875rem' }}
                >
                  🔢 기본 순서대로
                </button>
              </div>
            </div>

            {/* 5. Question Count */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                5. 문제 수 설정
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[5, 10, 20, 'all'].map(cnt => (
                  <button
                    key={String(cnt)}
                    type="button"
                    onClick={() => setQuizCount(cnt as any)}
                    className={quizCount === cnt ? 'btn-accent' : 'btn-outline'}
                    style={{ flex: 1, padding: '10px 4px', fontSize: '0.84rem' }}
                  >
                    {cnt === 'all' ? '전체 (All)' : `${cnt}문제`}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => handleStartQuiz()}
              className="btn-accent"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.0625rem',
                fontWeight: 800,
                marginTop: '12px',
                textAlign: 'center',
              }}
            >
              🚀 퀴즈 풀이 시작하기
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: 퀴즈 풀이 (Quiz Play Mode) */}
      {activeTab === 'quiz_play' && currentQuestion && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '28px' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '0.8125rem' }}>
              {currentQuestion.subject} • {currentQuestion.category}
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)' }}>
              문제 {currentIndex + 1} / {quizQuestions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
            <div
              style={{
                width: `${((currentIndex + 1) / quizQuestions.length) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Question Box */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '10px', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
              {quizType === 'def_to_term' ? '다음 뜻/정의에 해당하는 간호 용어를 입력하세요:' : '다음 용어의 정확한 뜻을 설명하세요:'}
            </div>

            <h3 style={{ fontSize: quizType === 'def_to_term' ? '1.0625rem' : '1.375rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>
              {quizType === 'def_to_term' ? currentQuestion.definition : currentQuestion.term}
            </h3>

            {quizType === 'term_to_def' && currentQuestion.englishTerm && (
              <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginTop: '4px' }}>
                ({currentQuestion.englishTerm})
              </div>
            )}
          </div>

          {/* Answer Input Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                정답 입력 {quizType === 'def_to_term' ? '(한글 단어 또는 영문/약어)' : '(핵심 내용 서술)'}:
              </label>
              <input
                type="text"
                disabled={isAnswerSubmitted}
                placeholder={quizType === 'def_to_term' ? '예: 기획 또는 POSDCORB' : '용어의 뜻을 입력하세요.'}
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !isAnswerSubmitted && userAnswer.trim()) {
                    handleSubmitAnswer();
                  }
                }}
                style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              />
            </div>

            {/* Hint Section */}
            {quizType === 'def_to_term' && !isAnswerSubmitted && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  style={{ background: 'none', border: 'none', color: 'var(--sub-text)', fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {showHint ? '🔒 힌트 닫기' : '💡 힌트 보기'}
                </button>
                {showHint && (
                  <div style={{ fontSize: '0.8125rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '8px 12px', borderRadius: '6px', marginTop: '6px', border: '1px solid #A7F3D0' }}>
                    <strong>힌트:</strong> 첫 글자: [{currentQuestion.term[0]}]{currentQuestion.englishTerm ? ` / 영문: ${currentQuestion.englishTerm}` : ''}
                  </div>
                )}
              </div>
            )}

            {/* Answer Feedback after submit */}
            {isAnswerSubmitted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {checkAnswerCorrectness(userAnswer, currentQuestion) ? (
                  <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '16px', borderRadius: '8px', color: '#166534' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>🎉 정답입니다!</div>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>정식 용어:</strong> {currentQuestion.term} {currentQuestion.englishTerm && `(${currentQuestion.englishTerm})`}
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px', color: '#991B1B' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>❌ 오답입니다</div>
                    <div style={{ fontSize: '0.875rem', marginBottom: '6px' }}>
                      <strong>정답:</strong> <span style={{ fontWeight: 800, color: '#B91C1C' }}>{currentQuestion.term}</span> {currentQuestion.englishTerm && `(${currentQuestion.englishTerm})`}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                      <strong>뜻:</strong> {currentQuestion.definition}
                    </div>
                  </div>
                )}

                {/* Self Correction Toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78125rem', color: 'var(--sub-text)' }}>채점 자동 인정 변경:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelfCorrection(currentIndex)}
                    className="btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {(quizResults[currentIndex]?.overrideCorrect !== undefined
                      ? quizResults[currentIndex]?.overrideCorrect
                      : quizResults[currentIndex]?.isCorrect)
                      ? '❌ 틀림 처리로 변경'
                      : '⭕ 정답으로 변경'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                >
                  제출 및 정답 확인
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="btn-accent"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                >
                  {currentIndex + 1 < quizQuestions.length ? '다음 문제 →' : '🏆 퀴즈 결과 보기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: 퀴즈 결과 & 오답 노트 (Quiz Result & Wrong Answers Review) */}
      {activeTab === 'quiz_result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Score Summary Card */}
          <div className="card" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              🎉 퀴즈 테스트 완료!
            </h2>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: scorePercent >= 70 ? '#10B981' : '#EF4444', margin: '12px 0' }}>
              {scorePercent}점
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sub-text)' }}>
              총 {totalQuizCount}문제 중 <strong style={{ color: 'var(--primary)' }}>{correctCount}문제</strong> 정답입니다.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('quiz_setup')}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.875rem' }}
              >
                🔄 새로운 퀴즈 설정하기
              </button>
              {wrongResults.length > 0 && (
                <button
                  onClick={() => {
                    const wrongTerms = wrongResults.map(w => w.term);
                    handleStartQuiz(wrongTerms);
                  }}
                  className="btn-accent"
                  style={{ padding: '10px 20px', fontSize: '0.875rem' }}
                >
                  ✏️ 오답 {wrongResults.length}개만 다시 풀어보기
                </button>
              )}
            </div>
          </div>

          {/* Wrong Answers Note (오답 정리) */}
          <div className="card">
            <h3 className="section-title">
              <span>📋 퀴즈 문제 오답노트 및 풀이 내역 ({quizResults.length}개)</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quizResults.map((res, idx) => {
                const finalCorrect = res.overrideCorrect !== undefined ? res.overrideCorrect : res.isCorrect;

                return (
                  <div
                    key={res.term.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${finalCorrect ? '#86EFAC' : '#FCA5A5'}`,
                      backgroundColor: finalCorrect ? '#F0FDF4' : '#FEF2F2',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: finalCorrect ? '#166534' : '#991B1B' }}>
                          #{idx + 1} {finalCorrect ? '⭕ 정답' : '❌ 오답'}
                        </span>
                        <span className="badge" style={{ backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.75rem' }}>
                          {res.term.category || res.term.subject}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleSelfCorrection(idx)}
                        style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--sub-text)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {finalCorrect ? '틀림으로 변경' : '정답으로 변경'}
                      </button>
                    </div>

                    <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                      {res.term.term} {res.term.englishTerm && `(${res.term.englishTerm})`}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '10px', lineHeight: 1.5 }}>
                      <strong>뜻:</strong> {res.term.definition}
                    </p>

                    <div style={{ fontSize: '0.8125rem', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <strong>내 작성 답안:</strong> {res.userAns || '(미입력)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
