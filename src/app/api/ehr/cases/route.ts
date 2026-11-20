import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { hasChecklistAccess } from '@/lib/checklist-access';
import { aiConfigured, askModel } from '@/lib/ai';
import { takeAiQuota, refundAiQuota } from '@/lib/practicum-ai';
import { cleanScenario, createCase, listCases } from '@/lib/ehr';

async function who() {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) return null;
  if (!(await hasChecklistAccess(user))) return null;
  return user;
}

export async function GET() {
  const user = await who();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ cases: await listCases(user.id), ai: aiConfigured() });
}

const SYSTEM = `너는 간호학과 학생의 기록 연습용 가상 환자 사례를 만든다. 실제 환자가 아닌 완전히 지어낸 사례이며 이름은 쓰지 않는다.
반드시 아래 JSON 객체 하나만 출력한다. 설명, 코드블록, 머리말은 쓰지 않는다. 모든 값은 문자열이고 한국어로 쓴다.
{"title":"사례 제목(진단 위주 20자 이내)",
"patient":{"age":"숫자","sex":"남 또는 여","dx":"진단명","cc":"주호소","history":"과거력과 입원 경위 1~2문장","allergy":"알레르기 또는 없음","day":"예: 입원 2일째 낮번"},
"vitals":[{"t":"HH:MM","sbp":"","dbp":"","hr":"","rr":"","bt":"","spo2":""}],
"io":[{"t":"HH:MM","inn":"ml 숫자","out":"ml 숫자"}],
"orders":[{"drug":"약 이름","dose":"용량","route":"경로","freq":"횟수"}],
"labs":[{"name":"검사명","value":"결과","ref":"정상 범위"}],
"situation":"근무 중 간호사가 관찰한 상황 4~6문장. 증상 변화, 환자 반응, 시행한 간호 등 기록할 거리가 있게."}
조건: vitals 3개(시간 순서, 실제로 변화가 보이게), io 3개, orders 3~4개, labs 3~5개. 수치는 사례와 일관되게 현실적으로. 환자에게 위험한 징후를 한 가지쯤 자연스럽게 포함해 학생이 알아채고 기록하게 한다. 진단·처방을 학생에게 지시하는 문장은 쓰지 않는다.`;

export async function POST(req: Request) {
  const user = await who();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: 'off' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const topic = typeof body?.topic === 'string' ? body.topic.trim().slice(0, 40) : '';
  const level = body?.level === 'hard' ? '어려움(복합 문제가 있음)' : body?.level === 'easy' ? '쉬움(단순한 경과)' : '보통';
  if (!topic) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (!(await takeAiQuota(user.id, '#ehr', 5))) return NextResponse.json({ error: 'limit' }, { status: 429 });
  const text = await askModel(SYSTEM, [{ role: 'user', content: `주제: ${topic}\n난이도: ${level}` }], 1800);
  let parsed: ReturnType<typeof cleanScenario> = null;
  if (text) {
    const m = text.replace(/```(?:json)?/g, '').match(/\{[\s\S]*\}/);
    try { parsed = m ? cleanScenario(JSON.parse(m[0])) : null; } catch { parsed = null; }
  }
  if (!parsed) {
    await refundAiQuota(user.id, '#ehr');
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
  const id = await createCase(user.id, parsed.title, parsed.scenario);
  if (!id) {
    await refundAiQuota(user.id, '#ehr');
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
  return NextResponse.json({ id });
}
