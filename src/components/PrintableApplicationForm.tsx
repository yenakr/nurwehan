'use client';

import React from 'react';

interface Participant {
  id: string;
  studentId: string;
  name: string;
}

interface Supply {
  name: string;
  quantity: number;
  unit: string;
  note: string | null;
}

interface PrintableApplicationFormProps {
  application: {
    id: string;
    createdAt: string | Date;
    subject: string | null;
    professor: string | null;
    purpose: string | null;
    guestName: string | null;
    guestStudentId: string | null;
    guestPhone: string | null;
    guestGrade: number | null;
    representativeUser?: {
      name: string;
      studentId: string;
      phone: string | null;
      grade: number | null;
    } | null;
    slot: {
      date: string | Date;
      startTime: string;
      endTime: string;
      room: string;
    };
    participants: Participant[];
  };
  supplies: Supply[];
}

export default function PrintableApplicationForm({ application, supplies }: PrintableApplicationFormProps) {
  // Extract representative details
  const repName = application.representativeUser?.name || application.guestName || '';
  const repStudentId = application.representativeUser?.studentId || application.guestStudentId || '';
  const repPhone = application.representativeUser?.phone || application.guestPhone || '';
  const repGrade = application.representativeUser?.grade || application.guestGrade || '';

  // Determine room checkboxes
  const isImSang = application.slot.room.includes('임상수기') || application.slot.room.includes('5층');
  const isSim = application.slot.room.includes('시뮬레이션') || application.slot.room.includes('6층');

  // Format dates
  const appDateObj = new Date(application.createdAt);
  const appDateStr = `${appDateObj.getFullYear()}. ${String(appDateObj.getMonth() + 1).padStart(2, '0')}. ${String(appDateObj.getDate()).padStart(2, '0')}`;

  const slotDateObj = new Date(application.slot.date);
  const slotDateStr = `${slotDateObj.getFullYear()}년 ${slotDateObj.getMonth() + 1}월 ${slotDateObj.getDate()}일`;

  // Participant names concatenated (showing only names, no parenthetical student IDs)
  const participantNames = application.participants.map(p => p.name).join(', ');

  // Create exactly 17 rows for the supplies table
  const maxRows = 17;
  const tableRows = Array.from({ length: maxRows }, (_, i) => {
    if (i < supplies.length) {
      return {
        num: i + 1,
        name: supplies[i].name,
        quantity: `${supplies[i].quantity} ${supplies[i].unit}`,
      };
    }
    return {
      num: i + 1,
      name: '',
      quantity: '',
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-area-wrapper">
      <div className="no-print print-btn-container">
        <button onClick={handlePrint} className="btn-print-trigger">
          🖨️ 신청서 PDF 다운로드 / 인쇄하기
        </button>
      </div>

      <div className="print-container">
        {/* Title */}
        <h1 className="form-title">한양대학교 간호대학 실습실 및 기자재 사용신청서</h1>

        <table className="official-form-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '35%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="label-cell" style={{ width: '15%' }}>실습실명</td>
              <td className="content-cell" colSpan={3}>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <span className="chk-box">{isImSang ? '■' : '□'}</span>
                    임상수기실습실 (5층)
                  </label>
                  <label className="checkbox-label" style={{ marginLeft: '24px' }}>
                    <span className="chk-box">{isSim ? '■' : '□'}</span>
                    시뮬레이션실습실(6층)
                  </label>
                </div>
              </td>
            </tr>

            <tr>
              <td className="label-cell">실습과목</td>
              <td className="content-cell" style={{ width: '35%' }}>{application.subject || '-'}</td>
              <td className="label-cell" style={{ width: '15%' }}>담당교수</td>
              <td className="content-cell" style={{ width: '35%' }}>{application.professor || '-'}</td>
            </tr>

            <tr>
              <td className="label-cell">실습담당자</td>
              <td className="content-cell">{repName} ({repStudentId})</td>
              <td className="label-cell">연락처</td>
              <td className="content-cell">{repPhone}</td>
            </tr>

            <tr>
              <td className="label-cell">실습날짜</td>
              <td className="label-cell">실습시간</td>
              <td className="label-cell" colSpan={2}>사용인원</td>
            </tr>

            <tr>
              <td className="content-cell text-center">{slotDateStr}</td>
              <td className="content-cell text-center">{application.slot.startTime} ~ {application.slot.endTime}</td>
              <td className="content-cell text-center" colSpan={2}>{application.participants.length}명</td>
            </tr>

            <tr>
              <td className="label-cell">실습학생이름</td>
              <td className="content-cell" colSpan={3} style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {participantNames}
              </td>
            </tr>

            <tr>
              <td className="label-cell">목적</td>
              <td className="content-cell" colSpan={3}>{application.purpose || '-'}</td>
            </tr>

            {/* Merged supplies table */}
            <tr>
              <td className="label-cell vertical-text" style={{ padding: '20px 0' }}>
                필요물품
              </td>
              <td colSpan={3} style={{ padding: 0 }}>
                <table className="supplies-sub-table">
                  <thead>
                    <tr>
                      <th style={{ width: '8%', borderLeft: 'none', borderTop: 'none' }}></th>
                      <th style={{ width: '67%', borderTop: 'none' }}>기자재 명</th>
                      <th style={{ width: '25%', borderRight: 'none', borderTop: 'none' }}>수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.num}>
                        <td className="sub-num-cell" style={{ borderLeft: 'none', borderBottom: row.num === 17 ? 'none' : '1px solid #000' }}>
                          {row.num}
                        </td>
                        <td className="sub-content-cell" style={{ borderBottom: row.num === 17 ? 'none' : '1px solid #000' }}>
                          {row.name}
                        </td>
                        <td className="sub-content-cell text-center" style={{ borderRight: 'none', borderBottom: row.num === 17 ? 'none' : '1px solid #000' }}>
                          {row.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td className="label-cell">신청일</td>
              <td className="content-cell text-center">{appDateStr}</td>
              <td className="label-cell">신청자</td>
              <td className="content-cell" style={{ position: 'relative' }}>
                <span style={{ fontWeight: 600 }}>{repName}</span>
                <span className="sign-mark">(인)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .print-btn-container {
          margin-bottom: 24px;
          text-align: center;
        }
        .btn-print-trigger {
          background-color: var(--accent);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-print-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .print-container {
          background-color: white;
          color: black;
          font-family: 'Malgun Gothic', 'Dotum', 'Pretendard', sans-serif;
          padding: 10mm 15mm;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .form-title {
          font-size: 1.6rem;
          font-weight: 900;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 25px;
          color: black;
          letter-spacing: -0.02em;
        }

        .official-form-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          color: black;
        }

        .official-form-table td {
          border: 1px solid #000;
          padding: 10px 12px;
          font-size: 0.875rem;
          height: 40px;
          box-sizing: border-box;
          vertical-align: middle;
        }

        .official-form-table .label-cell {
          background-color: #f1f5f9;
          font-weight: 800;
          text-align: center;
        }

        .official-form-table .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          letter-spacing: 0.2em;
          font-size: 0.95rem;
          line-height: 1.4;
          font-weight: 800;
          text-align: center;
        }

        .official-form-table .content-cell {
          font-weight: 600;
        }

        .text-center {
          text-align: center;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          font-weight: 700;
          cursor: pointer;
        }
        .chk-box {
          font-family: monospace;
          font-size: 1.1rem;
          margin-right: 6px;
        }

        .sign-mark {
          float: right;
          margin-right: 20px;
          font-weight: normal;
          color: #555;
        }

        /* Supplies Inner Table */
        .supplies-sub-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
        }

        .supplies-sub-table th, .supplies-sub-table td {
          padding: 5px 10px;
          font-size: 0.8125rem;
          height: 25px;
          border-top: none;
          box-sizing: border-box;
        }

        .supplies-sub-table th {
          background-color: #f8fafc;
          font-weight: 800;
          border-bottom: 2px solid #000;
          border-left: 1px solid #000;
        }

        .supplies-sub-table .sub-num-cell {
          text-align: center;
          font-weight: 700;
          background-color: #f8fafc;
          border-left: none;
          border-right: 1px solid #000;
        }

        .supplies-sub-table .sub-content-cell {
          font-weight: 600;
          border-left: none;
          border-right: 1px solid #000;
        }

        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, .no-print, .navbar, .hide-print {
            display: none !important;
          }
          .print-area-wrapper {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            position: absolute;
            left: 0;
            top: 0;
          }
          .official-form-table {
            border: 2px solid #000 !important;
          }
          .official-form-table td, .supplies-sub-table th, .supplies-sub-table td {
            border-color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
