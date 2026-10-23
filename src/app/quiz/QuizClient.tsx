'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminRole } from '@/lib/auth-core';
import s from './quiz.module.css';
import HubView from './components/HubView';
import ContextBar from './components/ContextBar';
import TestSetup from './components/TestSetup';
import RecordView from './components/RecordView';
import TermCards, { boldInitials } from './components/TermCards';
import AdminManager from './components/AdminManager';
import { Segmented, Icon, ICON_SEARCH, ICON_VOLUME, ICON_VOLUME_OFF } from './components/ui';
import { isExamItem } from '@/lib/quiz/taxonomy';
import {
  GRADES,
  DEFAULT_GRADE,
  buildSubjects,
  kindOf,
  matchesContentType,
  type NursingTerm,
  type QuizKind,
} from '@/lib/quiz/taxonomy';

function IconSearch({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconVolume({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function IconVolumeOff({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" x2="2" y1="2" y2="22" />
    </svg>
  );
}

function IconEye({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function IconGrip({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

interface QuizClientProps {
  initialTerms: NursingTerm[];
  user?: any;
  initialSubject?: string;
  subjectLevels?: Record<string, string>;
  guest?: boolean;
}


export default function QuizClient({ initialTerms, user, initialSubject, subjectLevels, guest }: QuizClientProps) {
  const isAdmin = isAdminRole(user?.role);
  const router = useRouter();
  const [termsList, setTermsList] = useState<NursingTerm[]>(initialTerms);
  const [view, setView] = useState<'hub' | 'subject'>('hub');
  const [showManager, setShowManager] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [guestNotice, setGuestNotice] = useState(false);
  useEffect(() => {
    if (!guestNotice) return;
    const t = setTimeout(() => setGuestNotice(false), 3500);
    return () => clearTimeout(t);
  }, [guestNotice]);
  const [quizFavOnly, setQuizFavOnly] = useState(false);
  const [levels, setLevels] = useState<Record<string, string>>(subjectLevels ?? {});
  const [formGrade, setFormGrade] = useState<string>(DEFAULT_GRADE);


  const [isGridEditMode, setIsGridEditMode] = useState<boolean>(false);
  const [gridLayout, setGridLayout] = useState<'multi' | 'single'>('multi');

  // Navigation tab: 'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result' | 'my_history'
  const [activeTab, setActiveTab] = useState<'study' | 'quiz_setup' | 'quiz_play' | 'quiz_result' | 'my_history'>('study');
  const [myAttempts, setMyAttempts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] = useState<any | null>(null);
  const [attemptSaved, setAttemptSaved] = useState<boolean>(false);

  // Term filters for Study Mode
  const [studySubject, setStudySubject] = useState<string>('');
  const [studyCategory, setStudyCategory] = useState<string>('all');
  // Term vs Exam Quiz filter for Study Mode
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'TERM' | 'MULTIPLE_CHOICE'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hideDefinition, setHideDefinition] = useState<boolean>(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});

  // Study View Sub-Modes: 'grid' | 'flashcard' | 'typing'
  const [studyViewMode, setStudyViewMode] = useState<'flashcard' | 'typing' | 'grid'>('grid');

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
  // 기본값은 꺼짐. 사용자가 직접 켠 경우에만 브라우저에 기억해서 다음 방문에도 유지한다.
  const [autoTTS, setAutoTTS] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);

  const toggleAutoTTS = useCallback(() => {
    const next = !autoTTS;
    setAutoTTS(next);
    try { localStorage.setItem('nursing_quiz_tts', next ? 'on' : 'off'); } catch {}
    if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [autoTTS]);

  // Flashcard Auto-Play State
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [autoPlayIntervalSec, setAutoPlayIntervalSec] = useState<number>(4);

  // 약어(영문 대문자 2자 이상의 한 단어, 예: ACA·SpO2)는 글자 하나씩 읽고, 풀네임이 있으면 이어서 한 번 읽는다.
  // 그 외 용어(한글 등)는 기존처럼 그대로 읽는다.
  type SpeechSeg = { text: string; lang: string };
  const termSpeech = (card: NursingTerm): string | SpeechSeg[] => {
    const raw = (card.answer || card.term || '').trim();
    const isAbbr = !card.answer && /^[A-Za-z0-9][A-Za-z0-9/&.-]{1,9}$/.test(raw) && (raw.match(/[A-Z]/g) || []).length >= 2;
    if (!isAbbr) return card.answer || card.term;
    const letters = raw.replace(/[/&.-]/g, ' ').split('').filter(c => c.trim()).join(', ');
    const segs: SpeechSeg[] = [{ text: letters, lang: 'en-US' }];
    if (card.englishTerm?.trim()) segs.push({ text: card.englishTerm.trim(), lang: 'en-US' });
    return segs;
  };

  const speakText = useCallback((input: string | SpeechSeg[], onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const segs: SpeechSeg[] = (typeof input === 'string'
      ? [{ text: input, lang: /^[A-Za-z0-9\s.,?!'()-]+$/.test(input.trim()) ? 'en-US' : 'ko-KR' }]
      : input
    ).filter(g => g.text);
    if (segs.length === 0) {
      if (onEnd) onEnd();
      return;
    }
    segs.forEach((g, i) => {
      const utterance = new SpeechSynthesisUtterance(g.text);
      utterance.lang = g.lang;
      utterance.rate = ttsRate;
      if (i === segs.length - 1 && onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }
      window.speechSynthesis.speak(utterance);
    });
  }, [ttsRate]);

  // Quiz Setup States
  const [quizSubject, setQuizSubject] = useState<string>('');
  const [quizCategory, setQuizCategory] = useState<string>('all');
  const [quizType, setQuizType] = useState<'def_to_term' | 'term_to_def' | 'multiple_choice' | 'abbr_both'>('def_to_term');
  // 테스트에 쓸 문제 유형: 용어 암기 / 문제형(객관식·단답형). 둘을 한 테스트에 섞지 않는다.
  const [quizKind, setQuizKind] = useState<'TERM' | 'MULTIPLE_CHOICE'>('TERM');
  const [quizOrder, setQuizOrder] = useState<'shuffle' | 'normal'>('shuffle');
  const [quizCount, setQuizCount] = useState<number | 'all'>('all');
  const [quizReverse, setQuizReverse] = useState<boolean>(false);
  const [quizFormat, setQuizFormat] = useState<'single' | 'worksheet'>('single');
  const [worksheetAnswers, setWorksheetAnswers] = useState<Record<number, string>>({});
  const [worksheetAnswers2, setWorksheetAnswers2] = useState<Record<number, string>>({});

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<NursingTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [userAnswer2, setUserAnswer2] = useState<string>('');
  const answerInput2Ref = useRef<HTMLInputElement | null>(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const submitTimestampRef = useRef<number>(0);
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  
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
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('퀴즈 1');
  const [formItemType, setFormItemType] = useState<'TERM' | 'MULTIPLE_CHOICE'>('TERM');
  const [formTerm, setFormTerm] = useState('');
  const [formEngTerm, setFormEngTerm] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '', '']);
  const [formAnswer, setFormAnswer] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // 저장된 음성 읽기 설정 불러오기 (저장된 값이 'on'일 때만 켠다)
  useEffect(() => {
    try {
      if (localStorage.getItem('nursing_quiz_tts') === 'on') setAutoTTS(true);
    } catch {}
  }, []);

  // Load saved grid layout preference (single column vs multi-column)
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('nursing_quiz_grid_layout');
      if (savedLayout === 'single' || savedLayout === 'multi') {
        setGridLayout(savedLayout);
      }
    } catch {}
  }, []);

  // Sync termsList when initialTerms prop changes and apply custom order if saved
  useEffect(() => {
    try {
      const orderKey = `nursing_terms_order_${studySubject}_${studyCategory}`;
      const saved = localStorage.getItem(orderKey);
      if (saved) {
        const idOrder: string[] = JSON.parse(saved);
        const orderMap = new Map<string, number>();
        idOrder.forEach((id, idx) => orderMap.set(id, idx));

        const sorted = [...initialTerms].sort((a, b) => {
          const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
          const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
          return orderA - orderB;
        });
        setTermsList(sorted);
        return;
      }
    } catch {}
    setTermsList(initialTerms);
  }, [initialTerms, studySubject, studyCategory]);

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
          .filter(t => matchesContentType(t, contentTypeFilter))
          .map(t => t.subject)
          .filter(Boolean)
      )
    );
  }, [termsList, subjects, contentTypeFilter]);

  // 현재 과목 + 현재 탭(용어/객관식)에 실제로 문항이 있는 카테고리만 노출
  const categories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(
      t => t.subject === studySubject && matchesContentType(t, contentTypeFilter)
    );
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, studySubject, contentTypeFilter]);

  // 테스트 설정의 과목/카테고리/출제 대상은 모두 선택한 문제 유형(quizKind)에 해당하는 문항만 사용
  const quizKindCounts = useMemo(() => ({
    TERM: termsList.filter(t => matchesContentType(t, 'TERM')).length,
    MULTIPLE_CHOICE: termsList.filter(t => matchesContentType(t, 'MULTIPLE_CHOICE')).length,
  }), [termsList]);

  const quizSubjects = useMemo(() => {
    return Array.from(
      new Set(termsList.filter(t => matchesContentType(t, quizKind)).map(t => t.subject).filter(Boolean))
    );
  }, [termsList, quizKind]);

  const quizCategories = useMemo(() => {
    const targetSubjectTerms = termsList.filter(t => t.subject === quizSubject && matchesContentType(t, quizKind));
    return Array.from(new Set(targetSubjectTerms.map(t => t.category).filter(Boolean) as string[]));
  }, [termsList, quizSubject, quizKind]);

  // '약어 → 풀네임·뜻' 방식으로 낼 수 있는 문항(영문 풀네임과 뜻이 모두 있는 용어형)
  const bothCount = useMemo(
    () =>
      termsList.filter(
        t =>
          matchesContentType(t, quizKind) &&
          kindOf(t) === 'TERM' &&
          !!t.englishTerm?.trim() &&
          !!t.definition?.trim() &&
          (quizSubject === 'all' || t.subject === quizSubject) &&
          (quizCategory === 'all' || t.category === quizCategory) &&
          (!quizFavOnly || favIds.has(t.id))
      ).length,
    [termsList, quizKind, quizSubject, quizCategory, quizFavOnly, favIds]
  );

  useEffect(() => {
    if (!user) return;
    fetch('/api/quiz/favorites')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.ids)) setFavIds(new Set<string>(d.ids)); })
      .catch(() => {});
  }, [user]);

  const toggleFav = (id: string) => {
    if (!user) {
      setGuestNotice(true);
      return;
    }
    const on = !favIds.has(id);
    setFavIds(prev => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
    fetch('/api/quiz/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: id, on }),
    })
      .then(r => { if (!r.ok) throw new Error('fail'); })
      .catch(() => {
        setFavIds(prev => {
          const next = new Set(prev);
          if (on) next.delete(id); else next.add(id);
          return next;
        });
      });
  };

  const selectedQuizTerms = useMemo(() => {
    return termsList.filter(t => {
      if (!matchesContentType(t, quizKind)) return false;
      if (quizSubject !== 'all' && t.subject !== quizSubject) return false;
      if (quizCategory !== 'all' && t.category !== quizCategory) return false;
      if (quizFavOnly && !favIds.has(t.id)) return false;
      return true;
    });
  }, [termsList, quizSubject, quizCategory, quizKind, quizFavOnly, favIds]);

  const isTargetExam = quizKind === 'MULTIPLE_CHOICE';
  // 문제형 테스트는 '풀이 방식' 단계가 없어서 이후 단계 번호가 하나씩 당겨진다
  const formatStepNo = isTargetExam ? 4 : 5;

  const subjectEntries = useMemo(() => buildSubjects(termsList), [termsList]);
  const currentGrade = subjectEntries.find(x => x.name === studySubject)?.grade ?? DEFAULT_GRADE;
  const subjectTerms = useMemo(() => termsList.filter(t => t.subject === studySubject), [termsList, studySubject]);
  const subjectKindCounts = useMemo(() => ({
    TERM: subjectTerms.filter(t => kindOf(t) === 'TERM').length,
    MULTIPLE_CHOICE: subjectTerms.filter(t => kindOf(t) === 'MULTIPLE_CHOICE').length,
  }), [subjectTerms]);
  const quizOptions = useMemo(
    () => categories.map(name => ({ name, count: subjectTerms.filter(t => t.category === name && kindOf(t) === quizKind).length })),
    [categories, subjectTerms, quizKind]
  );
  const allQuizNames = useMemo(
    () => Array.from(new Set(subjectTerms.map(t => t.category).filter(Boolean) as string[])),
    [subjectTerms]
  );

  // 과목에 들어가기: 학습/테스트/기록이 같은 과목·유형·퀴즈를 공유하도록 상태를 한 번에 맞춘다
  const openSubject = (name: string, forceKind?: QuizKind) => {
    const hasTerm = termsList.some(t => t.subject === name && kindOf(t) === 'TERM');
    const k: QuizKind = forceKind ?? (hasTerm ? 'TERM' : 'MULTIPLE_CHOICE');
    setStudySubject(name);
    setQuizSubject(name);
    setQuizKind(k);
    setContentTypeFilter(k);
    setStudyCategory('all');
    setQuizCategory('all');
    setQuizType(k === 'MULTIPLE_CHOICE' ? 'multiple_choice' : 'def_to_term');
    setStudyViewMode('grid');
    setSearchTerm('');
    setHideDefinition(false);
    setRevealedCardIds({});
    setIsGridEditMode(false);
    setActiveTab('study');
    setView('subject');
  };

  // 다른 화면에서 ?subject=과목명 으로 들어오면 해당 과목을 바로 연다
  useEffect(() => {
    if (initialSubject && termsList.some(t => t.subject === initialSubject)) {
      openSubject(initialSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubject]);

  const handleSelectKind = (k: QuizKind) => {
    setQuizKind(k);
    setContentTypeFilter(k);
    setStudyCategory('all');
    setQuizCategory('all');
    setQuizType(k === 'MULTIPLE_CHOICE' ? 'multiple_choice' : 'def_to_term');
    if (k === 'MULTIPLE_CHOICE') setStudyViewMode('grid');
  };

  const handleSelectQuiz = (q: string) => {
    setStudyCategory(q);
    setQuizCategory(q);
  };

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
    setUserAnswer2('');
    setWorksheetAnswers({});
    setWorksheetAnswers2({});
    if (attempt.quizType === 'abbr_both') setQuizType('abbr_both');
    else if (quizType === 'abbr_both') setQuizType('def_to_term');
    setSelectedHistoryAttempt(null);
    setActiveTab('quiz_play');
  };

  // Filtered terms for study list
  const filteredStudyTerms = useMemo(() => {
    return termsList.filter(t => {
      const itemType = t.itemType || 'TERM';
      if (!matchesContentType(t, contentTypeFilter)) return false;
      if (studySubject !== 'all' && t.subject !== studySubject) return false;
      if (studyCategory !== 'all' && t.category !== studyCategory) return false;

      // In Flashcard or Typing mode, filter out MULTIPLE_CHOICE exam questions only if the subject has TERM items
      if ((studyViewMode === 'flashcard' || studyViewMode === 'typing') && contentTypeFilter === 'all') {
        const hasTermItemsInSubj = termsList.some(item => (studySubject === 'all' || item.subject === studySubject) && (item.itemType || 'TERM') === 'TERM');
        if (hasTermItemsInSubj && itemType === 'MULTIPLE_CHOICE') return false;
      }

      if (favOnly && !favIds.has(t.id)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const termMatch = t.term.toLowerCase().includes(q);
        const engMatch = t.englishTerm?.toLowerCase().includes(q);
        const defMatch = t.definition.toLowerCase().includes(q);
        if (!termMatch && !engMatch && !defMatch) return false;
      }
      return true;
    });
  }, [termsList, studySubject, studyCategory, contentTypeFilter, studyViewMode, searchTerm, favOnly, favIds]);

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
        ? termSpeech(card)
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
      ? termSpeech(currentCard)
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
      if (!matchesContentType(t, quizKind)) return false;
      if (quizSubject !== 'all' && t.subject !== quizSubject) return false;
      if (quizCategory !== 'all' && t.category !== quizCategory) return false;
      if (quizFavOnly && !favIds.has(t.id)) return false;
      return true;
    });

    const bothMode = quizType === 'abbr_both' && quizKind === 'TERM';
    if (bothMode) {
      pool = pool.filter(t => kindOf(t) === 'TERM' && !!t.englishTerm?.trim() && !!t.definition?.trim());
    }

    if (pool.length === 0) {
      alert('조건에 맞는 문항이 없습니다.');
      return;
    }

    if (quizOrder === 'shuffle') {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    if (!customTermsList && typeof quizCount === 'number' && pool.length > quizCount) {
      pool = pool.slice(0, quizCount);
    }

    const optionsMap: Record<number, string[]> = {};
    const allPossibleTerms = termsList.map(t => t.term);

    // '용어 → 뜻' 방향: 용어형 문항만 뜻과 용어를 맞바꿔 출제한다(문제형은 그대로).
    const reverseOn = !bothMode && quizReverse && quizKind === 'TERM' && !customTermsList?.some(isExamItem);
    pool.forEach((q, idx) => {
      if (bothMode) {
        optionsMap[idx] = [];
      } else if (reverseOn && !isExamItem(q) && quizType === 'multiple_choice') {
        const sameSubjectDefs = Array.from(
          new Set(termsList.filter(t => t.subject === q.subject && !isExamItem(t) && t.definition !== q.definition).map(t => t.definition))
        );
        const distractors = sameSubjectDefs.sort(() => Math.random() - 0.5).slice(0, 3);
        optionsMap[idx] = [q.definition, ...distractors].sort(() => Math.random() - 0.5);
      } else if (q.options && q.options.length > 0) {
        optionsMap[idx] = q.options;
      } else if (q.itemType === 'SHORT_ANSWER') {
        optionsMap[idx] = [];
      } else if ((q.itemType || 'TERM') === 'TERM' && quizType === 'multiple_choice') {
        // 용어 문항은 '4지선다형'을 골랐을 때만 보기를 만든다. 단답형이면 직접 입력.
        const correct = q.term;
        const sameSubjectTerms = Array.from(
          new Set(
            termsList
              .filter(t => t.subject === q.subject && t.term !== correct)
              .map(t => t.term)
          )
        );
        const distractors = sameSubjectTerms
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const fourChoices = [correct, ...distractors].sort(() => Math.random() - 0.5);
        optionsMap[idx] = fourChoices;
      } else {
        optionsMap[idx] = [];
      }
    });

    if (reverseOn) {
      pool = pool.map(q =>
        isExamItem(q)
          ? q
          : {
              ...q,
              term: q.definition,
              englishTerm: null,
              definition: q.englishTerm ? `${q.term} (${q.englishTerm})` : q.term,
              answer: q.definition,
            }
      );
    }

    setMcOptionsMap(optionsMap);
    setQuizQuestions(pool);
    setCurrentIndex(0);
    setUserAnswer('');
    setUserAnswer2('');
    setWorksheetAnswers({});
    setWorksheetAnswers2({});
    setSelectedChoiceIndex(null);
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setQuizResults([]);
    setActiveTab('quiz_play');
  };

  const currentQuestion = quizQuestions[currentIndex];

  const checkAnswerCorrectness = (input: string, term: NursingTerm) => {
    if (!input) return false;
    const normalize = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/^[①-⑤]|\([0-9]+\)|^[0-9]+\./g, '')
        .replace(/\(정답\)/g, '')
        .replace(/[\s\-_.,/()]/g, '');

    const cleanInput = normalize(input);
    if (!cleanInput) return false;

    if (term.answer) {
      const answers = term.answer.split(/[/,]/);
      for (const ans of answers) {
        if (cleanInput === normalize(ans)) return true;
      }
    }

    const cleanKorean = normalize(term.term);
    const cleanEng = term.englishTerm ? normalize(term.englishTerm) : '';

    if (quizType === 'def_to_term' || quizType === 'multiple_choice' || term.itemType === 'MULTIPLE_CHOICE' || term.itemType === 'SHORT_ANSWER') {
      return cleanInput === cleanKorean || (cleanEng !== '' && cleanInput === cleanEng);
    } else {
      const keywords = term.term.split(' ');
      return cleanInput.length > 1 && keywords.some(k => cleanInput.includes(normalize(k)));
    }
  };

  // 약어 → 풀네임 + 뜻: 두 칸을 따로 채점한다. 괄호 안 표기·'/'로 나뉜 표현은 어느 쪽이든 인정.
  const looseNorm = (str: string) => str.trim().toLowerCase().replace(/[\s\-_.,/()·ㆍ]/g, '');
  const variantsOf = (text: string) => {
    const out = new Set<string>();
    const whole = looseNorm(text);
    if (whole) out.add(whole);
    const noParen = looseNorm(text.replace(/\([^)]*\)/g, ''));
    if (noParen) out.add(noParen);
    for (const m of text.matchAll(/\(([^)]*)\)/g)) {
      const inner = looseNorm(m[1]);
      if (inner) out.add(inner);
    }
    text.split(/[/,;]/).forEach(part => {
      const n = looseNorm(part.replace(/\([^)]*\)/g, ''));
      if (n) out.add(n);
    });
    return out;
  };
  const checkBoth = (full: string, meaning: string, term: NursingTerm) => {
    const f = looseNorm(full);
    const m = looseNorm(meaning);
    return {
      full: !!f && variantsOf(term.englishTerm || '').has(f),
      meaning: !!m && variantsOf(term.definition || '').has(m),
    };
  };

  const handleSubmitBoth = () => {
    if (!currentQuestion || isAnswerSubmitted) return;
    submitTimestampRef.current = Date.now();
    const r = checkBoth(userAnswer, userAnswer2, currentQuestion);
    setQuizResults(prev => [
      ...prev,
      {
        term: currentQuestion,
        userAns: `${userAnswer.trim() || '(미입력)'} / ${userAnswer2.trim() || '(미입력)'}`,
        isCorrect: r.full && r.meaning,
      },
    ]);
    setIsAnswerSubmitted(true);
  };

  const handleGradeWorksheet = () => {
    if (quizType === 'abbr_both') {
      setQuizResults(
        quizQuestions.map((q, idx) => {
          const a1 = worksheetAnswers[idx] || '';
          const a2 = worksheetAnswers2[idx] || '';
          const r = checkBoth(a1, a2, q);
          return {
            term: q,
            userAns: `${a1.trim() || '(미입력)'} / ${a2.trim() || '(미입력)'}`,
            isCorrect: r.full && r.meaning,
          };
        })
      );
      setActiveTab('quiz_result');
      return;
    }
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

  // 다음 문제로 넘어가면(입력창이 다시 활성화되면) 바로 커서를 정답 입력창에 둔다
  useEffect(() => {
    if (activeTab === 'quiz_play' && quizFormat === 'single' && !isAnswerSubmitted) {
      answerInputRef.current?.focus();
    }
  }, [activeTab, quizFormat, currentIndex, isAnswerSubmitted]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setUserAnswer2('');
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
      alert('모든 학습 문항의 타자 연습을 완료했습니다.');
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
      alert('내보낼 오답 항목이 없습니다. (모든 문항 정답)');
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
            PDF로 저장 / 인쇄하기
          </button>
        </div>

        <h1>NUR위한 (NURWEHAN) - QUIZ 오답노트 & 학습 리포트</h1>
        <div class="header-info">
          일시: ${today} | 출제과목: ${quizSubject} ${quizCategory !== 'all' ? `(${quizCategory})` : ''} | 모드: ${pdfExportMode === 'wrong_only' ? '오답 모음' : '전체 문항 리포트 (오답 하이라이트)'}
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
                    #${i + 1} ${isCorr ? '정답' : '오답'}
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
                  <div><strong>내 답안:</strong> ${res.userAns || '(미입력)'}</div>
                  <div style="margin-top: 4px; color: ${isCorr ? '#166534' : '#B91C1C'};">
                    <strong>정답:</strong> ${res.term.answer || res.term.term}
                  </div>
                  <div style="margin-top: 4px; color: #475569;">
                    <strong>국문 / 해설:</strong> ${res.term.definition}
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

  const handleOpenCreateModal = (newSubject?: boolean, grade?: string) => {
    setEditingTerm(null);
    const activeSubj = newSubject ? '' : studySubject;
    setFormSubject(activeSubj);
    setFormGrade(grade ?? DEFAULT_GRADE);
    setFormCategory(!newSubject && studyCategory !== 'all' ? studyCategory : '퀴즈 1');
    setFormItemType(!newSubject && quizKind === 'MULTIPLE_CHOICE' ? 'MULTIPLE_CHOICE' : 'TERM');
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
    setFormGrade(subjectEntries.find(x => x.name === t.subject)?.grade ?? DEFAULT_GRADE);
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
      const subjectName = formSubject.trim();
      const payload = {
        subject: subjectName,
        grade: subjectEntries.find(x => x.name === subjectName)?.grade ?? formGrade,
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
          router.refresh();
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
          router.refresh();
          if (view === 'hub' || data.term.subject !== studySubject) {
            openSubject(data.term.subject, kindOf(data.term));
          }
        }
      }
    } catch {
      alert('문항 저장 중 오류가 발생했습니다.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteTerm = async (id: string, termName: string) => {
    if (!confirm(`'${termName}' 항목을 삭제할까요?`)) return;
    try {
      const res = await fetch(`/api/admin/quiz/terms?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTermsList(prev => prev.filter(t => t.id !== id));
        router.refresh();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const saveCustomOrder = (list: NursingTerm[]) => {
    try {
      const orderKey = `nursing_terms_order_${studySubject}_${studyCategory}`;
      const idOrder = list.map(t => t.id);
      localStorage.setItem(orderKey, JSON.stringify(idOrder));
    } catch {}
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
    saveCustomOrder(newList);
  };

  const correctCount = quizResults.filter(r => (r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect)).length;
  const totalQuizCount = quizQuestions.length;
  const scorePercent = totalQuizCount > 0 ? Math.round((correctCount / totalQuizCount) * 100) : 0;
  const wrongResults = quizResults.filter(r => !(r.overrideCorrect !== undefined ? r.overrideCorrect : r.isCorrect));

  // USER AUTHENTICATION & APPROVAL CHECK
  if (!user && !guest) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>
            로그인이 필요해요
          </h2>
          <a
            href="/login"
            className="btn-primary"
            style={{ display: 'inline-block', width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', borderRadius: '8px' }}
          >
            로그인
          </a>
        </div>
      </div>
    );
  }

  const isApproved = !user || user.approvalStatus === 'APPROVED' || isAdmin;
  if (!isApproved) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
            확인 대기 중이에요
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--sub-text)', marginBottom: '28px', lineHeight: 1.6 }}>
            관리자 확인 후 이용할 수 있어요.
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

  const tabLabels: Array<{ key: 'study' | 'quiz_setup' | 'my_history'; label: string }> = [
    { key: 'study', label: '학습' },
    { key: 'quiz_setup', label: '테스트' },
    { key: 'my_history', label: '기록' },
  ];
  const inShell = view === 'subject' && (activeTab === 'study' || activeTab === 'quiz_setup' || activeTab === 'my_history');
  const quizTitle = `${quizCategory === 'all' ? '전체' : quizCategory} · ${quizKind === 'TERM' ? '용어' : '문제'} ${selectedQuizTerms.length}개`;

  return (
    <div className={s.root}>
      {view === 'hub' && (
        <HubView
          subjects={subjectEntries}
          levels={isAdmin ? levels : undefined}
          isAdmin={isAdmin}
          onOpen={name => openSubject(name)}
          onAddSubject={g => handleOpenCreateModal(true, g)}
        />
      )}

      {inShell && (
        <>
          <div className={s.head}>
            <button type="button" className={s.back} onClick={() => setView('hub')}>← 과목 선택</button>
            <div className={s.headRow}>
              <h1 className={s.title}>{studySubject}</h1>
              {isAdmin && (
                <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => setShowManager(true)}>과목 관리</button>
              )}
            </div>
          </div>

          <nav aria-label="모드" className={s.tabs}>
            {tabLabels.map(t => (
              <button
                key={t.key}
                type="button"
                aria-current={activeTab === t.key ? 'page' : undefined}
                className={`${s.tab} ${activeTab === t.key ? s.tabActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <ContextBar
            kind={quizKind}
            kindCounts={subjectKindCounts}
            onKind={handleSelectKind}
            quizzes={quizOptions}
            total={subjectKindCounts[quizKind]}
            quiz={studyCategory}
            onQuiz={handleSelectQuiz}
            trailing={activeTab === 'study' && studyViewMode === 'grid' ? (
              <div className={s.search}>
                <span className={s.searchIcon}><Icon d={ICON_SEARCH} size={16} /></span>
                <input
                  type="search"
                  aria-label="검색"
                  placeholder="검색"
                  className={s.searchInput}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            ) : undefined}
          />
        </>
      )}

      {inShell && activeTab === 'study' && (
        <>
          <div className={s.toolbar}>
            <div className={s.toolbarEnd}>
              {quizKind === 'TERM' && (
                <select
                  aria-label="보기 방식"
                  className={s.input}
                  style={{ width: 'auto' }}
                  value={studyViewMode}
                  onChange={e => setStudyViewMode(e.target.value as 'grid' | 'flashcard' | 'typing')}
                >
                  <option value="grid">목록</option>
                  <option value="flashcard">플래시카드</option>
                  <option value="typing">타이핑</option>
                </select>
              )}
              {studyViewMode === 'grid' && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={hideDefinition}
                  className={`${s.switch} ${hideDefinition ? s.switchOn : ''}`}
                  onClick={() => { setHideDefinition(v => !v); setRevealedCardIds({}); }}
                >
                  <span className={s.switchTrack}><span className={s.switchKnob} /></span>
                  국문
                </button>
              )}
              {user && (favIds.size > 0 || favOnly) && (
                <button
                  type="button"
                  aria-pressed={favOnly}
                  className={`${s.favToggle} ${favOnly ? s.favToggleOn : ''}`}
                  onClick={() => setFavOnly(v => !v)}
                >
                  ★ {favIds.size}
                </button>
              )}
              <div className={s.ttsGroup}>
                <button
                  type="button"
                  className={`${s.ttsBtn} ${autoTTS ? s.ttsBtnOn : ''}`}
                  aria-label={autoTTS ? '음성 읽기 끄기' : '음성 읽기 켜기'}
                  aria-pressed={autoTTS}
                  onClick={toggleAutoTTS}
                >
                  <Icon d={autoTTS ? ICON_VOLUME : ICON_VOLUME_OFF} />
                </button>
                {autoTTS && (
                  <select aria-label="음성 배속" className={s.ttsSelect} value={ttsRate} onChange={e => setTtsRate(parseFloat(e.target.value))}>
                    {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
                  </select>
                )}
              </div>
              {isAdmin && (
                <>
                  <button type="button" className={s.btn} aria-pressed={isGridEditMode} onClick={() => { setIsGridEditMode(v => !v); setStudyViewMode('grid'); }}>
                    {isGridEditMode ? '편집 완료' : '문항 편집'}
                  </button>
                  {isGridEditMode && (
                    <button type="button" className={s.btn} onClick={() => handleOpenCreateModal()}>+ 문항 추가</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* MODE 1: QUIZLET FLASHCARD FLIP MODE (플래시 카드 모드) */}
          {studyViewMode === 'flashcard' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredStudyTerms.length > 0 ? (
                <>
                  <div className={s.fcHead}>
                    <span className={s.fcCount}>{flashcardIndex + 1} / {filteredStudyTerms.length}</span>
                    <div className={s.fcTools}>
                      <button
                        type="button"
                        aria-pressed={isAutoPlay}
                        className={`${s.btn} ${s.btnSm} ${isAutoPlay ? s.btnPrimary : ''}`}
                        onClick={() => setIsAutoPlay(prev => !prev)}
                      >
                        {isAutoPlay ? '일시정지' : '자동재생'}
                      </button>
                      {isAutoPlay && (
                        <select
                          aria-label="카드 전환 간격"
                          className={s.ttsSelect}
                          style={{ height: 32, border: '1px solid var(--q-border-strong)', borderRadius: 8 }}
                          value={autoPlayIntervalSec}
                          onChange={e => setAutoPlayIntervalSec(Number(e.target.value))}
                        >
                          {[3, 4, 5, 7, 10].map(n => <option key={n} value={n}>{n}초</option>)}
                        </select>
                      )}
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnSm}`}
                        onClick={() => {
                          setFlashcardDirection(prev => (prev === 'term_first' ? 'def_first' : 'term_first'));
                          setIsCardFlipped(false);
                        }}
                      >
                        {flashcardDirection === 'term_first' ? '약어 → 국문' : '국문 → 약어'}
                      </button>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnSm}`}
                        onClick={() => {
                          const shuffled = [...filteredStudyTerms].sort(() => Math.random() - 0.5);
                          const shuffleIds = new Set(shuffled.map(t => t.id));
                          setTermsList(prev => {
                            let k = 0;
                            return prev.map(t => (shuffleIds.has(t.id) ? shuffled[k++] : t));
                          });
                          setFlashcardIndex(0);
                          setIsCardFlipped(false);
                        }}
                      >
                        섞기
                      </button>
                    </div>
                  </div>

                  <div className={s.rsBar} aria-hidden="true"><div style={{ width: `${((flashcardIndex + 1) / filteredStudyTerms.length) * 100}%` }} /></div>

                  {(() => {
                    const currentCard = filteredStudyTerms[flashcardIndex];
                    if (!currentCard) return null;

                    const abbr = currentCard.answer || currentCard.term;
                    const full = currentCard.englishTerm?.trim();
                    const frontIsAbbr = flashcardDirection === 'term_first';
                    const hasOptions = !!currentCard.options && currentCard.options.length > 0;

                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="카드 뒤집기"
                        className={`${s.fcCard} ${isCardFlipped ? s.fcCardBack : ''}`}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                      >
                        {(
                          <button
                            type="button"
                            className={`${s.star} ${s.fcStar} ${favIds.has(currentCard.id) ? s.starOn : ''}`}
                            aria-label={favIds.has(currentCard.id) ? '즐겨찾기 해제' : '즐겨찾기'}
                            aria-pressed={favIds.has(currentCard.id)}
                            onClick={e => { e.stopPropagation(); toggleFav(currentCard.id); }}
                          >
                            {favIds.has(currentCard.id) ? '★' : '☆'}
                          </button>
                        )}
                        {!isCardFlipped ? (
                          frontIsAbbr ? (
                            <div className={s.fcAbbr}>{abbr}</div>
                          ) : (
                            <div className={s.fcMean}>{currentCard.definition}</div>
                          )
                        ) : (
                          <>
                            <div className={s.fcAbbr}>{abbr}</div>
                            {full && <div className={s.fcFull}>{boldInitials(full)}</div>}
                            <div className={s.fcMean}>{currentCard.definition}</div>
                          </>
                        )}
                        {!isCardFlipped && frontIsAbbr && hasOptions && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                            {currentCard.options!.map((opt, oIdx) => (
                              <span key={oIdx} className={s.option}>{opt}</span>
                            ))}
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
                      이전
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
                      {!isCardFlipped ? '확인' : '다음'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>
                  카드가 없어요.
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
                        {typingIndex + 1 < filteredStudyTerms.length ? '다음' : '완료'}
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
                        onClick={() => speakText(termSpeech(currentTypingTerm))}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
                        title="음성으로 들려주기"
                      >
                        듣기
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
                        국문
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(currentTypingTerm.definition)}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
                        title="음성으로 들려주기"
                      >
                        듣기
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
                      {typingIndex + 1 < filteredStudyTerms.length ? '다음' : '완료'}
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

          {studyViewMode === 'grid' && (
            <TermCards
              terms={filteredStudyTerms}
              hideDefinition={hideDefinition}
              revealed={revealedCardIds}
              onReveal={id => setRevealedCardIds(prev => ({ ...prev, [id]: true }))}
              editMode={isAdmin && isGridEditMode}
              onMove={handleMoveTerm}
              onEdit={handleOpenEditModal}
              onDelete={t => handleDeleteTerm(t.id, t.term)}
              favorites={favIds}
              onToggleFav={toggleFav}
            />
          )}
        </>
      )}

      {inShell && activeTab === 'quiz_setup' && (
        <TestSetup
          kind={quizKind}
          title={quizTitle}
          poolSize={quizType === 'abbr_both' ? bothCount : selectedQuizTerms.length}
          bothAvailable={bothCount > 0}
          favCount={user ? favIds.size : 0}
          favOnly={quizFavOnly}
          onFavOnly={setQuizFavOnly}
          quizType={quizType}
          onQuizType={setQuizType}
          quizCount={quizCount}
          onQuizCount={setQuizCount}
          quizOrder={quizOrder}
          onQuizOrder={setQuizOrder}
          reverse={quizReverse}
          onReverse={setQuizReverse}
          worksheet={quizFormat === 'worksheet'}
          onWorksheet={v => setQuizFormat(v ? 'worksheet' : 'single')}
          onStart={() => handleStartQuiz()}
        />
      )}

      {inShell && activeTab === 'my_history' && (
        <RecordView
          attempts={myAttempts}
          loading={loadingHistory}
          subject={studySubject}
          kind={quizKind}
          quiz={studyCategory}
          terms={termsList}
          onReview={a => setSelectedHistoryAttempt(a)}
          onRetry={handleReAttemptQuiz}
          onRetryWrong={wrong => { setQuizFormat('single'); handleStartQuiz(wrong); }}
          guest={!user}
        />
      )}

      {showManager && (
        <AdminManager
          subject={studySubject}
          grade={currentGrade}
          level={levels[studySubject] ?? 'NORMAL'}
          quizzes={allQuizNames}
          onClose={() => setShowManager(false)}
          onDone={change => {
            if (change.subject) {
              setStudySubject(change.subject);
              setQuizSubject(change.subject);
            }
            if (change.level) {
              const key = change.subject || studySubject;
              setLevels(prev => {
                const next = { ...prev };
                delete next[studySubject];
                if (change.level !== 'NORMAL') next[key] = change.level!;
                return next;
              });
            }
            if (change.category) {
              if (studyCategory === change.category.from) setStudyCategory(change.category.to);
              if (quizCategory === change.category.from) setQuizCategory(change.category.to);
            }
            setShowManager(false);
            router.refresh();
          }}
        />
      )}

      {/* VIEW 3: 퀴즈 풀이 (Quiz Play Mode - Single Question) */}
      {activeTab === 'quiz_play' && quizFormat === 'single' && currentQuestion && (
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto', width: '100%', padding: '28px' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
              {currentIndex + 1} / {quizQuestions.length}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', textAlign: 'right' }}>
              {currentQuestion.subject}{currentQuestion.category && currentQuestion.category !== 'all' ? ` · ${currentQuestion.category}` : ''}
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
            const isStructured = (currentQuestion.options && currentQuestion.options.length > 0) || currentQuestion.itemType === 'MULTIPLE_CHOICE' || currentQuestion.itemType === 'SHORT_ANSWER';
            const showTermAsQuestion = isStructured || quizType === 'term_to_def' || quizType === 'abbr_both';
            const promptText = showTermAsQuestion ? currentQuestion.term : currentQuestion.definition;
            const subText = showTermAsQuestion && quizType !== 'abbr_both' ? currentQuestion.englishTerm : null;

            return (
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px 18px', borderRadius: '10px', marginBottom: '20px' }}>
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

          {/* 약어 → 풀네임 + 한국어 뜻 */}
          {quizType === 'abbr_both' ? (
            (() => {
              const r = checkBoth(userAnswer, userAnswer2, currentQuestion);
              const canSubmit = !!userAnswer.trim() || !!userAnswer2.trim();
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    ref={answerInputRef}
                    aria-label="용어"
                    type="text"
                    disabled={isAnswerSubmitted}
                    placeholder="용어 (영문)"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        answerInput2Ref.current?.focus();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  />
                  <input
                    ref={answerInput2Ref}
                    aria-label="국문"
                    type="text"
                    disabled={isAnswerSubmitted}
                    placeholder="국문"
                    value={userAnswer2}
                    onChange={e => setUserAnswer2(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing && !isAnswerSubmitted && canSubmit) {
                        e.preventDefault();
                        handleSubmitBoth();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  />

                  {isAnswerSubmitted && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: '용어', ok: r.full, answer: currentQuestion.englishTerm },
                        { label: '국문', ok: r.meaning, answer: currentQuestion.definition },
                      ].map(row => (
                        <div
                          key={row.label}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: row.ok ? '#DCFCE7' : '#FEE2E2',
                            border: `1px solid ${row.ok ? '#86EFAC' : '#FCA5A5'}`,
                            color: row.ok ? '#166534' : '#991B1B',
                            fontSize: '0.9375rem',
                          }}
                        >
                          <strong>{row.label} {row.ok ? '정답' : '오답'}</strong> · {row.answer}
                        </div>
                      ))}
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
                            ? '오답 처리'
                            : '정답 처리'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitBoth}
                      disabled={!canSubmit}
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                    >
                      다음
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="btn-accent"
                      style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                    >
                      {currentIndex + 1 < quizQuestions.length ? '다음' : '퀴즈 결과 보기'}
                    </button>
                  )}
                </div>
              );
            })()
          ) : null}

          {quizType === 'abbr_both' ? null : (<>
          {/* MULTIPLE CHOICE / STRUCTURED OPTIONS VIEW vs SUBJECTIVE VIEW */}
          {(currentQuestion.options && currentQuestion.options.length > 0) || (mcOptionsMap[currentIndex] && mcOptionsMap[currentIndex].length > 0) ? (
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
                    <strong>해설/국문:</strong> {currentQuestion.definition}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="btn-accent"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  >
                    {currentIndex + 1 < quizQuestions.length ? '다음' : '퀴즈 결과 보기'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SUBJECTIVE MODE VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  ref={answerInputRef}
                  aria-label="정답 입력"
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
                <div style={{ textAlign: 'center' }}>
                  {showHint ? (
                    <span className={s.hintChip}>첫글자: {(currentQuestion.answer || currentQuestion.term)[0]}</span>
                  ) : (
                    <button type="button" onClick={() => setShowHint(true)} className={s.hintBtn}>힌트</button>
                  )}
                </div>
              )}

              {/* Answer Feedback after submit */}
              {isAnswerSubmitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {checkAnswerCorrectness(userAnswer, currentQuestion) ? (
                    <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '16px', borderRadius: '8px', color: '#166534' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>정답</div>
                      <div style={{ fontSize: '0.875rem' }}>
                        <strong>정답:</strong> {currentQuestion.answer || currentQuestion.term}
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px', color: '#991B1B' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>오답</div>
                      <div style={{ fontSize: '0.875rem', marginBottom: '6px' }}>
                        <strong>정답:</strong> <span style={{ fontWeight: 800, color: '#B91C1C' }}>{currentQuestion.answer || currentQuestion.term}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                        <strong>국문/해설:</strong> {currentQuestion.definition}
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
                        ? '오답 처리'
                        : '정답 처리'}
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
                    다음
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="btn-accent"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  >
                    {currentIndex + 1 < quizQuestions.length ? '다음' : '퀴즈 결과 보기'}
                  </button>
                )}
              </div>
            </div>
          )}
          </>)}
        </div>
      )}

      {/* VIEW 3-B: 전체 시험지 모드 (Worksheet / Full Exam Mode) */}
      {activeTab === 'quiz_play' && quizFormat === 'worksheet' && quizType !== 'abbr_both' && quizQuestions.length > 0 && (() => {
        const isMcSheet = quizQuestions.some(q => q.itemType === 'MULTIPLE_CHOICE' || (q.options && q.options.length > 0));

        return (
          <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              {/* Questions Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {quizQuestions.map((q, idx) => {
                  const userAns = worksheetAnswers[idx] || '';
                  const isStructuredItem = q.itemType === 'MULTIPLE_CHOICE' || (q.options && q.options.length > 0);
                  // 용어를 4지선다로 낼 때는 보기가 자동 생성되므로 그것도 보기형으로 취급한다
                  const hasGeneratedChoices = !isStructuredItem && (mcOptionsMap[idx]?.length ?? 0) > 0;
                  const isMcItem = isStructuredItem || hasGeneratedChoices;

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
                          {hasGeneratedChoices ? q.definition : q.term}
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

                  /* Subjective Short Answer or Term Row */
                  const isShortAns = q.itemType === 'SHORT_ANSWER';
                  if (isShortAns) {
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
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '6px' }}>
                            문제 {idx + 1} (주관식)
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                            {q.subject} {q.category ? `• ${q.category}` : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.6, marginBottom: '14px' }}>
                          {q.term}
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="정답"
                            value={userAns}
                            onChange={e => setWorksheetAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: userAns ? '2px solid #2563EB' : '1px solid #CBD5E1',
                              backgroundColor: userAns ? '#F0F9FF' : '#FFFFFF',
                              color: '#0F172A',
                            }}
                          />
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
                          placeholder={`#${idx + 1}`}
                          value={userAns}
                          onChange={e => setWorksheetAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
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
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '1.125rem', fontWeight: 900, textAlign: 'center' }}
                >
                  채점하기 ({Object.keys(worksheetAnswers).filter(k => worksheetAnswers[Number(k)]?.trim()).length} / {quizQuestions.length})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 시험지 모드: 약어 → 풀네임 · 뜻 (PC는 표, 모바일은 카드) */}
      {activeTab === 'quiz_play' && quizFormat === 'worksheet' && quizType === 'abbr_both' && quizQuestions.length > 0 && (
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div>
            <div className={s.sheet}>
              <div className={`${s.sheetRow} ${s.sheetHead}`}>
                <span>#</span>
                <span>약어</span>
                <span>용어</span>
                <span>국문</span>
              </div>
              {quizQuestions.map((q, idx) => (
                <div key={q.id ?? idx} className={s.sheetRow}>
                  <span className={s.sheetNo}>{idx + 1}</span>
                  <span className={s.sheetAbbr}>{q.term}</span>
                  <input
                    aria-label={`${q.term} 용어`}
                    type="text"
                    placeholder="용어"
                    value={worksheetAnswers[idx] || ''}
                    onChange={e => setWorksheetAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                    className={s.sheetInput}
                  />
                  <input
                    aria-label={`${q.term} 국문`}
                    type="text"
                    placeholder="국문"
                    value={worksheetAnswers2[idx] || ''}
                    onChange={e => setWorksheetAnswers2(prev => ({ ...prev, [idx]: e.target.value }))}
                    className={s.sheetInput}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleGradeWorksheet()}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.0625rem', fontWeight: 900, marginTop: '18px' }}
            >
              채점하기 ({quizQuestions.filter((_, i) => (worksheetAnswers[i] || '').trim() || (worksheetAnswers2[i] || '').trim()).length} / {quizQuestions.length})
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: 퀴즈 결과 & 오답 노트 & PDF 내보내기 */}
      {activeTab === 'quiz_result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          {(() => {
            const filter: 'wrong_only' | 'all' = wrongResults.length === 0 ? 'all' : pdfExportMode;
            return (
              <>
                <section className={s.rs} aria-label="결과">
                  <div className={s.rsTop}>
                    <div className={`${s.rsScore} ${scorePercent >= 70 ? s.rsGood : s.rsBad}`}>{scorePercent}<small>점</small></div>
                    <div className={s.rsCount}>{correctCount} / {totalQuizCount}</div>
                  </div>
                  <div className={s.rsBar} aria-hidden="true"><div style={{ width: `${scorePercent}%` }} /></div>
                  <div className={s.rsActions}>
                    {wrongResults.length > 0 && (
                      <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => handleStartQuiz(wrongResults.map(w => w.term))}>
                        오답 {wrongResults.length}개 다시 풀기
                      </button>
                    )}
                    <button type="button" className={s.btn} onClick={() => setActiveTab('quiz_setup')}>새 테스트</button>
                  </div>
                </section>

                <div className={s.rsBarRow}>
                  <Segmented<'wrong_only' | 'all'>
                    label="보기"
                    value={filter}
                    onChange={setPdfExportMode}
                    options={[
                      { value: 'wrong_only', label: `오답 ${wrongResults.length}`, disabled: wrongResults.length === 0 },
                      { value: 'all', label: `전체 ${quizResults.length}` },
                    ]}
                  />
                  <button type="button" className={s.btn} onClick={handleExportPDF}>PDF 저장</button>
                </div>

                <div className={s.rsList}>
                  {quizResults.map((res, idx) => {
                    const finalCorrect = res.overrideCorrect !== undefined ? res.overrideCorrect : res.isCorrect;
                    if (filter === 'wrong_only' && finalCorrect) return null;
                    const ans = res.term.answer;
                    return (
                      <article key={res.term.id ?? idx} className={`${s.rsItem} ${finalCorrect ? s.rsOk : s.rsNo}`}>
                        <div className={s.rsHead}>
                          <span className={s.rsNum}>#{idx + 1} {finalCorrect ? '정답' : '오답'}</span>
                          <button type="button" className={s.rsToggle} onClick={() => handleToggleSelfCorrection(idx)}>
                            {finalCorrect ? '오답 처리' : '정답 처리'}
                          </button>
                        </div>
                        <div className={s.rsTerm}>
                          {res.term.term}
                          {res.term.englishTerm && <span> {res.term.englishTerm}</span>}
                        </div>
                        {ans && ans !== res.term.term && <div className={s.rsAns}>{ans}</div>}
                        <div className={s.rsDef}>{res.term.definition}</div>
                        <div className={s.rsMine}>내 답안 · {res.userAns || '미입력'}</div>
                      </article>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {guestNotice && (
        <div role="status" className={s.toast}>
          <span>즐겨찾기는 로그인 시 저장돼요</span>
          <a href="/login">로그인</a>
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
                퀴즈 풀이 상세 검토: {selectedHistoryAttempt.subject}
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
                이 문제들로 다시 풀기
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.isArray(selectedHistoryAttempt.details) && selectedHistoryAttempt.details.map((item: any, idx: number) => (
                <article key={idx} className={`${s.rsItem} ${item.isCorrect ? s.rsOk : s.rsNo}`}>
                  <div className={s.rsHead}>
                    <span className={s.rsNum}>#{idx + 1} {item.isCorrect ? '정답' : '오답'}</span>
                  </div>
                  <div className={s.rsTerm}>{item.questionText}</div>
                  <div className={s.rsAns}>{item.correctAnswer}</div>
                  <div className={s.rsMine}>내 답안 · {item.userAnswer || '미입력'}</div>
                </article>
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
              <span>{editingTerm ? '문항 수정' : '새 문항 추가'}</span>
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
                객관식 퀴즈 문항
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
                용어 / 단어장 문항
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
                    list="subject-names"
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    placeholder="예: 성인간호학:인지조절"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>퀴즈</label>
                  <datalist id="quiz-names">{Array.from(new Set(termsList.filter(t => t.subject === formSubject.trim()).map(t => t.category).filter(Boolean) as string[])).map(c => <option key={c} value={c} />)}</datalist>
                  <input
                    type="text"
                    list="quiz-names"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="예: 5주차 퀴즈"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {formSubject.trim() && !subjectEntries.some(x => x.name === formSubject.trim()) && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>구분</label>
                  <select value={formGrade} onChange={e => setFormGrade(e.target.value)} style={{ width: '100%' }}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
              <datalist id="subject-names">{subjectEntries.map(x => <option key={x.name} value={x.name} />)}</datalist>

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
                      객관식 선택지 보기 (① ~ ⑤) 및 정답 지정
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
                  {formItemType === 'MULTIPLE_CHOICE' ? '문제 해설 및 정답 설명 *' : '국문 / 상세 정의 *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDefinition}
                  onChange={e => setFormDefinition(e.target.value)}
                  placeholder={
                    formItemType === 'MULTIPLE_CHOICE'
                      ? '예: 관절의 부동은 관절 가동성 감소와 강직을 유발하므로 부적절함.'
                      : '상세한 국문 및 정의 입력'
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
