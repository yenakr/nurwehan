import { getCurrentUser } from '@/lib/auth';
import LabApplyHelperClient from './LabApplyHelperClient';

export default async function LabApplyHelperPage() {
  const user = await getCurrentUser();

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <LabApplyHelperClient user={user} />
      </div>
    </main>
  );
}
