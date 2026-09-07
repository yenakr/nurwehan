import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import CareerClient from './CareerClient';

export default async function CareerPage() {
  const user = await getCurrentUser();

  const careerInfos = await prisma.careerInfo.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <CareerClient careerInfos={careerInfos} user={user} />
      </div>
    </main>
  );
}
