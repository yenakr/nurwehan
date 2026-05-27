import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintableApplicationForm from '@/components/PrintableApplicationForm';
import ClientActions from './ClientActions';

export const dynamic = 'force-dynamic';

export default async function OpenLabSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      slot: true,
      skills: { include: { skill: { include: { supplies: true } } } },
      participants: true,
      representativeUser: true
    }
  });

  if (!application) notFound();

  // Aggregate supplies from skills (scaled by participant count)
  const participantCount = application.participants.length || 1;
  const suppliesMap = new Map<string, { quantity: number; unit: string; note: string | null }>();
  application.skills.forEach(as => {
    as.skill.supplies.forEach(s => {
      const existing = suppliesMap.get(s.supplyName);
      const scaledQuantity = s.quantity * participantCount;
      if (existing) {
        existing.quantity += scaledQuantity;
      } else {
        suppliesMap.set(s.supplyName, { quantity: scaledQuantity, unit: s.unit, note: s.note });
      }
    });
  });

  const supplies = Array.from(suppliesMap.entries()).map(([name, data]) => ({
    name,
    ...data
  }));

  // Contact details
  const repName = application.representativeUser?.name || application.guestName || '';
  const repStudentId = application.representativeUser?.studentId || application.guestStudentId || '';
  const repPhone = application.representativeUser?.phone || application.guestPhone || '';
  const repGrade = application.representativeUser?.grade || application.guestGrade || '';
  const roomName = application.slot.room;
  const dateStr = new Date(application.slot.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/ /g, '');
  const timeStr = `${application.slot.startTime} ~ ${application.slot.endTime}`;

  const suppliesListStr = supplies.map(s => `   - ${s.name}: ${s.quantity}${s.unit}`).join('\n') || '   - 없음';
  const participantsListStr = application.participants.map(p => p.name).join(', ');

  const emailSubject = `[OPEN LAB 신청] ${repGrade}학년_${roomName}_${repName}`;
  const emailBody = `안녕하세요, OPEN LAB 사용 신청 내역입니다.

1. 신청일: ${new Date(application.createdAt).toLocaleDateString('ko-KR')}
2. 신청자: ${repName} (학번: ${repStudentId})
3. 연락처: ${repPhone}
4. 실습실: ${roomName}
5. 실습날짜 및 시간: ${dateStr} ${timeStr}
6. 실습과목 및 담당교수: ${application.subject || '-'} / ${application.professor || '-'} 교수님
7. 사용 인원 및 명단: ${application.participants.length}명 (${participantsListStr})
8. 실습 목적: ${application.purpose || '-'}
9. 필요 물품:
${suppliesListStr}
10. 추가 요청사항: ${application.additionalRequest || '없음'}

* 위 서식에 서명(또는 인)이 완료된 신청서 PDF 파일을 첨부하여 송신해주시기 바랍니다.`;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'nursing_lab@hanyang.ac.kr';

  const isGuest = !application.representativeUserId;

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Banner: Guest Info */}
        {isGuest && (
          <div className="guest-promo-banner no-print">
            <span>회원가입 후 로그인하여 신청하시면 신청 내역 저장 및 자동 완성 기능을 이용하실 수 있습니다.</span>
            <Link href="/register" className="banner-link">회원가입</Link>
          </div>
        )}

        <div className="grid-layout">
          {/* Left panel: Actions */}
          <div className="actions-panel no-print">
            <div className="card success-header-card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text)' }}>신청서 작성 완료</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', margin: 0, lineHeight: '1.5' }}>
                작성된 신청서를 다운로드하여 아래 절차에 따라 이메일로 제출해 주시기 바랍니다.
              </p>
            </div>

            <div className="card instructions-card">
              {/* Summary List */}
              <div className="summary-list">
                <div className="summary-title">신청 정보 요약</div>
                <div className="summary-grid">
                  <span className="summary-label">실습실</span>
                  <span className="summary-value">{roomName}</span>
                  
                  <span className="summary-label">실습일시</span>
                  <span className="summary-value">{dateStr} {timeStr}</span>
                  
                  <span className="summary-label">신청자</span>
                  <span className="summary-value">{repName} ({repStudentId})</span>
                  
                  <span className="summary-label">총 인원</span>
                  <span className="summary-value">{application.participants.length}명</span>
                </div>
              </div>

              <h3 className="card-title">제출 안내</h3>
              
              <div className="warning-note">
                PDF 파일은 메일에 자동 첨부되지 않으니 직접 첨부해 주세요.
              </div>

              <div className="warning-note" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                참고: 오른쪽 신청서 양식의 각 칸(과목, 이름, 목적, 필요물품 등)을 직접 클릭하여 인쇄 전에 자유롭게 수정하실 수 있습니다.
              </div>

              <ol className="guide-steps">
                <li><strong>신청서 PDF 다운로드</strong>: 아래 버튼을 클릭하여 작성된 신청서를 PDF로 저장합니다.</li>
                <li><strong>제출 이메일 준비</strong>: 메일 앱을 열거나 본문을 복사하여 제출용 이메일을 준비합니다.</li>
                <li><strong>신청서 첨부 및 발송</strong>: 저장한 PDF 파일을 메일에 직접 첨부한 후 발송을 완료합니다.</li>
              </ol>

              <ClientActions 
                adminEmail={adminEmail} 
                subject={emailSubject} 
                body={emailBody} 
              />

              <details className="email-preview-details">
                <summary className="preview-summary">
                  이메일 본문 미리보기
                </summary>
                <div className="preview-body">
                  <pre className="preview-content">{emailBody}</pre>
                </div>
              </details>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <Link href="/" className="btn-nav-secondary">홈으로</Link>
                {application.representativeUserId && (
                  <Link href="/history" className="btn-nav-secondary">내 신청내역</Link>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: High-fidelity PDF form */}
          <div className="form-panel">
            <PrintableApplicationForm 
              application={application as any} 
              supplies={supplies} 
            />
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .guest-promo-banner {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          color: #475569;
        }
        .banner-link {
          color: #0E4A84;
          font-weight: 700;
          text-decoration: underline;
          margin-left: 12px;
          white-space: nowrap;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
          .form-panel {
            overflow-x: auto;
            background: white;
            padding: 10px;
            border-radius: 12px;
          }
        }

        .success-header-card {
          padding: 24px !important;
          border-top: 4px solid #0E4A84 !important;
        }

        .instructions-card {
          margin-top: 16px;
          padding: 24px !important;
        }
        
        .summary-list {
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background-color: #f8fafc;
          font-size: 0.875rem;
        }
        .summary-title {
          font-weight: 800;
          color: var(--text);
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 8px 16px;
          line-height: 1.4;
        }
        .summary-label {
          color: var(--sub-text);
          font-weight: 600;
        }
        .summary-value {
          font-weight: 700;
          color: var(--text);
        }

        .card-title {
          font-size: 1rem;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: var(--text);
        }

        .warning-note {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #475569;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.4;
        }

        .guide-steps {
          list-style-type: decimal;
          padding-left: 20px;
          margin: 0 0 20px 0;
          font-size: 0.8125rem;
          color: var(--text);
          display: flex;
          flex-direction: column;
          gap: 8px;
          line-height: 1.5;
        }

        .email-preview-details {
          margin-top: 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
        }
        .preview-summary {
          padding: 10px 14px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          background: #f8fafc;
          user-select: none;
          color: #475569;
        }
        .preview-summary:hover {
          background: #edf2f7;
        }
        .preview-body {
          background-color: #fff;
          padding: 12px;
          border-top: 1px solid #cbd5e1;
        }
        .preview-content {
          margin: 0;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.5;
          max-height: 150px;
          overflow-y: auto;
        }

        .btn-nav-secondary {
          flex: 1;
          background-color: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .btn-nav-secondary:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          color: #1e293b;
        }
      `}} />
    </main>
  );
}
