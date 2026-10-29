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
  const emailBody = `안녕하세요, ${repStudentId} ${repName}입니다.
오픈랩 신청서 제출합니다.

감사합니다.`;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rnassist@hanyang.ac.kr';

  const isGuest = !application.representativeUserId;

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Banner: Guest Info */}
        {isGuest && (
          <div className="guest-promo-banner no-print">
            <span>로그인하면 신청서가 저장되고 다음엔 자동으로 채워져요.</span>
            <Link href="/register" className="banner-link">회원가입</Link>
          </div>
        )}

        <div className="grid-layout">
          {/* Left panel: Actions */}
          <div className="actions-panel no-print">
            <div className="card side-card">
              <h2 className="side-title">신청서 작성 완료</h2>

              <dl className="sum">
                <dt>실습실</dt><dd>{roomName}</dd>
                <dt>일시</dt><dd>{dateStr} {timeStr}</dd>
                <dt>신청자</dt><dd>{repName} ({repStudentId})</dd>
                <dt>인원</dt><dd>{application.participants.length}명</dd>
              </dl>

              <p className="side-hint">
                양식의 칸을 눌러 인쇄 전에 직접 고칠 수 있어요. PDF로 저장한 뒤 메일에 직접 첨부해 보내세요.
              </p>

              <ClientActions 
                adminEmail={adminEmail} 
                subject={emailSubject} 
                body={emailBody} 
                repName={repName}
                date={application.slot.date}
                startTime={application.slot.startTime}
                endTime={application.slot.endTime}
              />
              <div className="side-nav">
                <Link href="/">홈으로</Link>
                {application.representativeUserId && <Link href="/history">내 신청내역</Link>}
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

        .side-card { padding: 18px !important; display: flex; flex-direction: column; gap: 14px; }
        .side-title { font-size: 1.0625rem; font-weight: 800; margin: 0; color: var(--text); }
        .sum { display: grid; grid-template-columns: 52px 1fr; gap: 6px 10px; margin: 0; font-size: 0.875rem; }
        .sum dt { color: var(--sub-text); }
        .sum dd { margin: 0; font-weight: 700; color: var(--text); }
        .side-hint { margin: 0; font-size: 0.8125rem; color: var(--sub-text); line-height: 1.5; border-left: 3px solid #cbd5e1; padding-left: 10px; }
        .email-preview-details summary { cursor: pointer; font-size: 0.8125rem; color: var(--sub-text); list-style: none; }
        .email-preview-details summary::-webkit-details-marker { display: none; }
        .preview-content { margin: 8px 0 0; white-space: pre-wrap; font-family: inherit; font-size: 0.8125rem; color: #475569; line-height: 1.5; background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
        .side-nav { display: flex; gap: 14px; justify-content: center; font-size: 0.8125rem; }
        .side-nav a { color: var(--sub-text); text-decoration: underline; }
      `}} />
    </main>
  );
}
