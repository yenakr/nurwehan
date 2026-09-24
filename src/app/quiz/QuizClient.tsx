'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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


  const [isGridEditMode, setIsGridEditMode] = useState<boolean>(false);

  // Navigation tab: 'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result' | 'my_history'
  const [activeTab, setActiveTab] = useState<'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result' | 'my_history'>('study');
  const [myAttempts, setMyAttempts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] = useState<any | null>(null);
  const [attemptSaved, setAttemptSaved] = useState<boolean>(false);

  // Term filters for Study Mode
  const [studySubject, setStudySubject] = useState<string>('간호관리학');
  const [studyCategory, setStudyCategory] = useState<string>('all');
  // Term vs Exam Quiz filter for Study Mode
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'TERM' | 'MULTIPLE_CHOICE'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hideDefinition, setHideDefinition] = useState<boolean>(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});

  // Study View Sub-Modes: 'grid' | 'flashcard' | 'typing'
  const [studyViewMode, setStudyViewMode] = useState<'flashcard' | 'typing' | 'grid'>('flashcard');

  // Flashcard Mode State
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [flashcardDirection, setFlashcardDirection] = useState<'term_first' | 'def_first'>('term_first');

  // Typing Mode State
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const [typingInput, setTypingInput] = useState<string>('');
  const [typingDefInput, setTypingDefInput] = useState<string>('');
  const [isTypingSubmitted, setIsTypingSubmitted] = useState<boolean>(false);
  const [typingCorrectCount, setTypingCorrectCount] = useState<number>(0);
  const [typingHistory, setTypingHistory] = useState<Record<number, boolean>>({});

  // TTS (Text-To-Speech) Web Speech API State & Helpers
  const [autoTTS, setAutoTTS] = useState<boolean>(true);
  const [ttsRate, setTtsRate] = useState<number>(1.0);

  // Flashcard Auto-Play State
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [autoPlayIntervalSec, setAutoPlayIntervalSec] = useState<number>(4);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    if (!text) {
      if (onEnd) onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const isEng = /^[A-Za-z0-9\s.,?!'()-]+$/.test(text.trim());
    utterance.lang = isEng ? 'en-US' : 'ko-KR';
    utterance.rate = ttsRate;
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
  }, [ttsRate]);

  // Quiz Setup States
  const [quizSubject, setQuizSubject] = useState<string>('간호관리학');
  const [quizCategory, setQuizCategory] = useState<string>('all');
  const [quizType, setQuizType] = useState<'def_to_term' | 'term_to_def' | 'multiple_choice'>('def_to_term');
  const [quizOrder, setQuizOrder] = useState<'shuffle' | 'normal'>('shuffle');
  const [quizCount, setQuizCount] = useState<number | 'all'>('all');
  const [quizFormat, setQuizFormat] = useState<'single' | 'worksheet'>('single');
  const [worksheetAnswers, setWorksheetAnswers] = useState<Record<number, string>>({});

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<NursingTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const submitTimestampRef = useRef<number>(0);
  
  // Generated Multiple-Choice Options
  const [mcOptionsMap, setMcOptionsMap] = useState<Record<number, string[]>>({});

  // User answers record
  const [quizResults, setQuizResults] = useState<
    Array<{ term: NursingTerm; userAns: string; isCorrect: boolean; overrideCorrect?: boolean }>
  >([]);

  // PDF Export Mode: 'wrong_only' | 'all'
  const [pdfExportMode, setPdfExportMode] = useState<'wrong_only' | 'all'>('wrong_only');

  // Admin Term Modal States
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<NursingTerm | null>(null);
  const [formSubject, setFormSubject] = useState('간호관리학');
  const [formCategory, setFormCategory] = useState('퀴즈 1');
  const [formItemType, setFormItemType] = useState<'TERM' | 'MULTIPLE_CHOICE'>('TERM');
  const [formTerm, setFormTerm] = useState('');
  const [formEngTerm, setFormEngTerm] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '', '']);
  const [formAnswer, setFormAnswer] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Sync termsList when initialTerms prop changes
  useEffect(() => {
    setTermsList(initialTerms);
  }, [initialTerms]);

  // Unique subjects and categories from terms
  const subjects = useMemo(() => {
    return Array.from(new Set(termsList.map(t => t.subject).filter(Boolean)));
  }, [termsList]);

  const filteredSubjects = useMemo(() => {
    if (contentTypeFilter === 'all') {
      return subjects;
    }
    return Array.from(
      new Set(
        termsList
          .filter(t => (t.itemType || 'TERM') === contentTypeFilter)
          .map(t => t.subject)
          .filter(Boolean)
      )
    );
  }, [termsList, subjects, contentTypeFilter]);

  const categories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(t => t.subject === studySubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, studySubject]);

  const quizCategories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(t => t.subject === quizSubject);
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, quizSubject]);

  const selectedQuizTerms = useMemo(() => {
    return termsList.filter(t => {
      if (quizSubject !== 'all' && t.subject !== quizSubject) return false;
      if (quizCategory !== 'all' && t.category !== quizCategory) return false;
      return true;
    });
  }, [termsList, quizSubject, quizCategory]);

  const isTargetMc = useMemo(() => {
    return selectedQuizTerms.length > 0 && selectedQuizTerms.every(t => t.itemType === 'MULTIPLE_CHOICE' || (t.options && t.options.length > 0));
  }, [selectedQuizTerms]);

  const isTargetTerm = useMemo(() => {
    return selectedQuizTerms.length > 0 && selectedQuizTerms.every(t => (t.itemType || 'TERM') === 'TERM' && (!t.options || t.options.length === 0));
  }, [selectedQuizTerms]);

  const fetchMyAttempts = useCallback(() => {
    if (!user) return;
    setLoadingHistory(true);
    fetch('/api/quiz/attempts')
      .then(res => res.json())
      .then(data => {
        if (data.attempts) setMyAttempts(data.attempts);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'my_history') {
      fetchMyAttempts();
    }
  }, [user, activeTab, fetchMyAttempts]);

  useEffect(() => {
    if (activeTab === 'quiz_result' && !attemptSaved && quizResults.length > 0 && user) {
      const correctCount = quizResults.filter(r => (r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect)).length;
      const totalQuestions = quizQuestions.length;
      const wrongCount = totalQuestions - correctCount;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const details = quizResults.map(r => ({
        termId: r.term.id,
        questionText: r.term.term,
        definition: r.term.definition,
        userAnswer: r.userAns,
        correctAnswer: r.term.answer || r.term.definition,
        isCorrect: r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect,
        options: r.term.options || [],
        fullTerm: r.term,
      }));

      fetch('/api/quiz/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: quizSubject,
          category: quizCategory,
          quizType,
          score,
          totalQuestions,
          correctCount,
          wrongCount,
          details,
        }),
      })
        .then(() => {
          setAttemptSaved(true);
          fetchMyAttempts();
        })
        .catch(err => console.error('Save attempt error', err));
    }
  }, [activeTab, attemptSaved, quizResults, quizQuestions, quizSubject, quizCategory, quizType, user, fetchMyAttempts]);

  const handleReAttemptQuiz = (attempt: any) => {
    if (!attempt || !attempt.details || !Array.isArray(attempt.details)) {
      alert('퀴즈 문제를 불러올 수 없습니다.');
      return;
    }
    const questions: NursingTerm[] = attempt.details.map((item: any) => {
      if (item.fullTerm) return item.fullTerm;
      const found = termsList.find(t => t.id === item.termId);
      if (found) return found;
      return {
        id: item.termId || Math.random().toString(),
        subject: attempt.subject,
        term: item.questionText,
        definition: item.definition || item.correctAnswer,
        options: item.options || [],
        answer: item.correctAnswer,
      };
    });

    setQuizQuestions(questions);
    setCurrentIndex(0);
    setUserAnswer('');
    setSelectedChoiceIndex(null);
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setQuizResults([]);
    setAttemptSaved(false);
    setQuizSubject(attempt.subject);
    setQuizCategory(attempt.category || 'all');
    setSelectedHistoryAttempt(null);
    setActiveTab('quiz_play');
  };

  // Filtered terms for study list
  const filteredStudyTerms = useMemo(() => {
    return termsList.filter(t => {
      const itemType = t.itemType || 'TERM';
      if (contentTypeFilter !== 'all' && itemType !== contentTypeFilter) return false;
      if (studySubject !== 'all' && t.subject !== studySubject) return false;
      if (studyCategory !== 'all' && t.category !== studyCategory) return false;

      // In Flashcard or Typing mode, automatically filter out MULTIPLE_CHOICE exam questions
      if ((studyViewMode === 'flashcard' || studyViewMode === 'typing') && contentTypeFilter === 'all') {
        if (itemType === 'MULTIPLE_CHOICE') return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const termMatch = t.term.toLowerCase().includes(q);
        const engMatch = t.englishTerm?.toLowerCase().includes(q);
        const defMatch = t.definition.toLowerCase().includes(q);
        if (!termMatch && !engMatch && !defMatch) return false;
      }
      return true;
    });
  }, [termsList, studySubject, studyCategory, contentTypeFilter, studyViewMode, searchTerm]);

  // Reset Flashcard & Typing Indices when filteredStudyTerms change
  useEffect(() => {
    setFlashcardIndex(0);
    setIsCardFlipped(false);
    setTypingIndex(0);
    setTypingInput('');
    setIsTypingSubmitted(false);
    setTypingCorrectCount(0);
    setTypingHistory({});
  }, [studySubject, studyCategory]);

  // Auto TTS effect for Typing Practice Mode
  useEffect(() => {
    if (studyViewMode === 'typing' && autoTTS && filteredStudyTerms[typingIndex]) {
      speakText(filteredStudyTerms[typingIndex].definition);
    }
  }, [typingIndex, studyViewMode, autoTTS, filteredStudyTerms, speakText]);

  // Auto TTS effect for Flashcard Mode (manual mode when auto-play is OFF)
  useEffect(() => {
    if (studyViewMode === 'flashcard' && autoTTS && !isAutoPlay && filteredStudyTerms[flashcardIndex]) {
      const card = filteredStudyTerms[flashcardIndex];
      const showTermOnFront = flashcardDirection === 'term_first';
      const isFront = !isCardFlipped;
      const text = (isFront === showTermOnFront)
        ? (card.answer || card.term)
        : card.definition;
      speakText(text);
    }
  }, [flashcardIndex, isCardFlipped, flashcardDirection, studyViewMode, autoTTS, isAutoPlay, filteredStudyTerms, speakText]);

  // Synchronized Auto-play effect for Flashcard mode (waits for TTS completion)
  useEffect(() => {
    if (activeTab !== 'study' || studyViewMode !== 'flashcard' || !isAutoPlay) return;
    if (filteredStudyTerms.length === 0) return;

    let timerId: NodeJS.Timeout | null = null;
    let cancelled = false;

    const currentCard = filteredStudyTerms[flashcardIndex];
    if (!currentCard) return;

    const showTermOnFront = flashcardDirection === 'term_first';
    const isFront = !isCardFlipped;
    const text = (isFront === showTermOnFront)
      ? (currentCard.answer || currentCard.term)
      : currentCard.definition;

    const advanceNext = () => {
      if (cancelled) return;
      if (!isCardFlipped) {
        setIsCardFlipped(true);
      } else {
        setIsCardFlipped(false);
        setFlashcardIndex(prev => (prev + 1) % filteredStudyTerms.length);
      }
    };

    if (autoTTS) {
      speakText(text, () => {
        if (!cancelled) {
          timerId = setTimeout(advanceNext, 1200); // 1.2s buffer pause after speech finishes
        }
      });
    } else {
      timerId = setTimeout(advanceNext, autoPlayIntervalSec * 1000);
    }

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab, studyViewMode, isAutoPlay, isCardFlipped, flashcardIndex, autoPlayIntervalSec, autoTTS, flashcardDirection, filteredStudyTerms, speakText]);

  // Keyboard navigation for Flashcard mode (Space/Enter to flip, Arrow/Enter to next)
  useEffect(() => {
    if (activeTab !== 'study' || studyViewMode !== 'flashcard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInputActive) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsCardFlipped(prev => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isCardFlipped) {
          setIsCardFlipped(true);
        } else {
          setIsCardFlipped(false);
          setFlashcardIndex(prev => Math.min(prev + 1, filteredStudyTerms.length - 1));
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsCardFlipped(false);
        setFlashcardIndex(prev => Math.min(prev + 1, filteredStudyTerms.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsCardFlipped(false);
        setFlashcardIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, studyViewMode, isCardFlipped, filteredStudyTerms.length]);


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
        const sameSubjectTerms = termsList
          .filter(t => t.subject === q.subject && t.term !== correct)
          .map(t => t.term);
        const distractors = sameSubjectTerms
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
    setWorksheetAnswers({});
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

  const handleGradeWorksheet = () => {
    const results = quizQuestions.map((q, idx) => {
      const userAns = worksheetAnswers[idx] || '';
      const isCorr = checkAnswerCorrectness(userAns, q);
      return {
        term: q,
        userAns,
        isCorrect: isCorr,
      };
    });
    setQuizResults(results);
    setActiveTab('quiz_result');
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || isAnswerSubmitted) return;

    submitTimestampRef.current = Date.now();
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

    submitTimestampRef.current = Date.now();
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

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedChoiceIndex(null);
      setShowHint(false);
      setIsAnswerSubmitted(false);
    } else {
      setActiveTab('quiz_result');
    }
  }, [currentIndex, quizQuestions.length]);

  // Keyboard navigation for Single Question Quiz Play mode (Enter key advances to next question when answer is submitted)
  useEffect(() => {
    if (activeTab !== 'quiz_play' || quizFormat !== 'single' || !isAnswerSubmitted) return;

    const handleQuizKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Prevent instant skip on the same keypress / IME composition submit (400ms guard)
        if (e.isComposing || Date.now() - submitTimestampRef.current < 400) {
          return;
        }
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleQuizKeyDown);
    return () => window.removeEventListener('keydown', handleQuizKeyDown);
  }, [activeTab, quizFormat, isAnswerSubmitted, handleNextQuestion]);

  // Typing practice handlers
  const currentTypingTerm = filteredStudyTerms[typingIndex];
  
  const handleTypingSubmit = () => {
    if (!currentTypingTerm || isTypingSubmitted) return;
    const isCorr = checkAnswerCorrectness(typingInput, currentTypingTerm);
    setIsTypingSubmitted(true);
    setTypingHistory(prev => ({ ...prev, [typingIndex]: isCorr }));
    if (isCorr) {
      setTypingCorrectCount(prev => prev + 1);
    }
  };

  const handleTypingNext = () => {
    if (typingIndex + 1 < filteredStudyTerms.length) {
      setTypingIndex(prev => prev + 1);
      setTypingInput('');
      setTypingDefInput('');
    } else {
      alert('모든 학습 문항 타자 연습을 완료했습니다! 🎉');
    }
  };

  const handleTypingPrev = () => {
    if (typingIndex > 0) {
      setTypingIndex(prev => prev - 1);
      setTypingInput('');
      setTypingDefInput('');
    }
  };

  // PDF EXPORT FUNCTION
  const handleExportPDF = () => {
    const exportItems = pdfExportMode === 'wrong_only'
      ? quizResults.filter(r => !(r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect))
      : quizResults;

    if (exportItems.length === 0) {
      alert('내보낼 오답 항목이 없습니다! (전체 정답입니다 🎉)');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
      return;
    }

    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>NUR위한 QUIZ - 오답노트 & 결과 리포트</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1E293B;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          h1 {
            font-size: 20px;
            font-weight: 900;
            color: #0E4A84;
            margin-bottom: 4px;
          }
          .header-info {
            font-size: 13px;
            color: #64748B;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .score-badge {
            display: inline-block;
            background-color: #EFF6FF;
            color: #1E40AF;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 14px;
            margin-bottom: 16px;
            border: 1px solid #BFDBFE;
          }
          .item-card {
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .item-card.wrong {
            background-color: #FEF2F2 !important;
            border-color: #FCA5A5 !important;
            border-left: 6px solid #EF4444 !important;
          }
          .item-card.correct {
            background-color: #F8FAFC;
            border-color: #E2E8F0;
            border-left: 6px solid #22C55E;
          }
          .status-badge {
            font-weight: 800;
            font-size: 13px;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
          }
          .status-badge.wrong {
            background-color: #FEE2E2;
            color: #991B1B;
          }
          .status-badge.correct {
            background-color: #DCFCE7;
            color: #166534;
          }
          .question-title {
            font-size: 15px;
            font-weight: 800;
            color: #0F172A;
            margin: 8px 0;
          }
          .answer-box {
            background-color: #FFFFFF;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 13px;
            border: 1px solid #E2E8F0;
            margin-top: 8px;
          }
          .meta-tag {
            font-size: 12px;
            color: #64748B;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #0E4A84; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ PDF로 저장 / 인쇄하기
          </button>
        </div>

        <h1>NUR위한 (NURWEHAN) - QUIZ 오답노트 & 학습 리포트</h1>
        <div class="header-info">
          일시: ${today} | 출제과목: ${quizSubject} ${quizCategory !== 'all' ? `(${quizCategory})` : ''} | 모드: ${pdfExportMode === 'wrong_only' ? '❌ 오답 모음' : '📋 전체 문항 리포트 (오답 하이라이트)'}
        </div>

        <div class="score-badge">
          총 ${totalQuizCount}문제 중 ${correctCount}문제 정답 (${scorePercent}점)
        </div>

        <div>
          ${exportItems.map((res, i) => {
            const isCorr = res.overrideCorrect !== undefined ? res.overrideCorrect : res.isCorrect;
            return `
              <div class="item-card ${isCorr ? 'correct' : 'wrong'}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="status-badge ${isCorr ? 'correct' : 'wrong'}">
                    #${i + 1} ${isCorr ? '⭕ 정답' : '❌ 오답'}
                  </span>
                  <span class="meta-tag">${res.term.subject} ${res.term.category ? `• ${res.term.category}` : ''}</span>
                </div>
                <div class="question-title">${res.term.term}</div>
                ${res.term.options && res.term.options.length > 0 ? `
                  <div style="font-size: 12px; color: #475569; margin: 4px 0 8px 0; background: rgba(255,255,255,0.7); padding: 6px 10px; border-radius: 4px;">
                    ${res.term.options.map(o => `• ${o}`).join(' &nbsp;|&nbsp; ')}
                  </div>
                ` : ''}
                <div class="answer-box">
                  <div><strong>내 작성 답안:</strong> ${res.userAns || '(미입력)'}</div>
                  <div style="margin-top: 4px; color: ${isCorr ? '#166534' : '#B91C1C'};">
                    <strong>정답:</strong> ${res.term.answer || res.term.term}
                  </div>
                  <div style="margin-top: 4px; color: #475569;">
                    <strong>뜻 / 해설:</strong> ${res.term.definition}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleOpenCreateModal = () => {
    setEditingTerm(null);
    const activeSubj = studySubject !== 'all' ? studySubject : (subjects[0] || '간호관리학');
    const isMcSubj = termsList.some(t => t.subject === activeSubj && (t.itemType === 'MULTIPLE_CHOICE' || (t.options && t.options.length > 0)));

    setFormSubject(activeSubj);
    setFormCategory(studyCategory !== 'all' ? studyCategory : '1주차 퀴즈');
    setFormItemType(isMcSubj ? 'MULTIPLE_CHOICE' : 'TERM');
    setFormTerm('');
    setFormEngTerm('');
    setFormDefinition('');
    setFormExample('');
    setFormOptions(['', '', '', '', '']);
    setFormAnswer('');
    setShowTermModal(true);
  };

  const handleOpenEditModal = (t: NursingTerm) => {
    setEditingTerm(t);
    setFormSubject(t.subject);
    setFormCategory(t.category || '기타');
    const isMc = t.itemType === 'MULTIPLE_CHOICE' || (t.options && t.options.length > 0);
    setFormItemType(isMc ? 'MULTIPLE_CHOICE' : 'TERM');
    setFormTerm(t.term);
    setFormEngTerm(t.englishTerm || '');
    setFormDefinition(t.definition);
    setFormExample(t.example || '');

    const opts = t.options && t.options.length > 0 ? [...t.options] : ['', '', '', '', ''];
    while (opts.length < 5) opts.push('');
    setFormOptions(opts);
    setFormAnswer(t.answer || (t.options && t.options[0]) || '');
    setShowTermModal(true);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm || !formDefinition) {
      alert('질문/용어명과 정답/해설은 필수 입력사항입니다.');
      return;
    }

    let cleanedOptions: string[] = [];
    let finalAnswer = formAnswer;

    if (formItemType === 'MULTIPLE_CHOICE') {
      cleanedOptions = formOptions.map(o => o.trim()).filter(Boolean);
      if (cleanedOptions.length < 2) {
        alert('객관식 문항은 최소 2개 이상의 선택지 보기가 필요합니다.');
        return;
      }
      if (!finalAnswer && cleanedOptions.length > 0) {
        finalAnswer = cleanedOptions[0];
      }
    }

    setAdminSubmitting(true);
    try {
      const payload = {
        subject: formSubject,
        category: formCategory,
        term: formTerm,
        englishTerm: formEngTerm,
        definition: formDefinition,
        example: formExample,
        itemType: formItemType,
        options: cleanedOptions,
        answer: finalAnswer,
      };

      if (editingTerm) {
        const res = await fetch('/api/admin/quiz/terms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTerm.id, ...payload }),
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
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.term) {
          setTermsList(prev => [...prev, data.term]);
          setShowTermModal(false);
        }
      }
    } catch {
      alert('문항 저장 중 오류가 발생했습니다.');
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

  const handleMoveTerm = (filteredIdx: number, direction: 'up' | 'down') => {
    const targetTerm = filteredStudyTerms[filteredIdx];
    if (!targetTerm) return;
    const targetIndexInMain = termsList.findIndex(t => t.id === targetTerm.id);
    if (targetIndexInMain === -1) return;

    const swapFilteredIdx = direction === 'up' ? filteredIdx - 1 : filteredIdx + 1;
    if (swapFilteredIdx < 0 || swapFilteredIdx >= filteredStudyTerms.length) return;
    const swapTerm = filteredStudyTerms[swapFilteredIdx];
    const swapIndexInMain = termsList.findIndex(t => t.id === swapTerm.id);
    if (swapIndexInMain === -1) return;

    const newList = [...termsList];
    const temp = newList[targetIndexInMain];
    newList[targetIndexInMain] = newList[swapIndexInMain];
    newList[swapIndexInMain] = temp;
    setTermsList(newList);
  };

  const correctCount = quizResults.filter(r => (r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect)).length;
  const totalQuizCount = quizQuestions.length;
  const scorePercent = totalQuizCount > 0 ? Math.round((correctCount / totalQuizCount) * 100) : 0;
  const wrongResults = quizResults.filter(r => !(r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect));

  // USER AUTHENTICATION & APPROVAL CHECK
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
            로그인이 필요한 서비스입니다
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--sub-text)', marginBottom: '28px', lineHeight: 1.6 }}>
            퀴즈 및 단어장 서비스를 이용하시려면 먼저 로그인해 주세요.
          </p>
          <a
            href="/login"
            className="btn-primary"
            style={{ display: 'inline-block', width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', borderRadius: '8px' }}
          >
            로그인하러 가기
          </a>
        </div>
      </div>
    );
  }

  const isApproved = user.approvalStatus === 'APPROVED' || isAdmin;
  if (!isApproved) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
            회원가입 승인 대기 중입니다
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--sub-text)', marginBottom: '28px', lineHeight: 1.6 }}>
            현재 계정이 승인 대기(또는 미승인) 상태입니다.<br />
            관리자의 승인이 완료된 후 퀴즈 서비스를 이용하실 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/mypage"
              className="btn-outline"
              style={{ flex: 1, padding: '12px', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', borderRadius: '8px' }}
            >
              마이페이지
            </a>
            <a
              href="/"
              className="btn-primary"
              style={{ flex: 1, padding: '12px', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', borderRadius: '8px' }}
            >
              메인으로
            </a>
          </div>
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
              📖 학습 센터
            </button>
            <button
              onClick={() => setActiveTab('quiz_setup')}
              className={activeTab === 'quiz_setup' || activeTab === 'quiz_play' || activeTab === 'quiz_result' ? 'btn-accent' : 'btn-outline'}
              style={{
                backgroundColor: activeTab === 'quiz_setup' || activeTab === 'quiz_play' || activeTab === 'quiz_result' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeTab === 'quiz_setup' || activeTab === 'quiz_play' || activeTab === 'quiz_result' ? '#0E4A84' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              ✍️ 테스트 모드
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('my_history')}
                className={activeTab === 'my_history' ? 'btn-accent' : 'btn-outline'}
                style={{
                  backgroundColor: activeTab === 'my_history' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                  color: activeTab === 'my_history' ? '#0E4A84' : '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                📜 내 학습기록
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: 학습 센터 (Study Mode with Quizlet Flashcard & Typing Practice Modes) */}
      {activeTab === 'study' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls & Filters Header */}
          <div className="card" style={{ padding: '20px' }}>
            {/* Top Content-Type Distinction Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <button
                onClick={() => {
                  setContentTypeFilter('all');
                  setStudyCategory('all');
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  backgroundColor: contentTypeFilter === 'all' ? '#0E4A84' : '#F1F5F9',
                  color: contentTypeFilter === 'all' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📚 전체 보기
              </button>
              <button
                onClick={() => {
                  setContentTypeFilter('TERM');
                  setStudyCategory('all');
                  if (!termsList.some(t => t.subject === studySubject && (t.itemType || 'TERM') === 'TERM')) {
                    const termSubj = termsList.find(t => (t.itemType || 'TERM') === 'TERM')?.subject;
                    if (termSubj) setStudySubject(termSubj);
                  }
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  backgroundColor: contentTypeFilter === 'TERM' ? '#2563EB' : '#F1F5F9',
                  color: contentTypeFilter === 'TERM' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📖 용어/단어장
              </button>
              <button
                onClick={() => {
                  setContentTypeFilter('MULTIPLE_CHOICE');
                  setStudyCategory('all');
                  setStudyViewMode('grid');
                  if (!termsList.some(t => t.subject === studySubject && t.itemType === 'MULTIPLE_CHOICE')) {
                    const mcSubj = termsList.find(t => t.itemType === 'MULTIPLE_CHOICE')?.subject;
                    if (mcSubj) setStudySubject(mcSubj);
                  }
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  backgroundColor: contentTypeFilter === 'MULTIPLE_CHOICE' ? '#7C3AED' : '#F1F5F9',
                  color: contentTypeFilter === 'MULTIPLE_CHOICE' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📝 객관식/시험 퀴즈
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Subject Tabs */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--sub-text)' }}>과목:</span>
                {filteredSubjects.map(subj => {
                  const isMcSubj = termsList.some(t => t.subject === subj && t.itemType === 'MULTIPLE_CHOICE');
                  return (
                    <button
                      key={subj}
                      onClick={() => {
                        setStudySubject(subj);
                        setStudyCategory('all');
                      }}
                      className={studySubject === subj ? 'btn-primary' : 'btn-outline'}
                      style={{ fontSize: '0.84rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{subj}</span>
                      <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: isMcSubj ? '#EDE9FE' : '#EFF6FF', color: isMcSubj ? '#6D28D9' : '#1D4ED8', fontWeight: 800 }}>
                        {isMcSubj ? '📝 퀴즈' : '📖 용어'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Study Mode Selector Sub-Tabs */}
              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
                <button
                  onClick={() => setStudyViewMode('flashcard')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: studyViewMode === 'flashcard' ? '#0E4A84' : 'transparent',
                    color: studyViewMode === 'flashcard' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  🎴 플래시카드
                </button>
                <button
                  onClick={() => setStudyViewMode('typing')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: studyViewMode === 'typing' ? '#0E4A84' : 'transparent',
                    color: studyViewMode === 'typing' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ⌨️ 타이핑
                </button>
                <button
                  onClick={() => setStudyViewMode('grid')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: studyViewMode === 'grid' ? '#0E4A84' : 'transparent',
                    color: studyViewMode === 'grid' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  📋 목록
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => setAutoTTS(!autoTTS)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: autoTTS ? '#10B981' : '#CBD5E1',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="음성 읽기 ON/OFF"
                  >
                    {autoTTS ? '🔊 음성 ON' : '🔇 음성 OFF'}
                  </button>

                  <select
                    value={ttsRate}
                    onChange={e => setTtsRate(parseFloat(e.target.value))}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B',
                      cursor: 'pointer',
                    }}
                    title="TTS 읽기 배속"
                  >
                    <option value={0.75}>⚡ 0.75x</option>
                    <option value={1.0}>⚡ 1.0x</option>
                    <option value={1.25}>⚡ 1.25x</option>
                    <option value={1.5}>⚡ 1.5x</option>
                    <option value={2.0}>⚡ 2.0x</option>
                  </select>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="btn-primary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    ➕ 새 문항 추가
                  </button>
                )}
              </div>
            </div>

            {/* Category Sub-Filters & Search (For Grid View & Filters) */}
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

              {studyViewMode === 'grid' && (
                <div style={{ marginLeft: 'auto', flex: '1 1 200px', maxWidth: '300px' }}>
                  <input
                    type="text"
                    placeholder="🔍 검색..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* MODE 1: QUIZLET FLASHCARD FLIP MODE (플래시 카드 모드) */}
          {studyViewMode === 'flashcard' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredStudyTerms.length > 0 ? (
                <>
                  {/* Progress Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--sub-text)' }}>
                      카드 {flashcardIndex + 1} / {filteredStudyTerms.length}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setIsAutoPlay(prev => !prev)}
                        className="btn-outline"
                        style={{
                          fontSize: '0.78125rem',
                          padding: '4px 10px',
                          backgroundColor: isAutoPlay ? '#10B981' : '#FFFFFF',
                          color: isAutoPlay ? '#FFFFFF' : '#0E4A84',
                          borderColor: isAutoPlay ? '#10B981' : '#BFDBFE',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {isAutoPlay ? '⏸️ 일시정지' : '▶️ 자동재생'}
                      </button>

                      {isAutoPlay && (
                        <select
                          value={autoPlayIntervalSec}
                          onChange={e => setAutoPlayIntervalSec(Number(e.target.value))}
                          style={{
                            fontSize: '0.78125rem',
                            fontWeight: 700,
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #10B981',
                            backgroundColor: '#ECFDF5',
                            color: '#065F46',
                            cursor: 'pointer',
                          }}
                          title="카드 전환 간격"
                        >
                          <option value={3}>⏱️ 3초</option>
                          <option value={4}>⏱️ 4초</option>
                          <option value={5}>⏱️ 5초</option>
                          <option value={7}>⏱️ 7초</option>
                          <option value={10}>⏱️ 10초</option>
                        </select>
                      )}

                      <button
                        onClick={() => {
                          setFlashcardDirection(prev => (prev === 'term_first' ? 'def_first' : 'term_first'));
                          setIsCardFlipped(false);
                        }}
                        className="btn-outline"
                        style={{ fontSize: '0.78125rem', padding: '4px 10px', color: '#0E4A84', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', fontWeight: 700 }}
                        title="앞면/뒷면 표시 순서 변경"
                      >
                        🔄 {flashcardDirection === 'term_first' ? '용어 ➔ 뜻' : '뜻 ➔ 용어'}
                      </button>
                      <button
                        onClick={() => {
                          const shuffled = [...filteredStudyTerms].sort(() => Math.random() - 0.5);
                          setTermsList(shuffled);
                          setFlashcardIndex(0);
                          setIsCardFlipped(false);
                        }}
                        className="btn-outline"
                        style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
                      >
                        🔀 카드 섞기
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((flashcardIndex + 1) / filteredStudyTerms.length) * 100}%`,
                        height: '100%',
                        backgroundColor: 'var(--primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Big Flashcard Box */}
                  {(() => {
                    const currentCard = filteredStudyTerms[flashcardIndex];
                    if (!currentCard) return null;

                    const showTerm = flashcardDirection === 'term_first' ? !isCardFlipped : isCardFlipped;

                    return (
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        style={{
                          backgroundColor: isCardFlipped ? '#F0F9FF' : '#FFFFFF',
                          border: `2px solid ${isCardFlipped ? '#38BDF8' : 'var(--primary)'}`,
                          borderRadius: '16px',
                          padding: '40px 28px',
                          minHeight: '280px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                          #{flashcardIndex + 1}
                        </div>

                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.78125rem', fontWeight: 700, color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
                          {showTerm ? '용어' : '뜻 / 해설'}
                        </div>

                        {showTerm ? (
                          /* TERM SIDE OF CARD */
                          <div>
                            <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '8px' }}>
                              {currentCard.answer || currentCard.term}
                            </h2>
                            {currentCard.englishTerm && (
                              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sub-text)' }}>
                                ({currentCard.englishTerm})
                              </div>
                            )}

                            {currentCard.options && currentCard.options.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                                {currentCard.options.map((opt, oIdx) => (
                                  <span key={oIdx} style={{ fontSize: '0.8125rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '12px' }}>
                                    ● {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* DEFINITION SIDE OF CARD */
                          <div>
                            <p style={{ fontSize: '1.125rem', color: '#1E293B', fontWeight: 700, lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
                              {currentCard.definition}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Navigation Buttons (Prev / Next) */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setFlashcardIndex(prev => Math.max(prev - 1, 0));
                      }}
                      disabled={flashcardIndex === 0}
                      className="btn-outline"
                      style={{ flex: 1, padding: '12px', fontSize: '0.9375rem', fontWeight: 700 }}
                    >
                      ⬅️ 이전
                    </button>

                    <button
                      onClick={() => {
                        if (!isCardFlipped) {
                          setIsCardFlipped(true);
                        } else {
                          setIsCardFlipped(false);
                          setFlashcardIndex(prev => Math.min(prev + 1, filteredStudyTerms.length - 1));
                        }
                      }}
                      className="btn-primary"
                      style={{ flex: 1, padding: '12px', fontSize: '0.9375rem', fontWeight: 800 }}
                    >
                      {!isCardFlipped ? '정답 확인' : '➡️ (Enter)'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>
                  해당 카테고리에 플래시 카드가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* MODE 2: TYPING PRACTICE MODE (타자 연습 모드) */}
          {studyViewMode === 'typing' && (
            <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredStudyTerms.length > 0 && currentTypingTerm ? (
                <div className="card" style={{ padding: '28px' }}>
                  {/* Header Progress & Prev/Next Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {typingIndex + 1} / {filteredStudyTerms.length}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleTypingPrev}
                        disabled={typingIndex === 0}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={handleTypingNext}
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: '0.8125rem', fontWeight: 800 }}
                      >
                        {typingIndex + 1 < filteredStudyTerms.length ? '➡️ (Enter)' : '완료 🎉'}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: `${((typingIndex + 1) / filteredStudyTerms.length) * 100}%`,
                        height: '100%',
                        backgroundColor: 'var(--primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* SECTION 1: TERM / ANSWER TYPING */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0E4A84' }}>
                        용어
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(currentTypingTerm.answer || currentTypingTerm.term)}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
                        title="음성으로 들려주기"
                      >
                        🔊 용어 읽기
                      </button>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      placeholder={currentTypingTerm.answer || currentTypingTerm.term}
                      value={typingInput}
                      onChange={e => setTypingInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTypingNext();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* SECTION 2: DEFINITION TYPING */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0E4A84' }}>
                        뜻
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(currentTypingTerm.definition)}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
                        title="음성으로 들려주기"
                      >
                        🔊 뜻 읽기
                      </button>
                    </div>
                    {/* Target Definition Gray Preview Box */}
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '14px 16px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B', lineHeight: 1.6 }}>
                        {currentTypingTerm.definition}
                      </div>
                      {currentTypingTerm.options && currentTypingTerm.options.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                          {currentTypingTerm.options.map((opt, oIdx) => (
                            <span key={oIdx} style={{ fontSize: '0.8125rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '6px', color: '#475569' }}>
                              ● {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      placeholder={currentTypingTerm.definition}
                      value={typingDefInput}
                      onChange={e => setTypingDefInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTypingNext();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        lineHeight: 1.6,
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Action / Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleTypingNext}
                      className="btn-accent"
                      style={{ padding: '12px 24px', fontSize: '0.95rem', fontWeight: 800 }}
                    >
                      {typingIndex + 1 < filteredStudyTerms.length ? '➡️ (Enter)' : '🎉 완료'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>
                  해당 카테고리에 문항이 없습니다.
                </div>
              )}
            </div>
          )}

          {/* MODE 3: GRID LIST VIEW (전체 목록 보기) */}
          {studyViewMode === 'grid' && (
            <div>
              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setIsGridEditMode(prev => !prev)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      border: isGridEditMode ? '1px solid #DC2626' : '1px solid #0E4A84',
                      backgroundColor: isGridEditMode ? '#FEF2F2' : '#FFFFFF',
                      color: isGridEditMode ? '#DC2626' : '#0E4A84',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {isGridEditMode ? '🔒 편집 완료 (버튼 숨기기)' : '⚙️ 문항 편집/순서 관리'}
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="btn-primary"
                    style={{ fontSize: '0.84rem', padding: '8px 16px' }}
                  >
                    ➕ 새 문항 추가
                  </button>
                </div>
              )}

              {filteredStudyTerms.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                  {filteredStudyTerms.map((t, idx) => {
                    const isRevealed = revealedCardIds[t.id];
                    const isHidden = hideDefinition && !isRevealed;
                    const isStructuredQuestion = t.options && t.options.length > 0;

                    const checkOptionIsCorrect = (opt: string, answer?: string | null, definition?: string | null) => {
                      const targetAns = answer || definition || '';
                      if (!targetAns) return false;

                      const cleanOpt = opt.trim().replace(/^\([0-9]\)|^[①-⑤]/, '').trim();
                      const cleanAns = targetAns.replace(/^정답:\s*/, '').trim().replace(/^\([0-9]\)|^[①-⑤]/, '').trim();

                      const optNumMatch = opt.match(/^([①-⑤]|\([1-5]\))/);
                      const ansNumMatch = targetAns.match(/^([①-⑤]|\([1-5]\))/);
                      if (optNumMatch && ansNumMatch && optNumMatch[1] === ansNumMatch[1]) {
                        return true;
                      }

                      return cleanOpt === cleanAns || (cleanAns.length > 3 && cleanOpt.includes(cleanAns)) || (cleanOpt.length > 3 && cleanAns.includes(cleanOpt));
                    };

                    const hasMatchingOption = isStructuredQuestion && t.options!.some(opt => checkOptionIsCorrect(opt, t.answer, t.definition));

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

                            {isAdmin && isGridEditMode && (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleMoveTerm(idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                                  title="위로 이동"
                                >
                                  🔼
                                </button>
                                <button
                                  onClick={() => handleMoveTerm(idx, 'down')}
                                  disabled={idx === filteredStudyTerms.length - 1}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: idx === filteredStudyTerms.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === filteredStudyTerms.length - 1 ? 0.3 : 1 }}
                                  title="아래로 이동"
                                >
                                  🔽
                                </button>
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

                          {isStructuredQuestion && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                              {t.options!.map((opt, oIdx) => {
                                const isCorrectOpt = !isHidden && checkOptionIsCorrect(opt, t.answer, t.definition);
                                return (
                                  <div
                                    key={oIdx}
                                    style={{
                                      fontSize: '0.85rem',
                                      color: isCorrectOpt ? '#15803D' : '#334155',
                                      backgroundColor: isCorrectOpt ? '#F0FDF4' : '#F8FAFC',
                                      padding: '9px 13px',
                                      borderRadius: '8px',
                                      border: isCorrectOpt ? '2px solid #22C55E' : '1px solid #E2E8F0',
                                      fontWeight: isCorrectOpt ? 800 : 500,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <span>● {opt}</span>
                                    {isCorrectOpt && (
                                      <span style={{ fontSize: '0.75rem', backgroundColor: '#22C55E', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                                        ✓ 정답
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Show bottom answer/definition box ONLY if it's not a multiple-choice question where answer is already highlighted, or if definition has extra explanation */}
                          {(!isStructuredQuestion || !hasMatchingOption) && (
                            <div
                              onClick={() => {
                                if (hideDefinition) {
                                  setRevealedCardIds(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                }
                              }}
                              style={{
                                backgroundColor: isHidden ? '#F1F5F9' : '#F8FAFC',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${isHidden ? '#E2E8F0' : '#CBD5E1'}`,
                                minHeight: '44px',
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
                                  {t.answer && !t.definition?.replace(/^정답:\s*/, '').includes(t.answer.replace(/^정답:\s*/, '')) && (
                                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                                      정답: {t.answer.replace(/^정답:\s*/, '')}
                                    </div>
                                  )}
                                  <p style={{ fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.5, margin: 0 }}>
                                    {t.definition.replace(/^정답:\s*/, '')}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
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
        </div>
      )}

      {/* VIEW 2: 테스트 모드 (Quiz Setup Mode) */}
      {activeTab === 'quiz_setup' && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto', width: '100%', padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✍️</span> 테스트 모드 (테스트 설정)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Subject */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                1. 과목 선택
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {subjects.map(subj => {
                  const isMcSubj = termsList.some(t => t.subject === subj && t.itemType === 'MULTIPLE_CHOICE');
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setQuizSubject(subj);
                        setQuizCategory('all');
                        if (isMcSubj) {
                          setQuizType('multiple_choice');
                        } else {
                          setQuizType('def_to_term');
                        }
                      }}
                      className={quizSubject === subj ? 'btn-primary' : 'btn-outline'}
                      style={{ fontSize: '0.875rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{subj}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: isMcSubj ? '#EDE9FE' : '#EFF6FF', color: isMcSubj ? '#6D28D9' : '#1D4ED8', fontWeight: 800 }}>
                        {isMcSubj ? '📝 퀴즈' : '📖 용어'}
                      </span>
                    </button>
                  );
                })}
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

            {/* Info Badge for Selected Category Type */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              backgroundColor: isTargetMc ? '#F3E8FF' : isTargetTerm ? '#EFF6FF' : '#F1F5F9',
              color: isTargetMc ? '#6B21A8' : isTargetTerm ? '#1E40AF' : '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{isTargetMc ? '📝' : isTargetTerm ? '📖' : '📚'}</span>
              <span>
                {isTargetMc
                  ? '선택하신 범위는 [객관식 퀴즈 문항]으로 구성되어 있습니다.'
                  : isTargetTerm
                  ? '선택하신 범위는 [의학 용어 / 단어장 문항]으로 구성되어 있습니다.'
                  : '선택하신 범위에 객관식 퀴즈와 의학 용어가 포함되어 있습니다.'}
              </span>
            </div>

            {/* 3. Quiz Type */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                3. 문제 풀이 방식
              </label>

              {isTargetMc ? (
                /* Standard Multiple Choice only for MC subjects */
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '2px solid var(--primary)',
                    backgroundColor: '#EFF6FF',
                    color: 'var(--primary)',
                    fontWeight: 700,
                  }}
                >
                  <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>🎯 객관식 / 선택형 퀴즈</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                    제시된 선택지 보기 중에서 올바른 정답을 선택합니다. (객관식 과목 전용)
                  </div>
                </div>
              ) : (
                /* Both options for vocabulary terms or all */
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
                    <div style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>🎯 4지선다 용어 퀴즈</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                      용어 및 뜻 보기 4개 중 정답을 선택합니다.
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
                      뜻/정의를 확인하고 알맞은 용어를 직접 입력합니다.
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Quiz Format */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                4. 진행 형태
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setQuizFormat('single')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: quizFormat === 'single' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: quizFormat === 'single' ? '#EFF6FF' : '#FFFFFF',
                    color: quizFormat === 'single' ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', marginBottom: '2px' }}>📑 한 문제씩 풀기</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    문제마다 순차 채점 및 바로 진행
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuizFormat('worksheet')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: quizFormat === 'worksheet' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: quizFormat === 'worksheet' ? '#EFF6FF' : '#FFFFFF',
                    color: quizFormat === 'worksheet' ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', marginBottom: '2px' }}>
                    {isTargetMc ? '📝 전체 시험지 모드 (모의고사)' : '📝 전체 단어장 시험 (주관식)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', fontWeight: 400 }}>
                    {isTargetMc ? '모든 객관식 문제 풀이 후 한번에 제출' : '모든 빈칸 작성 후 한번에 채점'}
                  </div>
                </button>
              </div>
            </div>

            {/* 5. Order */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                5. 출제 순서
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

            {/* 6. Question Count */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                6. 문제 수
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
              🚀 테스트 시작
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: 퀴즈 풀이 (Quiz Play Mode - Single Question) */}
      {activeTab === 'quiz_play' && quizFormat === 'single' && currentQuestion && (
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto', width: '100%', padding: '28px' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '0.8125rem' }}>
              {currentQuestion.subject} • {currentQuestion.category}
            </span>
            <button
              type="button"
              onClick={() => setQuizFormat('worksheet')}
              className="btn-outline"
              style={{ fontSize: '0.78125rem', padding: '4px 10px' }}
            >
              📝 전체 시험으로 변경
            </button>
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
          {(() => {
            const isStructured = (currentQuestion.options && currentQuestion.options.length > 0) || currentQuestion.itemType === 'MULTIPLE_CHOICE';
            const showTermAsQuestion = isStructured || quizType === 'term_to_def';
            const promptText = showTermAsQuestion ? currentQuestion.term : currentQuestion.definition;
            const subText = showTermAsQuestion ? currentQuestion.englishTerm : null;

            return (
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '10px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>
                  {promptText}
                </h3>

                {subText && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginTop: '6px' }}>
                    ({subText})
                  </div>
                )}
              </div>
            );
          })()}

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

      {/* VIEW 3-B: 전체 시험지 모드 (Worksheet / Full Exam Mode) */}
      {activeTab === 'quiz_play' && quizFormat === 'worksheet' && quizQuestions.length > 0 && (() => {
        const isMcSheet = quizQuestions.some(q => q.itemType === 'MULTIPLE_CHOICE' || (q.options && q.options.length > 0));

        return (
          <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0E4A84', margin: 0 }}>
                    {isMcSheet ? '📝 전체 퀴즈 모의고사 시험지' : '📝 전체 단어장 시험 (주관식)'}
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
                    출제 과목: {quizSubject} | 총 {quizQuestions.length}문항
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuizFormat('single')}
                  className="btn-outline"
                  style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                >
                  📑 한 문제씩 풀기로 변경
                </button>
              </div>

              {/* Questions Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {quizQuestions.map((q, idx) => {
                  const userAns = worksheetAnswers[idx] || '';
                  const isMcItem = q.itemType === 'MULTIPLE_CHOICE' || (q.options && q.options.length > 0);

                  if (isMcItem) {
                    const optionsList = (q.options && q.options.length > 0) ? q.options : (mcOptionsMap[idx] || []);
                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          border: '1px solid #CBD5E1',
                          borderRadius: '10px',
                          padding: '20px',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: '6px' }}>
                            문제 {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                            {q.subject} {q.category ? `• ${q.category}` : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.6, marginBottom: '14px' }}>
                          {q.term}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {optionsList.map((optText, oIdx) => {
                            const isSelected = userAns === optText;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setWorksheetAnswers(prev => ({ ...prev, [idx]: optText }))}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '8px',
                                  border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                  backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                                  color: isSelected ? '#1E40AF' : '#334155',
                                  fontWeight: isSelected ? 800 : 600,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: isSelected ? '#2563EB' : '#CBD5E1',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {oIdx + 1}
                                </span>
                                {optText}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  /* Vocabulary Term Row */
                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 35%) 1fr',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {/* Left Column: Blank Answer Input Box */}
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRight: '1px solid #CBD5E1',
                          backgroundColor: userAns ? '#F0F9FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          placeholder={`#${idx + 1} 용어 정답 입력...`}
                          value={userAns}
                          onChange={e => setWorksheetAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            borderColor: userAns ? '#0E4A84' : '#E2E8F0',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '6px',
                            color: '#0F172A',
                          }}
                        />
                      </div>

                      {/* Right Column: Definition Prompt */}
                      <div
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#334155',
                          lineHeight: 1.6,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {q.definition}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grade All Button */}
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => handleGradeWorksheet()}
                  className="btn-accent"
                  style={{ width: '100%', padding: '16px', fontSize: '1.125rem', fontWeight: 900, textAlign: 'center' }}
                >
                  📝 채점하기 ({Object.keys(worksheetAnswers).filter(k => worksheetAnswers[Number(k)]?.trim()).length} / {quizQuestions.length})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 4: 퀴즈 결과 & 오답 노트 & PDF 내보내기 */}
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

          {/* PDF Export Toolbar Card */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0369A1', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📄</span> PDF 내보내기 설정
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#0284C7', margin: '4px 0 0 0' }}>
                  퀴즈 결과 오답노트 및 풀이 내역을 PDF로 저장 또는 인쇄합니다.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#FFFFFF', padding: '4px', borderRadius: '8px', border: '1px solid #7DD3FC' }}>
                  <button
                    type="button"
                    onClick={() => setPdfExportMode('wrong_only')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: pdfExportMode === 'wrong_only' ? '#0284C7' : 'transparent',
                      color: pdfExportMode === 'wrong_only' ? '#FFFFFF' : '#0369A1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ❌ 틀린 것만 ({wrongResults.length}개)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportMode('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: pdfExportMode === 'all' ? '#0284C7' : 'transparent',
                      color: pdfExportMode === 'all' ? '#FFFFFF' : '#0369A1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    📋 전체 ({quizResults.length}개 - 오답 하이라이트)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="btn-accent"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🖨️ PDF 다운로드/인쇄
                </button>
              </div>
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

      {/* VIEW 5: 내 학습기록 */}
      {activeTab === 'my_history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
              📜 내 학습기록
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              내가 완료한 테스트 및 학습 기록을 확인하고, 오답을 검토하거나 동일한 문제로 다시 테스트를 진행할 수 있습니다.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            {loadingHistory ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--sub-text)' }}>기록을 불러오는 중...</p>
            ) : myAttempts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myAttempts.map(att => (
                  <div
                    key={att.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.0625rem', color: 'var(--primary)' }}>
                          {att.subject}
                        </span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {att.category || '전체'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                        응시일: {new Date(att.createdAt).toLocaleString('ko-KR')} | 총 {att.totalQuestions}문항중 {att.correctCount}개 맞춤
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: att.score >= 80 ? '#166534' : att.score >= 60 ? '#854D0E' : '#DC2626',
                          backgroundColor: att.score >= 80 ? '#DCFCE7' : att.score >= 60 ? '#FEF9C3' : '#FEE2E2',
                          padding: '6px 14px',
                          borderRadius: '8px',
                        }}
                      >
                        {att.score}점
                      </div>

                      <button
                        onClick={() => setSelectedHistoryAttempt(att)}
                        className="btn-outline"
                        style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                      >
                        📜 풀이/오답 검토
                      </button>

                      <button
                        onClick={() => handleReAttemptQuiz(att)}
                        className="btn-primary"
                        style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                      >
                        🔄 다시 풀기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sub-text)' }}>
                아직 학습 및 테스트 기록이 없습니다. [✍️ 테스트 모드] 탭에서 테스트를 시작해보세요!
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY ATTEMPT DETAIL MODAL */}
      {selectedHistoryAttempt && (
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
                📝 퀴즈 풀이 상세 검토: {selectedHistoryAttempt.subject}
              </h3>
              <button onClick={() => setSelectedHistoryAttempt(null)} className="btn-outline" style={{ padding: '4px 10px' }}>
                닫기 ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>점수: {selectedHistoryAttempt.score}점</strong> (정답 {selectedHistoryAttempt.correctCount} / 오답 {selectedHistoryAttempt.wrongCount})
              </div>
              <button
                onClick={() => handleReAttemptQuiz(selectedHistoryAttempt)}
                className="btn-primary"
                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              >
                🔄 이 문제들로 다시 풀기
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.isArray(selectedHistoryAttempt.details) && selectedHistoryAttempt.details.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: item.isCorrect ? '#BBF7D0' : '#FECACA',
                    backgroundColor: item.isCorrect ? '#F0FDF4' : '#FEF2F2',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '6px', color: 'var(--text)' }}>
                    {idx + 1}. {item.questionText}
                  </div>
                  <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <strong style={{ color: item.isCorrect ? '#166534' : '#991B1B' }}>내가 작성한 답:</strong> {item.userAnswer || '(미작성)'} {item.isCorrect ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong style={{ color: '#1E293B' }}>정답 / 해설:</strong> {item.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
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
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{editingTerm ? '✏️ 문항 수정' : '➕ 새 문항 추가'}</span>
            </h3>

            {/* Type Switcher: TERM vs MULTIPLE_CHOICE */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setFormItemType('MULTIPLE_CHOICE')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  border: 'none',
                  backgroundColor: formItemType === 'MULTIPLE_CHOICE' ? '#7C3AED' : 'transparent',
                  color: formItemType === 'MULTIPLE_CHOICE' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📝 객관식 퀴즈 문항
              </button>
              <button
                type="button"
                onClick={() => setFormItemType('TERM')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  border: 'none',
                  backgroundColor: formItemType === 'TERM' ? '#2563EB' : 'transparent',
                  color: formItemType === 'TERM' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📖 의학 용어 / 단어장
              </button>
            </div>

            <form onSubmit={handleSaveTerm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Subject & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>과목명 *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    placeholder="예: 성인간호학:인지조절"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="예: 5주차 퀴즈"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Question / Term Title */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {formItemType === 'MULTIPLE_CHOICE' ? '문제 질문 (발문) *' : '용어명 / 키워드 *'}
                </label>
                <textarea
                  rows={formItemType === 'MULTIPLE_CHOICE' ? 2 : 1}
                  required
                  value={formTerm}
                  onChange={e => setFormTerm(e.target.value)}
                  placeholder={
                    formItemType === 'MULTIPLE_CHOICE'
                      ? '예: 1. 우측 슬관절에 퇴행성 관절염을 앓고 있는 노인에게 시행할 간호로 부적절한 것은?'
                      : '예: Heberden\'s node (헤베르덴 결절)'
                  }
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* MULTIPLE CHOICE OPTIONS EDITING */}
              {formItemType === 'MULTIPLE_CHOICE' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569' }}>
                      🎯 객관식 선택지 보기 (① ~ ⑤) & 정답 지정
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ※ 정답 라디오 버튼을 선택해주세요.
                    </span>
                  </div>

                  {formOptions.map((opt, idx) => {
                    const circleNum = ['①', '②', '③', '④', '⑤'][idx] || `${idx + 1}.`;
                    const isAnswer = formAnswer === opt && opt.trim() !== '';

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="correctAnswerChoice"
                          checked={isAnswer}
                          onChange={() => setFormAnswer(opt)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          title="정답으로 지정"
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', minWidth: '24px' }}>
                          {circleNum}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...formOptions];
                            newOpts[idx] = e.target.value;
                            setFormOptions(newOpts);
                            if (isAnswer) setFormAnswer(e.target.value);
                          }}
                          placeholder={`보기 ${circleNum} 내용 입력`}
                          style={{
                            flex: 1,
                            borderColor: isAnswer ? '#22C55E' : '#E2E8F0',
                            backgroundColor: isAnswer ? '#F0FDF4' : '#FFFFFF',
                            fontWeight: isAnswer ? 700 : 500,
                          }}
                        />
                        {isAnswer && (
                          <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 800, padding: '2px 6px', backgroundColor: '#DCFCE7', borderRadius: '4px' }}>
                            ✓ 정답
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Eng Term for Term type */}
              {formItemType === 'TERM' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>영문/약어</label>
                  <input
                    type="text"
                    value={formEngTerm}
                    onChange={e => setFormEngTerm(e.target.value)}
                    placeholder="예: OA (Osteoarthritis)"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Definition / Explanation */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {formItemType === 'MULTIPLE_CHOICE' ? '문제 해설 및 정답 설명 *' : '한글 뜻 / 상세 정의 *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDefinition}
                  onChange={e => setFormDefinition(e.target.value)}
                  placeholder={
                    formItemType === 'MULTIPLE_CHOICE'
                      ? '예: 관절의 부동은 관절 가동성 감소와 강직을 유발하므로 부적절함.'
                      : '상세한 한글 뜻 및 정의 입력'
                  }
                  style={{ width: '100%' }}
                />
              </div>

              {/* Submit Buttons */}
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
