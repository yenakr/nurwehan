import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      slot: true,
      skills: { include: { skill: { include: { supplies: true } } } },
      participants: true,
      representativeUser: true,
      usageLogs: {
        where: { submittedBy: session.user.studentId }
      }
    }
  });

  if (!application) notFound();

  // Check if user is a participant or representative
  const isParticipant = application.participants.some(p => p.studentId === session.user.studentId);
  if (!isParticipant && application.representativeUserId !== session.user.id) {
    redirect('/history');
  }

  // Aggregate supplies
  const suppliesMap = new Map<string, { quantity: number; unit: string; note: string | null }>();
  application.skills.forEach(as => {
    as.skill.supplies.forEach(s => {
      const existing = suppliesMap.get(s.supplyName);
      if (existing) {
        existing.quantity += s.quantity;
      } else {
        suppliesMap.set(s.supplyName, { quantity: s.quantity, unit: s.unit, note: s.note });
      }
    });
  });

  const supplies = Array.from(suppliesMap.entries()).map(([name, data]) => ({
    name,
    ...data
  }));



  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', flex: 1 }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/history" style={{ color: 'var(--sub-text)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← 목록으로 돌아가기
          </Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>신청서 작성 상세 정보</h1>
          </div>

          {application.status === 'REJECTED' && application.rejectedReason && (
            <div className="rejection-notice">
              <strong>반려 사유:</strong> {application.rejectedReason}
            </div>
          )}
          
          {application.status === 'CANCELLED' && application.cancelReason && (
            <div className="rejection-notice">
              <strong>취소 사유:</strong> {application.cancelReason}
            </div>
          )}

          <section className="detail-section">
            <h2 className="section-title">기본 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">신청 시각</span>
                <span className="value">{new Date(application.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <div className="detail-item">
                <span className="label">사용 날짜</span>
                <span className="value">{new Date(application.slot.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
              </div>
              <div className="detail-item">
                <span className="label">사용 시간</span>
                <span className="value">{application.slot.startTime} ~ {application.slot.endTime}</span>
              </div>
              <div className="detail-item">
                <span className="label">실습실</span>
                <span className="value">{application.slot.room}</span>
              </div>
              <div className="detail-item">
                <span className="label">신청 학년</span>
                <span className="value">{application.selectedGrade}학년</span>
              </div>
              <div className="detail-item">
                <span className="label">대표 신청자</span>
                <span className="value">
                  {application.representativeUser 
                    ? `${application.representativeUser.name} (${application.representativeUser.studentId})`
                    : `${application.guestName} (${application.guestStudentId}) [비회원]`
                  }
                </span>
              </div>
              <div className="detail-item">
                <span className="label">연락처</span>
                <span className="value">
                  {application.representativeUser ? application.representativeUser.phone : application.guestPhone}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">실습 과목</span>
                <span className="value">{application.subject || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">담당 교수</span>
                <span className="value">{application.professor || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">실습 목적</span>
                <span className="value">{application.purpose || '-'}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">참여 학생 ({application.participants.length}명)</h2>
            <div className="participant-list">
              {application.participants.map(p => (
                <div key={p.id} className="participant-tag">
                  {p.name} ({p.studentId})
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">신청 술기</h2>
            <div className="skill-list">
              {application.skills.map(as => (
                <div key={as.id} className="skill-tag">{as.skill.name}</div>
              ))}
              {application.otherSkillName && (
                <div className="skill-tag other">기타: {application.otherSkillName}</div>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">필요 물품</h2>
            {supplies.length > 0 ? (
              <div className="supplies-table">
                <table>
                  <thead>
                    <tr>
                      <th>품목</th>
                      <th>수량</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplies.map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.name}</td>
                        <td>{s.quantity}{s.unit}</td>
                        <td>{s.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-text">선택된 술기에 연결된 물품이 없습니다.</p>
            )}
          </section>

          <section className="detail-section">
            <h2 className="section-title">추가 요청사항</h2>
            <div className="request-content">
              {application.additionalRequest || '없음'}
            </div>
          </section>

          <div className="actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(application.representativeUserId === session.user.id || application.guestStudentId === session.user.studentId) && (
              <Link href={`/open-lab/success/${application.id}`} className="btn btn-accent" style={{ background: 'var(--accent)', color: 'white' }}>
                신청서 출력 및 이메일 발송 ↗
              </Link>
            )}
            {(application.status === 'PENDING' || application.status === 'APPROVED') && 
             (application.representativeUserId === session.user.id || application.guestStudentId === session.user.studentId) && (
              <Link href={`/open-lab/edit/${application.id}`} className="btn btn-primary">수정하기</Link>
            )}
            <Link href="/history" className="btn btn-outline">목록으로</Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .status-badge {
          font-size: 0.875rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 8px;
        }
        .status-badge.pending { background: #e6f0ff; color: #0052cc; }
        .status-badge.approved { background: #dcfce7; color: #166534; }
        .status-badge.rejected { background: #fee2e2; color: #991b1b; }
        .status-badge.completed { background: #f1f5f9; color: #475569; }
        .status-badge.cancelled { background: #f1f5f9; color: #94a3b8; }

        .rejection-notice {
          padding: 16px;
          background: #fff5f5;
          border-radius: 8px;
          border-left: 4px solid #fa5252;
          color: #c92a2a;
          margin-bottom: 32px;
          font-size: 0.9375rem;
        }

        .detail-section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .label {
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 500;
        }
        .value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
        }

        .participant-list, .skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .participant-tag, .skill-tag {
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .skill-tag.other {
          background: #fff9db;
          color: #e67700;
          border-color: #ffe066;
        }

        .supplies-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .supplies-table th {
          text-align: left;
          padding: 10px;
          border-bottom: 2px solid #f1f5f9;
          color: var(--sub-text);
        }
        .supplies-table td {
          padding: 10px;
          border-bottom: 1px solid #f8fafc;
        }
        
        .request-content {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 0.9375rem;
          color: #475569;
          min-height: 60px;
          white-space: pre-wrap;
        }
        
        .empty-text {
          font-size: 0.875rem;
          color: var(--sub-text);
          font-style: italic;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 40px;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          font-size: 0.9375rem;
          cursor: pointer;
        }
        .btn-primary { background: var(--primary); color: white; border: none; }
        .btn-outline { background: white; color: var(--sub-text); border: 1px solid var(--border); }
      ` }} />
    </main>
  );
}
