'use client';

import { useState } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface ClinicalClientProps {
  healthRequirements: any[];
  user: any;
}

export default function ClinicalClient({ healthRequirements, user }: ClinicalClientProps) {
  const [activeTab, setActiveTab] = useState<'health' | 'pre' | 'during' | 'post'>('health');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
          🩺 CLINICAL (임상실습 통합 관리 Hub)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
          임상실습 전 예방접종 및 항체/결핵검사 건강요건 준비부터 실습 중 학습 목표 및 실습 후 자율연습까지 원스톱으로 관리합니다.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'health', label: '1. 임상실습 건강요건 Readiness' },
            { id: 'pre', label: '2. 실습 전 준비 사항' },
            { id: 'during', label: '3. 실습 중 지침 및 학습' },
            { id: 'post', label: '4. 실습 후 복습 & OPEN LAB' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={activeTab === tab.id ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '0.84rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Health Readiness */}
      {activeTab === 'health' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text)' }}>
              💉 임상실습 전 건강요건 검사 및 예방접종 관리
            </h3>
            <PreparingBadge variant="badge" text="준비 중" />
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#1E3A8A',
            }}
          >
            <strong>💡 안내:</strong> 대학 및 각 병원 실습기관별 정확한 예방접종 차수, 항체검사 세부 기준 및 제출 마감일은 관리자가 공식 등록 준비 중입니다. 
            확인되지 않은 의료적 기준을 추정하여 제공하지 않으며, 기준 등록 시 개인 준비 상태 판정이 활성화됩니다.
          </div>

          {healthRequirements && healthRequirements.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>검사 / 접종 항목</th>
                    <th>구분</th>
                    <th>대상 학년</th>
                    <th>상태</th>
                    <th>학생 안내 문구</th>
                  </tr>
                </thead>
                <tbody>
                  {healthRequirements.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700 }}>{req.name}</td>
                      <td>{req.category}</td>
                      <td>{req.applicableGrades?.map((g: number) => `${g}학년`).join(', ') || '전학년'}</td>
                      <td>
                        <PreparingBadge variant="badge" text="준비 중" />
                      </td>
                      <td style={{ color: 'var(--sub-text)', fontSize: '0.8125rem' }}>
                        {req.studentDisplayText || '세부 제출 기준 입력 준비 중입니다.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              type="preparing"
              title="임상실습 건강요건 세부 기준 준비 중"
              description="현재 간호대학 학년별/병원별 예방접종 및 항체검사 필수 제출 기준을 등록 준비 중입니다."
            />
          )}
        </div>
      )}

      {/* Tab 2: Pre-clinical Checklist */}
      {activeTab === 'pre' && (
        <div className="card">
          <h3 className="section-title">
            <span>📋 임상실습 전 체크리스트</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { title: '건강요건 및 검사서류', desc: '항체검사결과지, 예방접종 증명서, 결핵검사 결과지 준비', status: '준비 중' },
              { title: '실습 OT 참가 및 서약서', desc: '학과 실습 오리엔테이션 일정 확인 및 관련 제출 서류 확인', status: '준비 중' },
              { title: '실습복 및 준비물 점검', desc: '간호사복, 실습화, 펜라이트, 청진기, 수첩, 문구류 점검', status: '확인 권장' },
              { title: '사전 전공학습 및 주요 질환', desc: '해당 실습 병동 주요 질환, 의학용어 및 약물 사전 학습', status: '확인 권장' },
            ].map((item, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{item.title}</span>
                  <PreparingBadge variant="badge" size="sm" text={item.status} />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: During Clinical */}
      {activeTab === 'during' && (
        <div className="card">
          <h3 className="section-title">
            <span>📝 실습 중 지침 및 학습 일지</span>
          </h3>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '6px',
              marginBottom: '20px',
              color: '#991B1B',
              fontSize: '0.875rem',
            }}
          >
            <strong>⚠️ 개인정보 보호 수칙 (필독):</strong> 실습 중 기록 및 학습 메모 작성 시 
            환자의 이름, 등록번호, 병실 번호, 생년월일 등 <strong>실제 환자를 식별할 수 있는 어떠한 개인정보(PHI)도 저장이 엄격히 금지</strong>됩니다.
          </div>

          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              오늘의 임상실습 목표 및 학습 질문 기록
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
              실습 병동에서 관찰한 비식별화 학습 내용을 기록하고 복습할 수 있습니다.
            </p>
            <PreparingBadge variant="badge" text="기록 기능 준비 중" />
          </div>
        </div>
      )}

      {/* Tab 4: Post Clinical */}
      {activeTab === 'post' && (
        <div className="card">
          <h3 className="section-title">
            <span>🔄 실습 후 복습 & OPEN LAB 연동</span>
          </h3>

          <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '16px' }}>
            임상실습 중 부족했던 핵심간호술기나 다시 연습이 필요한 기자재가 있다면 OPEN LAB 자율연습을 즉시 신청하세요.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/open-lab" className="btn-accent" style={{ flex: 1, textAlign: 'center' }}>
              🧪 OPEN LAB 자율연습 신청하러 가기
            </Link>
            <Link href="/usage-logs/new" className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>
              📋 실습 후 사용일지 작성
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
