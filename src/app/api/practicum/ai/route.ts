import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { aiConfigured, askModel, type ChatMsg } from '@/lib/ai';
import { hasChecklistAccess } from '@/lib/checklist-access';
import { takeAiQuota, refundAiQuota } from '@/lib/practicum-ai';
import { SUBJECTS } from '@/app/clinical/practicum-data';
import { AI_Q, AI_ANSWER_MAX } from '@/app/clinical/practicum-ai-q';

const LEVEL: Record<string, string> = { O: '관찰', P: '부분수행', D: '수행' };

const COMMON = `규칙:
- 학생이 질문하거나 모르겠다고 하면 핵심을 먼저 직접 설명한다. "찾아보세요", "자료를 참고하세요"처럼 떠넘기지 않는다.
- 머리말이나 "피드백:" 같은 라벨 없이 자연스러운 말투로 쓴다.
- 환자 이름, 병록번호, 나이 등 환자를 알아볼 수 있는 정보가 있으면 이어가지 말고 일반화해서 다시 쓰라고만 한다. 환자의 진단명을 캐묻지 않는다.
- 확실하지 않은 내용은 단정하지 말고, 학교 지침서와 현장 지도자 안내를 우선하라고 짧게 덧붙인다.`;

const SYSTEM = `너는 간호학과 학생의 임상실습을 돕는 튜터다. 학생이 체크리스트에 남긴 기록에 한국어로 답한다. 전체 4문장 이내.
1) 학생 답에 대한 짧은 반응이나 질문에 대한 직접 설명. 2) 필요하면 한 단계 더 깊은 질문 한 문장.
${COMMON}`;

const SYSTEM_FINAL = `너는 간호학과 학생의 임상실습을 돕는 튜터다. 이번이 마지막 답변이다. 한국어로 3문장 이내. 학생의 질문이 있으면 직접 설명하고 핵심을 정리한다. 새 질문은 하지 않는다.
${COMMON}`;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!(await hasChecklistAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: 'off' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const sub = SUBJECTS.find(s => s.key === body?.subject);
  const item = sub?.groups.flatMap(g => g.items).find(i => i.id === body?.item);
  const level = LEVEL[body?.level as string];
  if (!sub || !item || !level) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const answer = typeof body?.answer === 'string' ? body.answer.trim().slice(0, AI_ANSWER_MAX) : '';
  if (!answer) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (!(await takeAiQuota(user.id))) return NextResponse.json({ error: 'limit' }, { status: 429 });
  const q = AI_Q[body.level as 'O' | 'P' | 'D'];
  const prevA = typeof body?.prevA === 'string' ? body.prevA.trim().slice(0, AI_ANSWER_MAX) : '';
  const prevF = typeof body?.prevF === 'string' ? body.prevF.trim().slice(0, 400) : '';
  const second = !!(prevA && prevF);
  const msgs: ChatMsg[] = second
    ? [
        { role: 'user', content: `항목: ${item.t} (${level})\n질문: ${q}\n학생 답: ${prevA}` },
        { role: 'assistant', content: prevF },
        { role: 'user', content: `학생 답: ${answer}` },
      ]
    : [{ role: 'user', content: `항목: ${item.t} (${level})\n질문: ${q}\n학생 답: ${answer}` }];
  const text = await askModel(second ? SYSTEM_FINAL : SYSTEM, msgs);
  if (!text) {
    await refundAiQuota(user.id);
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
  return NextResponse.json({ text: text.replace(/^(피드백|답변)\s*[:：]\s*/, '') });
}
