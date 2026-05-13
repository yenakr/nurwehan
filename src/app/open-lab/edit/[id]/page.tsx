import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditForm from './EditForm';

export const dynamic = 'force-dynamic';

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      slot: true,
      skills: true,
      participants: true
    }
  });

  if (!application) notFound();

  // Security: Only representative can edit
  if (application.representativeUserId !== session.user.id) {
    redirect('/history');
  }

  // Security: Only PENDING can be edited
  if (application.status !== 'PENDING') {
    redirect(`/history/${id}`);
  }

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', flex: 1 }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>신청 내용 수정</h1>
          <p style={{ color: 'var(--sub-text)', marginTop: '8px' }}>승인 대기 중인 신청 건의 날짜, 시간, 술기 등을 변경할 수 있습니다.</p>
        </div>

        <EditForm 
          user={session.user as any} 
          application={application as any} 
        />
      </div>
    </main>
  );
}
