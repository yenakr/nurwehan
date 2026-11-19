import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { aiConfigured, askModel, type ChatMsg } from '@/lib/ai';
import { takeAiQuota } from '@/lib/practicum-ai';
import { SUBJECTS } from '@/app/clinical/practicum-data';
import { AI_Q, AI_ANSWER_MAX } from '@/app/clinical/practicum-ai-q';

const LEVEL: Record<string, string> = { O: '관찰', P: '부분수행', D: '수행' };

const SYSTEM = `간호학과 학생의 실습 기록에 답한다. 한국어로 2문장 이내.
1) 학생 답에 대한 짧은 피드백 한 문장. 2) 한 단계 더 깊은 질문 한 문장.
환자 이름, 병록번호, 나이 등 환자를 알아볼 수 있는 정보가 있으면 이어가지 말고 일반화해서 다시 쓰라고만 한다. 환자의 진단명을 캐묻지 않는다. 확실하지 않으면 지침서와 현장 지도자 안내를 우선하라고 한다.`;

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
  const answer = typeof body?.answer === 'string' ? body.answer.trim().slice(0, AI_ANSWER_MAX) : '';
  if (!answer) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (!(await takeAiQuota(user.id))) return NextResponse.json({ error: 'limit' }, { status: 429 });
  const msgs: ChatMsg[] = [
    { role: 'user', content: `항목: ${item.t} (${level})\n질문: ${AI_Q[body.level as 'O' | 'P' | 'D']}\n학생 답: ${answer}` },
  ];
  const text = await askModel(SYSTEM, msgs);
  return text ? NextResponse.json({ text }) : NextResponse.json({ error: 'failed' }, { status: 502 });
}
