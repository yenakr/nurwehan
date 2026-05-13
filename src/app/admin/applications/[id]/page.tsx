import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ApplicationStatusActions from './ApplicationStatusActions';

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      representativeUser: true,
      slot: true,
      skills: {
        include: { skill: { include: { supplies: true } } }
      },
      participants: true,
    }
  });

  if (!application) notFound();

  // Aggregate supplies from all skills
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
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/admin/applications" style={{ color: 'var(--sub-text)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← 신청 현황 목록으로
          </Link>
          <span className={`badge badge-${application.status.toLowerCase()}`} style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
            {application.status === 'PENDING' ? '대기 중' : application.status === 'APPROVED' ? '승인 완료' : 
             application.status === 'REJECTED' ? '반려됨' : application.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>신청 상세 내역</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>신청자 (대표)</label>
                <div style={{ fontWeight: '600' }}>{application.representativeUser.name} ({application.representativeUser.studentId})</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>{application.representativeUser.phone}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>사용 일시</label>
                <div style={{ fontWeight: '600' }}>{new Date(application.slot.date).toLocaleDateString('ko-KR')}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>{application.slot.startTime} ~ {application.slot.endTime}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>실습실</label>
                <div style={{ fontWeight: '600' }}>{application.slot.room}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>선택 학년</label>
                <div style={{ fontWeight: '600' }}>{application.selectedGrade || application.representativeUser.grade}학년</div>
              </div>
            </div>
          </div>

          {/* Skills & Supplies Section */}
          <div className="card">
            <h2 className="section-title">신청 술기 및 필요물품</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>선택 술기</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {application.skills.map(as => (
                  <span key={as.id} style={{ backgroundColor: 'var(--muted-background)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                    {as.skill.name}
                  </span>
                ))}
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>필요물품 목록 (자동 합산)</label>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>품목명</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>수량</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>단위</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.length > 0 ? supplies.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{s.name}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', textAlign: 'center' }}>{s.quantity}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{s.unit}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{s.note || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--sub-text)' }}>등록된 준비물이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>학생 추가 요청사항</label>
              <div style={{ backgroundColor: '#fff9db', padding: '16px', borderRadius: '4px', fontSize: '0.9375rem', border: '1px solid #ffe066' }}>
                {application.additionalRequest || '추가 요청사항이 없습니다.'}
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="card">
            <h2 className="section-title">참여 학생 명단 ({application.participants.length}명)</h2>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학번</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>이름</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>역할</th>
                  </tr>
                </thead>
                <tbody>
                  {application.participants.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{p.studentId}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                        {p.studentId === application.representativeUser.studentId ? '대표자' : '참여학생'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions Section */}
          <ApplicationStatusActions 
            applicationId={application.id} 
            currentStatus={application.status} 
            rejectedReason={application.rejectedReason} 
          />
        </div>
      </div>
    </main>
  );
}
