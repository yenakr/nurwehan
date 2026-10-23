import { getCurrentUser } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import UserList from './UserList';
import { getTiers } from '@/lib/access';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const users = await prisma.user.findMany({
    where: {
      role: {
        notIn: isSuperAdmin(user.role) ? ['SUPER_ADMIN'] : ['ADMIN', 'SUPER_ADMIN', 'ASSISTANT']
      }
    },
    include: {
      restrictions: {
        where: {
          isActive: true,
          endDate: { gte: new Date() }
        }
      },
      warnings: true
    },
    orderBy: [
      { grade: 'asc' },
      { studentId: 'asc' }
    ]
  });

  const superAdmin = isSuperAdmin(user.role);
  const tiers = superAdmin ? await getTiers() : {};
  const withTier = users.map(u => ({ ...u, tier: tiers[u.id] ?? 0 }));

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
          학생 관리
        </h1>
        <UserList initialUsers={withTier as any} superAdmin={superAdmin} />
      </div>
    </main>
  );
}
