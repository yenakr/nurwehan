'use client';

import { useState, useMemo, useEffect } from 'react';
import { isAdminRole } from '@/lib/auth-core';

interface NursingTerm {
  id: string;
  subject: string;
  term: string;
  englishTerm?: string | null;
  definition: string;
  example?: string | null;
  category?: string | null;
  itemType?: string | null;
  options?: string[];
  answer?: string | null;
}

interface QuizClientProps {
  initialTerms: NursingTerm[];
  user?: any;
}

export default function QuizClient({ initialTerms, user }: QuizClientProps) {
  const isAdmin = isAdminRole(user?.role);
  const [termsList, setTermsList] = useState<NursingTerm[]>(initialTerms);

  // Passcode Lock State (1225)
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('quiz_passcode_unlocked');
      if (unlocked === 'true') {
        setIsPasscodeUnlocked(true);
      }
    }
  }, []);

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcodeInput.trim() === '1225') {
      setIsPasscodeUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('quiz_passcode_unlocked', 'true');
      }
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Navigation tab: 'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result'
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
  const [quizType, setQuizType] = useState<'def_to_term' | 'term_to_def' | 'multiple_choice'>('def_to_term');
  const [quizOrder, setQuizOrder] = useState<'shuffle' | 'normal'>('shuffle');
  const [quizCount, setQuizCount] = useState<number | 'all'>('all');

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<NursingTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  
  // Generated Multiple-Choice Options
  const [mcOptionsMap, setMcOptionsMap] = useState<Record<number, string[]>>({});

  // User answers record
  const [quizResults, setQuizResults] = useState<
    Array<{ term: NursingTerm; userAns: string; isCorrect: boolean; overrideCorrect?: boolean }>
  >([]);

  // Admin Term Modal States
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<NursingTerm | null>(null);
  const [formSubject, setFormSubject] = useState('간호관리학');
  const [formCategory, setFormCategory] = useState('퀴즈 1');
  const [formTerm, setFormTerm] = useState('');
  const [formEngTerm, setFormEngTerm] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formExample, setFormExample] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Sync termsList when initialTerms prop changes
  useEffect(() => {
    setTermsList(initialTerms);
  }, [initialTerms]);

  // Unique subjects and categories from terms
  const subjects = useMemo(() => {
    return Array.from(new Set(termsList.map(t => t.subject).filter(Boolean)));
  }, [termsList]);

  const categories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(t => t.subject === studySubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, studySubject]);

  const quizCategories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(t => t.subject === quizSubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, quizSubject]);

  // Filtered terms for study list
  const filteredStudyTerms = useMemo(() => {
    return termsList.filter(t => {
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
  }, [termsList, studySubject, studyCategory, searchTerm]);

  // Start Quiz
  const handleStartQuiz = (customTermsList?: NursingTerm[]) => {
    let pool = customTermsList || termsList.filter(t => {
      if (quizSubject !== 'all' && t.subject !== quizSubject) return false;
      if (quizCategory !== 'all' && t.category !== quizCategory) return false;
      return true;
    });

    if (pool.length === 0) {
      alert('조건에 맞는 문항이 없습니다.');
      return;
    }

    if (quizOrder === 'shuffle') {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    if (typeof quizCount === 'number' && pool.length > quizCount) {
      pool = pool.slice(0, quizCount);
    }

    const optionsMap: Record<number, string[]> = {};
    const allPossibleTerms = termsList.map(t => t.term);

    pool.forEach((q, idx) => {
      if (q.options && q.options.length > 0) {
        optionsMap[idx] = q.options;
      } else {
        const correct = q.term;
        const distractors = allPossibleTerms
          .filter(t => t !== correct)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const fourChoices = [correct, ...distractors].sort(() => Math.random() - 0.5);
        optionsMap[idx] = fourChoices;
      }
    });

    setMcOptionsMap(optionsMap);
    setQuizQuestions(pool);
    setCurrentIndex(0);
    setUserAnswer('');
    setSelectedChoiceIndex(null);
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setQuizResults([]);
    setActiveTab('quiz_play');
  };

  const currentQuestion = quizQuestions[currentIndex];

  const checkAnswerCorrectness = (input: string, term: NursingTerm) => {
    const cleanInput = input.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanInput) return false;

    if (term.answer) {
      const cleanAnswer = term.answer.trim().toLowerCase().replace(/\s+/g, '');
      if (cleanInput === cleanAnswer) return true;
    }

    const cleanKorean = term.term.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEng = term.englishTerm?.trim().toLowerCase().replace(/\s+/g, '') || '';

    if (quizType === 'def_to_term' || quizType === 'multiple_choice') {
      return cleanInput === cleanKorean || (cleanEng !== '' && cleanInput === cleanEng);
    } else {
      const keywords = term.term.split(' ');
      return cleanInput.length > 1 && keywords.some(k => cleanInput.includes(k.toLowerCase()));
    }
  };

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

  const handleSelectMultipleChoice = (choiceText: string, choiceIndex: number) => {
    if (!currentQuestion || isAnswerSubmitted) return;

    setSelectedChoiceIndex(choiceIndex);
    setUserAnswer(choiceText);

    const isCorrect = checkAnswerCorrectness(choiceText, currentQuestion);

    const resultItem = {
      term: currentQuestion,
      userAns: choiceText,
      isCorrect,
    };

    setQuizResults(prev => [...prev, resultItem]);
    setIsAnswerSubmitted(true);
  };

  const handleToggleSelfCorrection = (index: number) => {
    setQuizResults(prev => {
      const copy = [...prev];
      const target = copy[index];
      const newStatus = target.overrideCorrect !== undefined ? !target.overrideCorrect : !target.isCorrect;
      copy[index] = { ...target, overrideCorrect: newStatus };
      return copy;
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedChoiceIndex(null);
      setShowHint(false);
      setIsAnswerSubmitted(false);
    } else {
      setActiveTab('quiz_result');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTerm(null);
    setFormSubject('간호관리학');
    setFormCategory('퀴즈 1');
    setFormTerm('');
    setFormEngTerm('');
    setFormDefinition('');
    setFormExample('');
    setShowTermModal(true);
  };

  const handleOpenEditModal = (t: NursingTerm) => {
    setEditingTerm(t);
    setFormSubject(t.subject);
    setFormCategory(t.category || '퀴즈 1');
    setFormTerm(t.term);
    setFormEngTerm(t.englishTerm || '');
    setFormDefinition(t.definition);
    setFormExample(t.example || '');
    setShowTermModal(true);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm || !formDefinition) {
      alert('용어명과 뜻은 필수 입력사항입니다.');
      return;
    }
    setAdminSubmitting(true);
    try {
      if (editingTerm) {
        const res = await fetch('/api/admin/quiz/terms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTerm.id,
            subject: formSubject,
            category: formCategory,
            term: formTerm,
            englishTerm: formEngTerm,
            definition: formDefinition,
            example: formExample,
          }),
        });
        const data = await res.json();
        if (data.term) {
          setTermsList(prev => prev.map(t => (t.id === data.term.id ? data.term : t)));
          setShowTermModal(false);
        }
      } else {
        const res = await fetch('/api/admin/quiz/terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: formSubject,
            category: formCategory,
            term: formTerm,
            englishTerm: formEngTerm,
            definition: formDefinition,
            example: formExample,
          }),
        });
        const data = await res.json();
        if (data.term) {
          setTermsList(prev => [...prev, data.term]);
          setShowTermModal(false);
        }
      }
    } catch {
      alert('용어 저장 중 오류가 발생했습니다.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteTerm = async (id: string, termName: string) => {
    if (!confirm(`'${termName}' 용어를 정말 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/quiz/terms?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTermsList(prev => prev.filter(t => t.id !== id));
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const correctCount = quizResults.filter(r => (r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect)).length;
  const totalQuizCount = quizQuestions.length;
  const scorePercent = totalQuizCount > 0 ? Math.round((correctCount / totalQuizCount) * 100) : 0;
  const wrongResults = quizResults.filter(r => !(r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect));

  // PASSCODE LOCK SCREEN (1225)
  if (!isPasscodeUnlocked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '8px', letterSpacing: '1px' }}>
            QUIZ
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '24px' }}>
            비밀번호를 입력하세요.
          </p>

          <form onSubmit={handleVerifyPasscode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                setPasscodeError(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                textAlign: 'center',
                letterSpacing: '4px',
                borderColor: passcodeError ? '#EF4444' : 'var(--border)'
              }}
              autoFocus
            />
            {passcodeError && (
              <div style={{ color: '#EF4444', fontSize: '0.8125rem', fontWeight: 600 }}>
                비밀번호가 올바르지 않습니다.
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', fontWeight: 700 }}>
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header */}
      <div
        style={{
          backgroundColor: '#0E4A84',
          color: '#FFFFFF',
          borderRadius: '12px',
          padding: '18px 24px',
          boxShadow: '0 4px 12px rgba(14, 74, 132, 0.15)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '1px', margin: 0 }}>
              QUIZ
            </h1>
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
              문제 / 용어 목록
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
              퀴즈 테스트
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 용어 / 문제 목록 (Study Mode) */}
      {activeTab === 'study' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls & Filters */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Subject Tabs */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isAdmin && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    + 새 문항 추가
                  </button>
                )}

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
                  {hideDefinition ? '👁️ 정답/뜻 보이기' : '🙈 정답/뜻 가리기'}
                </button>
              </div>
            </div>

            {/* Category Sub-Filters & Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>카테고리:</span>
                <button
                  onClick={() => setStudyCategory('all')}
                  className={studyCategory === 'all' ? 'btn-accent' : 'btn-outline'}
                  style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
                >
                  전체 ({termsList.filter(t => t.subject === studySubject).length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setStudyCategory(cat)}
                    className={studyCategory === cat ? 'btn-accent' : 'btn-outline'}
                    style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
                  >
                    {cat} ({termsList.filter(t => t.subject === studySubject && t.category === cat).length})
                  </button>
                ))}
              </div>

              <div style={{ marginLeft: 'auto', flex: '1 1 200px', maxWidth: '300px' }}>
                <input
                  type="text"
                  placeholder="🔍 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          {/* Terms / Exam Questions Grid List */}
          {filteredStudyTerms.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredStudyTerms.map((t, idx) => {
                const isRevealed = revealedCardIds[t.id];
                const isHidden = hideDefinition && !isRevealed;
                const isStructuredQuestion = t.options && t.options.length > 0;

                return (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '4px solid var(--primary)',
                      padding: '18px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                          #{idx + 1}
                        </span>

                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✏️ 수정
                            </button>
                            <button
                              onClick={() => handleDeleteTerm(t.id, t.term)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🗑️ 삭제
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                        {t.term}
                      </h3>
                      {t.englishTerm && (
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sub-text)', marginBottom: '10px' }}>
                          {t.englishTerm}
                        </div>
                      )}

                      {/* Options rendering for structured multiple-choice / true-false items */}
                      {isStructuredQuestion && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          {t.options!.map((opt, oIdx) => (
                            <div key={oIdx} style={{ fontSize: '0.84rem', color: '#334155', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                              ● {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        onClick={() => {
                          if (hideDefinition) {
                            setRevealedCardIds(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                          }
                        }}
                        style={{
                          backgroundColor: isHidden ? '#F1F5F9' : (isStructuredQuestion ? '#F0FDF4' : '#F8FAFC'),
                          padding: '12px',
                          borderRadius: '6px',
                          border: `1px solid ${isHidden ? '#E2E8F0' : (isStructuredQuestion ? '#86EFAC' : '#E2E8F0')}`,
                          minHeight: '48px',
                          cursor: hideDefinition ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isHidden ? (
                          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.84rem', fontWeight: 600 }}>
                            🔒 클릭하여 정답/뜻 확인
                          </div>
                        ) : (
                          <div>
                            {t.answer && (
                              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                                정답: {t.answer}
                              </div>
                            )}
                            <p style={{ fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.5, margin: 0 }}>
                              {t.definition}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>
              검색 조건에 해당되는 항목이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 퀴즈 설정 (Quiz Setup Mode) */}
      {activeTab === 'quiz_setup' && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto', width: '100%', padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✍️</span> 퀴즈 설정
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
                2. 카테고리 선택
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setQuizCategory('all')}
                  className={quizCategory === 'all' ? 'btn-accent' : 'btn-outline'}
                  style={{ fontSize: '0.84rem', padding: '6px 12px' }}
                >
                  전체 ({termsList.filter(t => t.subject === quizSubject).length}개)
                </button>
                {quizCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuizCategory(cat)}
                    className={quizCategory === cat ? 'btn-accent' : 'btn-outline'}
                    style={{ fontSize: '0.84rem', padding: '6px 12px' }}
                  >
                    {cat} ({termsList.filter(t => t.subject === quizSubject && t.category === cat).length}개)
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Quiz Type */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                3. 문제 풀이 방식
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setQuizType('multiple_choice')}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: quizType === 'multiple_choice' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: quizType === 'multiple_choice' ? '#EFF6FF' : '#FFFFFF',
                    color: quizType === 'multiple_choice' ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>🎯 객관식 / 선택형 퀴즈</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    제시된 보기 중에서 올바른 정답을 선택합니다.
                  </div>
                </button>

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
                  <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>✍️ 주관식 단답형 퀴즈</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    질문 및 정의를 확인하고 직접 답을 작성합니다.
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Order */}
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
                  🔀 셔플
                </button>
                <button
                  type="button"
                  onClick={() => setQuizOrder('normal')}
                  className={quizOrder === 'normal' ? 'btn-primary' : 'btn-outline'}
                  style={{ flex: 1, padding: '10px', fontSize: '0.875rem' }}
                >
                  🔢 기본 순서
                </button>
              </div>
            </div>

            {/* 5. Question Count */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                5. 문제 수
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
                    {cnt === 'all' ? '전체' : `${cnt}개`}
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
              🚀 퀴즈 시작
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: 퀴즈 풀이 (Quiz Play Mode) */}
      {activeTab === 'quiz_play' && currentQuestion && (
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto', width: '100%', padding: '28px' }}>
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>
              {currentQuestion.term}
            </h3>

            {currentQuestion.englishTerm && (
              <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginTop: '6px' }}>
                ({currentQuestion.englishTerm})
              </div>
            )}
          </div>

          {/* MULTIPLE CHOICE / STRUCTURED OPTIONS VIEW */}
          {(currentQuestion.options && currentQuestion.options.length > 0) || quizType === 'multiple_choice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(mcOptionsMap[currentIndex] || currentQuestion.options || []).map((choiceText, cIdx) => {
                const isSelected = selectedChoiceIndex === cIdx;
                const targetAnswer = currentQuestion.answer || currentQuestion.term;
                const isCorrectChoice = choiceText.trim().toLowerCase() === targetAnswer.trim().toLowerCase();

                let btnBg = '#FFFFFF';
                let btnBorder = '1px solid var(--border)';
                let btnColor = 'var(--text)';

                if (isAnswerSubmitted) {
                  if (isCorrectChoice) {
                    btnBg = '#DCFCE7';
                    btnBorder = '2px solid #22C55E';
                    btnColor = '#166534';
                  } else if (isSelected && !isCorrectChoice) {
                    btnBg = '#FEE2E2';
                    btnBorder = '2px solid #EF4444';
                    btnColor = '#991B1B';
                  }
                } else if (isSelected) {
                  btnBg = '#EFF6FF';
                  btnBorder = '2px solid var(--primary)';
                  btnColor = 'var(--primary)';
                }

                return (
                  <button
                    key={cIdx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectMultipleChoice(choiceText, cIdx)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: btnBorder,
                      backgroundColor: btnBg,
                      color: btnColor,
                      fontSize: '0.9375rem',
                      fontWeight: isSelected || (isAnswerSubmitted && isCorrectChoice) ? 800 : 600,
                      textAlign: 'left',
                      cursor: isAnswerSubmitted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isAnswerSubmitted && isCorrectChoice ? '#22C55E' : isSelected ? 'var(--primary)' : '#E2E8F0',
                        color: isSelected || (isAnswerSubmitted && isCorrectChoice) ? '#FFFFFF' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {cIdx + 1}
                    </span>
                    {choiceText}
                  </button>
                );
              })}

              {isAnswerSubmitted && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#F1F5F9', padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <strong>해설/뜻:</strong> {currentQuestion.definition}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="btn-accent"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  >
                    {currentIndex + 1 < quizQuestions.length ? '다음 문제 →' : '🏆 퀴즈 결과 보기'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SUBJECTIVE MODE VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  정답 입력
                </label>
                <input
                  type="text"
                  disabled={isAnswerSubmitted}
                  placeholder="정답 입력"
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
              {!isAnswerSubmitted && (
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
                      <strong>힌트:</strong> 첫 글자: [{(currentQuestion.answer || currentQuestion.term)[0]}]{currentQuestion.englishTerm ? ` / 영문: ${currentQuestion.englishTerm}` : ''}
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
                        <strong>정식 정답:</strong> {currentQuestion.answer || currentQuestion.term}
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px', color: '#991B1B' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>❌ 오답입니다</div>
                      <div style={{ fontSize: '0.875rem', marginBottom: '6px' }}>
                        <strong>정답:</strong> <span style={{ fontWeight: 800, color: '#B91C1C' }}>{currentQuestion.answer || currentQuestion.term}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                        <strong>뜻/해설:</strong> {currentQuestion.definition}
                      </div>
                    </div>
                  )}

                  {/* Self Correction Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78125rem', color: 'var(--sub-text)' }}>채점 변경:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelfCorrection(currentIndex)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {(quizResults[currentIndex]?.overrideCorrect !== undefined
                        ? quizResults[currentIndex]?.overrideCorrect
                        : quizResults[currentIndex]?.isCorrect)
                        ? '❌ 틀림 처리'
                        : '⭕ 정답 처리'}
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
          )}
        </div>
      )}

      {/* VIEW 4: 퀴즈 결과 & 오답 노트 */}
      {activeTab === 'quiz_result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Score Summary Card */}
          <div className="card" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              🎉 퀴즈 완료!
            </h2>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: scorePercent >= 70 ? '#10B981' : '#EF4444', margin: '12px 0' }}>
              {scorePercent}점
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sub-text)' }}>
              총 {totalQuizCount}문제 중 <strong style={{ color: 'var(--primary)' }}>{correctCount}문제</strong> 정답
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('quiz_setup')}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.875rem' }}
              >
                🔄 새로운 퀴즈 설정
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
                  ✏️ 오답 {wrongResults.length}개 다시 풀기
                </button>
              )}
            </div>
          </div>

          {/* Wrong Answers Note */}
          <div className="card">
            <h3 className="section-title">
              <span>📋 퀴즈 문제 및 풀이 내역 ({quizResults.length}개)</span>
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
                      <strong>정답/해설:</strong> {res.term.answer || res.term.term} — {res.term.definition}
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

      {/* ADMIN TERM EDIT / ADD MODAL */}
      {showTermModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
              {editingTerm ? '✏️ 문항 수정' : '➕ 새 문항 추가'}
            </h3>
            <form onSubmit={handleSaveTerm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>과목 *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    placeholder="예: 여성의부인과적장애와간호"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="예: 중간고사 복습 퀴즈"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>용어/질문 *</label>
                  <input
                    type="text"
                    required
                    value={formTerm}
                    onChange={e => setFormTerm(e.target.value)}
                    placeholder="용어 또는 질문 내용"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>영문/약어</label>
                  <input
                    type="text"
                    value={formEngTerm}
                    onChange={e => setFormEngTerm(e.target.value)}
                    placeholder="영문/약어 입력"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>정답 및 해설 *</label>
                <textarea
                  rows={4}
                  required
                  value={formDefinition}
                  onChange={e => setFormDefinition(e.target.value)}
                  placeholder="정답 및 상세 해설 작성"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={adminSubmitting}
                >
                  {adminSubmitting ? '저장 중...' : '저장 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
