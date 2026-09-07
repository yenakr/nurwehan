import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminClinicalClient from './AdminClinicalClient';

export default async function AdminClinicalPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin/clinical');
  }

  const requirements = await prisma.healthRequirement.findMany({
    include: { rules: true },
    orderBy: { name: 'asc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <AdminClinicalClient initialRequirements={requirements} />
      </div>
    </main>
  );
}
