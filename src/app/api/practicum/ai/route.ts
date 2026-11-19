import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { aiConfigured, askModel, type ChatMsg } from '@/lib/ai';
import { takeAiQuota } from '@/lib/practicum-ai';
import { SUBJECTS } from '@/app/clinical/practicum-data';

const LEVEL: Record<string, string> = { O: '관찰', P: '부분수행', D: '수행' };

const SYSTEM = `너는 간호학과 학생의 임상실습 학습을 돕는 튜터다. 학생이 체크리스트에 기록한 항목을 바탕으로 한국어로 짧게 답한다.
규칙:
- 한 번에 질문은 하나만 한다. 전체 답변은 3문장 이내.
- 학생 답이 있으면 먼저 한 문장으로 짧게 피드백하고, 한 단계 더 깊은 질문을 한다. 두 번째 답 이후에는 질문 없이 핵심 정리만 한다.
- 질문은 정상 기준, 이유, 근거, 다음에 확인할 점처럼 학습 중심으로 한다. 환자의 진단명이나 개인 정보를 직접 캐묻지 않는다.
- 학생 답에 환자 이름, 병록번호, 나이, 병실 등 환자를 알아볼 수 있는 정보가 있으면 이어가지 말고, 일반화해서 다시 쓰라고만 안내한다.
- 확실하지 않은 내용은 단정하지 않고, 학교 지침서와 현장 지도자의 안내를 우선하라고 덧붙인다.`;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!aiConfigured()) return NextResponse.json({ error: 'off' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const sub = SUBJECTS.find(s => s.key === body?.subject);
  const item = sub?.groups.flatMap(g => g.items).find(i => i.id === body?.item);
  const level = LEVEL[body?.level as string];
  if (!sub || !item || !level) return NextResponse.json({ error: 'bad' }, { status: 400 });
  // 학생 답변은 최대 2개, 각 300자. 서버는 저장하지 않는다.
  const answers: string[] = Array.isArray(body?.answers)
    ? body.answers.filter((a: unknown) => typeof a === 'string' && a.trim()).slice(0, 2).map((a: string) => a.trim().slice(0, 300))
    : [];
  if (!(await takeAiQuota(user.id))) return NextResponse.json({ error: 'limit' }, { status: 429 });
  const msgs: ChatMsg[] = [{ role: 'user', content: `[기록] 항목: ${item.t} / 단계: ${level}\n이 기록에 대한 질문을 해 주세요.` }];
  const prev: string[] = Array.isArray(body?.asked) ? body.asked.filter((a: unknown) => typeof a === 'string').slice(0, 2).map((a: string) => a.slice(0, 600)) : [];
  answers.forEach((a, i) => {
    if (prev[i]) msgs.push({ role: 'assistant', content: prev[i] });
    msgs.push({ role: 'user', content: a });
  });
  const text = await askModel(SYSTEM, msgs);
  return text ? NextResponse.json({ text }) : NextResponse.json({ error: 'failed' }, { status: 502 });
}
