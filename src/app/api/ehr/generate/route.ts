import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { aiConfigured, askModel } from '@/lib/ai';
import { takeAiQuota, refundAiQuota } from '@/lib/practicum-ai';
import { EHR_CASE_LIMIT } from '@/lib/ehr-access';
import { createCase } from '@/lib/ehr';
import { emptyChart, type Row } from '@/app/ehr/types';
import { findPhi } from '@/app/ehr/phi';
import { DEPTS, DOCTORS } from '@/app/ehr/directory';
import { WARDS } from '@/app/ehr/samples';

const SYS = `너는 간호학과 학생이 EHR 기록 연습에 쓸 가상 환자 사례를 만든다. 반드시 JSON 객체 하나만 출력한다. 설명, 코드블록 표시는 쓰지 않는다.
모든 내용은 가상이다. 이름은 증상이나 진단을 떠올리게 하는 흔한 한국식 가명(예: 김심장)으로 짓고 실제 인물, 실제 번호, 연락처를 쓰지 않는다.
현실적인 임상 수치를 쓴다. 학생이 이상 수치를 찾아 간호기록을 쓸 수 있도록 일부 활력징후와 검사 수치는 정상 범위를 벗어나게 한다. 간호기록, 간호진단, 해답은 만들지 않는다.
형식:
{"name":"","ageSex":"72/F","dept":"CV","dx":"","cc":"","onset":"","hpi":"","pmh":"","allergy":"무","pe":"","plan":"",
"vitals":[{"time":"08:00","bp":"152/94","hr":"104","rr":"24","bt":"36.8","spo2":"90","pain":"0"}],
"labs":[{"name":"Hb (Hemoglobin)","value":"10.2","unit":"g/dL","min":"12.0","max":"16.0","sample":"Blood"}],
"orders":[{"name":"","dose":"","unit":"","cnt":"","route":"","st":""}]}
dept는 CV PUL GE EN GS OS NS OB PD PSY ER 중 하나. vitals 3~4개(시간은 HH:MM), labs 4~6개, orders 4~6개. onset은 증상 시작 날짜(YYYY-MM-DD 또는 비움).`;

const s = (v: unknown, n = 500) => (typeof v === 'string' ? v.slice(0, n) : '');
const list = (v: unknown, keys: string[], max: number): Row[] =>
  (Array.isArray(v) ? v : []).slice(0, max).map(x => Object.fromEntries(keys.map(k => [k, s((x as Record<string, unknown>)?.[k], 200)]))).filter(r => Object.values(r).some(Boolean));

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(await hasEhrAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: 'off' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const wardName = s(body?.ward, 20);
  const bed = s(body?.bed, 10);
  const hint = s(body?.hint, 60);
  const kind = body?.kind === 'er' ? 'er' : body?.kind === 'op' ? 'op' : 'ward';
  const w = WARDS.find(x => x.name === wardName);
  if (kind === 'ward' && (!w || !bed)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (kind !== 'ward' && wardName !== (kind === 'er' ? '응급실' : '외래')) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (!(await takeAiQuota(user.id, '#ehrgen', EHR_CASE_LIMIT))) return NextResponse.json({ error: 'limit' }, { status: 429 });

  const ask = kind === 'ward' ? `병동 진료과: ${w!.dept}. 입원 환자 1명.` : kind === 'er' ? '응급실 내원 환자 1명.' : '외래 내원 환자 1명.';
  const out = await askModel(SYS, [{ role: 'user', content: `${ask}${hint ? ` 요청: ${hint}` : ''}` }], 1800);
  const m = out?.match(/\{[\s\S]*\}/);
  let j: Record<string, unknown> | null = null;
  try { j = m ? JSON.parse(m[0]) : null; } catch { j = null; }
  if (!j || !s(j.dx) || !s(j.name)) {
    await refundAiQuota(user.id, '#ehrgen');
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }

  const ymd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const hm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16);
  const dept = DEPTS.some(d => d.code === j!.dept) ? String(j.dept) : kind === 'er' ? 'ER' : DEPTS[0].code;
  const doc = DOCTORS.find(d => d.dept === dept)?.name || '';
  const d = emptyChart();
  d.info = {
    ward: wardName, ...(kind === 'ward' ? { bed } : {}), ptNo: String(1000 + (Date.now() % 9000)), admit: ymd, dept, doctor: doc,
    name: s(j.name, 20), ageSex: s(j.ageSex, 10), allergy: s(j.allergy, 100) || '무', dx: s(j.dx, 200), cc: s(j.cc, 200), onset: s(j.onset, 20),
    hpi: s(j.hpi, 900), pmh: s(j.pmh, 400), pe: s(j.pe, 600), plan: s(j.plan, 500),
    ...(kind !== 'ward' ? { visitTime: hm, vstatus: kind === 'er' ? '대기' : '접수' } : {}),
    ...(kind === 'er' ? { ktas: '3', zone: '응급' } : {}),
  };
  d.vitals = list(j.vitals, ['time', 'bp', 'hr', 'rr', 'bt', 'spo2', 'pain'], 6);
  d.labs = list(j.labs, ['name', 'value', 'unit', 'min', 'max', 'sample'], 8).map(r => ({ ...r, time: `${ymd.slice(5)} 06:00` }));
  d.orders = [
    { kind: 'sec', name: '▶ 기본처방 ◀' },
    { name: 'Check V/S q [8] hrs', dose: '', unit: '', cnt: '', route: '', st: '', ck: '1' },
    { name: 'Check I/O q [24] hrs', dose: '', unit: '', cnt: '', route: '', st: '', ck: '1' },
    ...list(j.orders, ['name', 'dose', 'unit', 'cnt', 'route', 'st'], 8).map(r => ({ ...r, ck: '' })),
  ];
  if (findPhi(d).length) {
    await refundAiQuota(user.id, '#ehrgen');
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
  const id = await createCase(user.id, `AI · ${d.info.dx}`.slice(0, 100), wardName, d);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
