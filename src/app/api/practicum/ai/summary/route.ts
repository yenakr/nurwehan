import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { aiConfigured, askModel } from '@/lib/ai';
import { hasChecklistAccess } from '@/lib/checklist-access';
import { takeAiQuota, refundAiQuota } from '@/lib/practicum-ai';
import { getProgress } from '@/lib/practicum';
import { SUBJECTS, LEVELS, normalizeStore } from '@/app/clinical/practicum-data';

// 요약 피드백은 하루 2번까지
const SUM_LIMIT = 2;

const SYSTEM = `너는 간호학과 학생의 임상실습 체크리스트 기록을 보고 피드백해 주는 튜터다. 한국어로, 아래 형식으로 짧게 쓴다.
1) 지금까지 기록에 대한 평가와 격려 1~2문장.
2) "다음에 관찰해 볼 것"을 후보 중에서 3개 골라 각각 "- 항목: 이유 한 줄" 형식으로.
3) 관찰만 한 항목이 있으면 "수행으로 올려 볼 것" 한 가지를 한 문장으로. 없으면 생략한다.
규칙: 후보 목록에 없는 항목은 만들지 않는다. 머리말 라벨이나 # 기호는 쓰지 않는다. 핵심 항목명이나 수치만 **굵게**(별표 두 개로 감싸기) 표시하고, 한 답변에 3곳 이내로 한다. 확실하지 않은 내용은 지침서와 현장 지도자 안내를 우선하라고 짧게 덧붙인다.`;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!(await hasChecklistAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: 'off' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const sub = SUBJECTS.find(s => s.key === body?.subject);
  if (!sub) return NextResponse.json({ error: 'bad' }, { status: 400 });

  // 기록은 클라이언트가 아니라 DB에서 읽는다
  const r = normalizeStore(await getProgress(user.id, sub.key)).r;
  const all = sub.groups.flatMap(g => g.items);
  const seen = all.filter(i => (r[i.id] || []).length > 0);
  if (!seen.length) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const lv = (id: string) =>
    LEVELS.map(l => {
      const n = (r[id] || []).filter(x => x.l === l.k).length;
      return n ? `${l.label}${n}` : '';
    }).filter(Boolean).join(' ');
  const rank = (id: string) => ((r[id] || []).some(x => x.l === 'D') ? 3 : (r[id] || []).some(x => x.l === 'P') ? 2 : 1);

  // 다음 후보: 그룹마다 번갈아 가며 기록이 없는 항목을 최대 8개
  const queues = sub.groups.map(g => g.items.filter(i => !(r[i.id] || []).length));
  const next: string[] = [];
  for (let k = 0; next.length < 8 && queues.some(q => q.length > k); k++) {
    for (const q of queues) if (q[k] && next.length < 8) next.push(q[k].t);
  }
  const up = seen.filter(i => rank(i.id) === 1).slice(0, 3).map(i => i.t);

  const text = [
    `실습: ${sub.title} ${sub.sub} (기록한 항목 ${seen.length}/${all.length})`,
    '기록한 항목:',
    ...seen.slice(0, 60).map(i => `- ${i.t}: ${lv(i.id)}`),
    '다음에 관찰할 후보(아직 기록 없음):',
    ...next.map(t => `- ${t}`),
    ...(up.length ? ['관찰만 한 항목(수행으로 올릴 후보):', ...up.map(t => `- ${t}`)] : []),
  ].join('\n');

  if (!(await takeAiQuota(user.id, '#sum', SUM_LIMIT))) return NextResponse.json({ error: 'limit' }, { status: 429 });
  const out = await askModel(SYSTEM, [{ role: 'user', content: text }], 600);
  if (!out) {
    await refundAiQuota(user.id, '#sum');
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
  return NextResponse.json({ text: out.replace(/^#+\s*/gm, '') });
}
