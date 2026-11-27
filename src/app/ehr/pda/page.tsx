import { getCurrentUser } from '@/lib/auth';
import { listCases } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import { hasEhrAccess } from '@/lib/ehr-access';
import PdaApp from './PdaApp';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'PDA' };

export default async function PdaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr/pda');
  if (!(await hasEhrAccess(user))) notFound();
  const cases = (await listCases(user.id)).filter(c => !c.discharged);
  const roster = cases.map(c => ({ id: c.id, ward: c.ward || '', bed: c.bed || '', name: c.name || '', ptNo: c.ptNo || '' })).sort((a, b) => `${a.ward}${a.bed}`.localeCompare(`${b.ward}${b.bed}`));
  return <PdaApp roster={roster} userName={user.name} />;
}
