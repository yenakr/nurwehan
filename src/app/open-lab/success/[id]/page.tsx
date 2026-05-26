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
  const participantsListStr = application.participants.map(p => `${p.name}(${p.studentId})`).join(', ');

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
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Banner: Guest Info */}
        {isGuest && (
          <div className="guest-promo-banner no-print">
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9375rem', fontWeight: '800', color: '#1e3a8a' }}>💡 회원가입 시 더 간편하게 신청하세요!</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#1e40af', lineHeight: '1.4' }}>
                회원가입 후 로그인 상태에서 신청하시면 최근 신청 기록이 남아, 학년과 학번 입력 및 실습 상세 정보를 몇 번의 클릭만으로 자동 완성하실 수 있습니다.
              </p>
            </div>
            <Link href="/register" className="btn-banner-link">회원가입 하기</Link>
          </div>
        )}

        <div className="grid-layout">
          {/* Left panel: Actions */}
          <div className="actions-panel no-print">
            <div className="card success-header-card">
              <span className="success-badge">신청 접수 완료</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '12px 0 6px 0' }}>OPEN LAB 신청이 완료되었습니다!</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', margin: 0, lineHeight: '1.5' }}>
                아래 순서에 따라 신청서를 PDF로 저장하고 관리자 메일로 발송해 주세요.
              </p>
            </div>

            <div className="card instructions-card">
              <h3 className="card-title">📨 메일 발송 가이드</h3>
              <ol className="guide-steps">
                <li>오른쪽의 <strong>[신청서 PDF 다운로드 / 인쇄]</strong> 버튼을 눌러 PDF로 저장하거나 인쇄합니다.</li>
                <li>아래 <strong>[메일 즉시 전송]</strong> 버튼을 누르면 이메일 클라이언트가 열리며 서식이 자동으로 작성됩니다.</li>
                <li>저장한 PDF 신청서를 메일에 첨부한 후 발송합니다.</li>
              </ol>

              <div className="action-buttons-wrap">
                <ClientActions 
                  adminEmail={adminEmail} 
                  subject={emailSubject} 
                  body={emailBody} 
                />
              </div>

              <div className="email-preview-box">
                <div className="preview-header">메일 본문 서식 미리보기</div>
                <pre className="preview-content">{emailBody}</pre>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <Link href="/" className="btn-home-back">홈으로 이동</Link>
                {application.representativeUserId && (
                  <Link href="/history" className="btn-history-back">신청 내역 보기</Link>
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
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .btn-banner-link {
          background-color: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background-color 0.2s;
        }
        .btn-banner-link:hover {
          background-color: #1d4ed8;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
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
          text-align: center;
          padding: 24px !important;
          border-top: 4px solid #10b981 !important;
        }
        .success-badge {
          background-color: #d1fae5;
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .instructions-card {
          margin-top: 16px;
          padding: 24px !important;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 800;
          margin: 0 0 16px 0;
        }

        .guide-steps {
          padding-left: 20px;
          margin: 0 0 24px 0;
          font-size: 0.875rem;
          color: var(--text);
          display: flex;
          flex-direction: column;
          gap: 10px;
          line-height: 1.5;
        }

        .action-buttons-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .email-preview-box {
          margin-top: 20px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background-color: #f8fafc;
          overflow: hidden;
        }
        .preview-header {
          background-color: #edf2f7;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 12px;
          color: var(--sub-text);
          border-bottom: 1px solid var(--border);
        }
        .preview-content {
          margin: 0;
          padding: 12px;
          font-family: monospace;
          font-size: 0.75rem;
          white-space: pre-wrap;
          max-height: 180px;
          overflow-y: auto;
          color: #475569;
          line-height: 1.4;
        }

        .btn-home-back {
          flex: 1;
          background-color: white;
          color: var(--sub-text);
          border: 1px solid var(--border);
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .btn-home-back:hover {
          background-color: #f8fafc;
        }

        .btn-history-back {
          flex: 1;
          background-color: var(--primary);
          color: white;
          border: none;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .btn-history-back:hover {
          opacity: 0.9;
        }
      `}} />
    </main>
  );
}
