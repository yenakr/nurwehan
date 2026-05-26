'use client';

import React, { useState } from 'react';

interface ClientActionsProps {
  adminEmail: string;
  subject: string;
  body: string;
}

export default function ClientActions({ adminEmail, subject, body }: ClientActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleSendEmail = () => {
    const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다. 직접 복사해주세요.');
    }
  };

  return (
    <>
      <button 
        onClick={handleSendEmail} 
        className="btn-action-send"
      >
        📧 메일 즉시 전송 (기본 메일앱 실행)
      </button>

      <button 
        onClick={handleCopyText} 
        className="btn-action-copy"
      >
        {copied ? '✅ 복사 완료!' : '📋 메일 본문 복사하기'}
      </button>

      <style jsx>{`
        .btn-action-send {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-action-send:hover {
          background-color: #2563eb;
        }

        .btn-action-copy {
          background-color: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-action-copy:hover {
          background-color: #f3f4f6;
        }
      `}</style>
    </>
  );
}
