import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { hasEhrAccess } from '@/lib/ehr-access';
import { createCase, findExamAttempt } from '@/lib/ehr';
import { buildChart } from '@/app/ehr/skills/scn';
import { resolveScn, isExamUser } from '@/lib/ehr-skill';

// 시험용 공용 계정으로 학번·이름을 입력해 응시한다. 같은 학번은 같은 응시 차트로 이어진다.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(await hasEhrAccess(user)) || !(isExamUser(user) || isAdminRole(user.role))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const no = String(b?.no || '').trim();
  const name = String(b?.name || '').trim();
  const scn = String(b?.scn || '');
  if (!/^[0-9A-Za-z-]{4,15}$/.test(no) || name.length < 2 || name.length > 20) return NextResponse.json({ error: 'input' }, { status: 400 });
  const sc = await resolveScn(scn, user.id, true, no);
  if (!sc || !sc.scnId || !sc.exam) return NextResponse.json({ error: 'scn' }, { status: 404 });
  const prev = await findExamAttempt(user.id, sc.scnId, no);
  if (prev) return prev.name === name ? NextResponse.json({ id: prev.id }) : NextResponse.json({ error: 'name' }, { status: 409 });
  const built = buildChart(sc.skill, sc.cfg);
  if (!built) return NextResponse.json({ error: 'bad' }, { status: 400 });
  Object.assign(built.data.info, { sampleKey: `sk:${sc.skill}:${sc.scnId}`, skExam: '1', skScn: sc.scnId, examNo: no, examName: name });
  const id = await createCase(user.id, `[시험] ${sc.title} · ${name}(${no})`, '핵심술기', built.data);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
