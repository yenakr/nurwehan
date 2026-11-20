import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { listSubmittedCases } from '@/lib/ehr';

export const dynamic = 'force-dynamic';

const fmt = (s: string) => new Date(s).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function AdminEhrPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr');
  const rows = await listSubmittedCases();
  const users = await prisma.user.findMany({ where: { id: { in: Array.from(new Set(rows.map(r => r.userId))) } }, select: { id: true, name: true, studentId: true } }).catch(() => []);
  const nm = new Map(users.map(u => [u.id, u]));

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>EHR 제출 기록</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link href="/ehr" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>학생 화면 보기</Link>
          <Link href="/admin/ehr/classes" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>분반 관리</Link>
          <Link href="/admin/ehr/patients" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>가상환자 관리</Link>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {rows.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'var(--sub-text)' }}>제출된 차트가 없어요.</p>}
          {rows.map((r, i) => {
            const u = nm.get(r.userId);
            return (
              <Link key={r.id} href={`/admin/ehr/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <span>
                  <b>{u ? `${u.name} (${u.studentId})` : '알 수 없음'}</b>
                  <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{r.title} · {fmt(r.submitted)}</span>
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: r.reviewed ? '#2f7a46' : 'var(--primary)', whiteSpace: 'nowrap' }}>{r.reviewed ? '확인 완료' : '확인 대기'}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
