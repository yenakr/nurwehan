import React from 'react';

interface PreparingBadgeProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card' | 'inline';
}

export default function PreparingBadge({
  text = '준비 중',
  size = 'md',
  variant = 'badge',
}: PreparingBadgeProps) {
  if (variant === 'inline') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'sm' ? '2px 8px' : '4px 10px',
          borderRadius: '9999px',
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
          fontWeight: 600,
          border: '1px solid #CBD5E1',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#94A3B8',
          }}
        />
        {text}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#64748B',
        }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            marginBottom: '8px',
          }}
        >
          📋
        </div>
        <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#334155' }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <span
      className="badge"
      style={{
        backgroundColor: '#F1F5F9',
        color: '#475569',
        border: '1px solid #E2E8F0',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        borderRadius: '9999px',
      }}
    >
      {text}
    </span>
  );
}
