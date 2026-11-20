import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { getCase } from '@/lib/ehr';
import { createVirtual } from '@/lib/ehr-class';
import { SAMPLES } from '@/app/ehr/samples';
import { emptyChart, migrate } from '@/app/ehr/types';
import { newPtNo } from '@/app/ehr/directory';
import { findPhi } from '@/app/ehr/phi';

// 새 가상환자: 예시 차트(sample), 내 차트(case), 빈 차트(blank)에서 만든다
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const classId = typeof b.classId === 'string' && b.classId ? b.classId : null;
  let data = emptyChart();
  if (b.from === 'sample') {
    const sp = SAMPLES.find(x => x.key === b.key);
    if (!sp) return NextResponse.json({ error: 'bad' }, { status: 400 });
    data = migrate(JSON.parse(JSON.stringify(sp.data)));
    data.info.ptNo = newPtNo();
  } else if (b.from === 'case') {
    const row = await getCase(user.id, String(b.key || ''));
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    data = migrate(JSON.parse(JSON.stringify(row.data)));
    for (const k of ['submitted', 'reviewed', 'comment', 'discharged', 'sampleKey']) delete data.info[k];
  } else {
    data.info = { ward: typeof b.ward === 'string' ? b.ward : '', bed: typeof b.bed === 'string' ? b.bed : '', ptNo: newPtNo() };
  }
  if (findPhi(data).length) return NextResponse.json({ error: 'phi' }, { status: 422 });
  const id = await createVirtual(data, classId);
  if (!id) return NextResponse.json({ error: 'failed' }, { status: 500 });
  return NextResponse.json({ id });
}
