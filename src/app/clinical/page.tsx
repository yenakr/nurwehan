import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ClinicalClient from './ClinicalClient';

export default async function ClinicalPage() {
  const user = await getCurrentUser();

  const healthRequirements = await prisma.healthRequirement.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { name: 'asc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <ClinicalClient healthRequirements={healthRequirements} user={user} />
      </div>
    </main>
  );
}
