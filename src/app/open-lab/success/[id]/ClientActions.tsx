'use client';

import React, { useState } from 'react';

interface ClientActionsProps {
  adminEmail: string;
  subject: string;
  body: string;
  repName: string;
  date: Date | string;
  startTime: string;
  endTime: string;
}

export default function ClientActions({ 
  adminEmail, 
  subject, 
  body,
  repName,
  date,
  startTime,
  endTime
}: ClientActionsProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const rawDate = new Date(date);
    const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
    const dd = String(rawDate.getDate()).padStart(2, '0');
    const formattedDate = `${mm}${dd}`;
    
    const originalTitle = document.title;
    document.title = `[${repName}] OPEN LAB 신청서 ${formattedDate} ${startTime}`;
    window.print();
    document.title = originalTitle;
  };

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
      alert('복사에 실패했습니다. 본문 미리보기에서 직접 드래그하여 복사해 주세요.');
    }
  };

  return (
    <div className="action-buttons-wrap">
      <button 
        onClick={handlePrint} 
        className="btn-action-primary"
      >
        신청서 PDF 다운로드
      </button>

      <div className="action-buttons-secondary">
        <button 
          onClick={handleSendEmail} 
          className="btn-action-secondary"
        >
          메일 앱 열기
        </button>

        <button 
          onClick={handleCopyText} 
          className="btn-action-secondary"
        >
          {copied ? '복사 완료' : '메일 본문 복사'}
        </button>
      </div>

      <style jsx>{`
        .action-buttons-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .action-buttons-secondary {
          display: flex;
          gap: 10px;
        }

        .btn-action-primary {
          background-color: #0E4A84;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: center;
          width: 100%;
        }
        .btn-action-primary:hover {
          background-color: #0b3a66;
        }

        .btn-action-secondary {
          flex: 1;
          background-color: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .btn-action-secondary:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
}
