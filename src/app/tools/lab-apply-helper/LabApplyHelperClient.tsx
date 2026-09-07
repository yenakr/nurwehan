'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LabApplyHelperClientProps {
  user: any;
}

export default function LabApplyHelperClient({ user }: LabApplyHelperClientProps) {
  const [name, setName] = useState(user?.name || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [grade, setGrade] = useState<number>(user?.grade || 2);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  const [targetLab, setTargetLab] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [interestArea, setInterestArea] = useState('');
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [goals, setGoals] = useState('');

  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const draftText = `[연구실 Open Lab / 학부연구생 지원서]

1. 인적사항
 - 성명: ${name || '____'}
 - 학번: ${studentId || '____'}
 - 학년: ${grade}학년
 - 연락처: ${phone || '____'}
 - 이메일: ${email || '____'}

2. 지망 연구실 및 교수님
 - 지망 연구실: ${targetLab || '미정'}
 - 지도 교수님: ${professorName || '미정'}

3. 관심 연구 분야
${interestArea || '입력 없음'}

4. 지원 동기
${motivation || '입력 없음'}

5. 관련 경험 및 이수 과목
${experience || '입력 없음'}

6. 활동 목표 및 배우고 싶은 내용
${goals || '입력 없음'}

작성일: ${new Date().toLocaleDateString('ko-KR')}
신청자: ${name || '____'} (인)`;

    setGeneratedDraft(draftText);
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            🔬 연구실 지원서 작성 도우미
          </h2>
          <Link href="/tools" className="btn-outline" style={{ fontSize: '0.8125rem' }}>
            ← 유틸리티 도구 목록
          </Link>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
          항목별 정보를 입력하면 교수님 제출용 정돈된 연구실 지원서 템플릿 문서를 자동으로 생성해 드립니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Input Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
            📝 지원서 항목 입력
          </h3>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>이름 *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>학번 *</label>
                <input type="text" required value={studentId} onChange={e => setStudentId(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>학년</label>
                <select value={grade} onChange={e => setGrade(Number(e.target.value))} style={{ width: '100%' }}>
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                  <option value={4}>4학년</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>연락처</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>지망 연구실</label>
                <input type="text" placeholder="예: 간호중환자 연구실" value={targetLab} onChange={e => setTargetLab(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>담당 교수님</label>
                <input type="text" placeholder="예: 홍길동 교수님" value={professorName} onChange={e => setProfessorName(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>관심 연구 분야</label>
              <textarea rows={2} placeholder="관심 있는 임상/간호 연구 주제를 입력하세요." value={interestArea} onChange={e => setInterestArea(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>지원 동기</label>
              <textarea rows={3} placeholder="연구실 Open Lab 또는 학부연구생 지원 계기와 동기를 작성하세요." value={motivation} onChange={e => setMotivation(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>배우고 싶은 내용 및 목표</label>
              <textarea rows={3} placeholder="연구실 활동을 통해 배우고 싶은 연구방법론, 논문 작성, 통계 분석 등을 입력하세요." value={goals} onChange={e => setGoals(e.target.value)} style={{ width: '100%' }} />
            </div>

            <button type="submit" className="btn-accent" style={{ marginTop: '8px' }}>
              📄 지원서 양식 생성하기
            </button>
          </form>
        </div>

        {/* Output Preview */}
        <div className="card" style={{ backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--accent)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary)' }}>
              📋 생성된 지원서 미리보기
            </h3>
            {generatedDraft && (
              <button onClick={handleCopy} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
                {copied ? '✅ 복사 완료!' : '📋 클립보드 복사'}
              </button>
            )}
          </div>

          {generatedDraft ? (
            <pre
              style={{
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                backgroundColor: '#FFFFFF',
                padding: '20px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
              }}
            >
              {generatedDraft}
            </pre>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--sub-text)' }}>
              왼쪽 입력 폼에 정보를 작성한 후<br />
              <strong>[지원서 양식 생성하기]</strong> 버튼을 누르시면 이곳에 완성본이 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
