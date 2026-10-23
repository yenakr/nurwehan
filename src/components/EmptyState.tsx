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
          padding: '24px 20px',
          backgroundColor: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          textAlign: 'center',
          margin: '12px 0',
        }}
      >
        <PreparingBadge variant="badge" size="md" text="준비 중" />
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
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
        {title || '내역이 없어요'}
      </h4>
      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: actionButton ? '16px' : '0' }}>
        {description || ''}
      </p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
