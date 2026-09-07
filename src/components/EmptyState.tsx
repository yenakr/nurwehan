import React from 'react';
import PreparingBadge from './PreparingBadge';

interface EmptyStateProps {
  type: 'preparing' | 'empty_user_data';
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
}

export default function EmptyState({
  type,
  title,
  description,
  actionButton,
}: EmptyStateProps) {
  if (type === 'preparing') {
    return (
      <div
        style={{
          padding: '32px 20px',
          backgroundColor: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          textAlign: 'center',
          margin: '12px 0',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <PreparingBadge variant="badge" size="md" text="준비 중" />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
          {title || '현재 세부 정보를 준비 중입니다.'}
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '400px', margin: '0 auto 12px' }}>
          {description || '관리자가 공식 학사/실습 일정 및 기준 데이터를 등록할 예정입니다.'}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '32px 20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        textAlign: 'center',
        margin: '12px 0',
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.6 }}>📭</div>
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
        {title || '등록된 내역이 없습니다.'}
      </h4>
      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: actionButton ? '16px' : '0' }}>
        {description || '새로운 항목을 추가하거나 관리해 보세요.'}
      </p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
