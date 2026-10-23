import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/auth-core';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(s: string, n: number) {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function normShift(v: string): string | null | undefined {
  const t = v.trim().toLowerCase();
  if (!t || t === '-') return null;
  if (['day', 'd', '데이'].includes(t)) return 'Day';
  if (['eve', 'e', 'evening', '이브닝', '이브'].includes(t)) return 'Eve';
  return undefined; // 인식 불가
}

/**
 * 붙여넣은 표(탭 또는 쉼표)를 학기 단위로 통째로 교체한다.
 * 열 순서: 이름, 조, 주차, 과목, 병원, 병동, 근무(Day/Eve/빈칸), 학번(선택 · 동명이인만)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { term, week1Start, text, dryRun } = await req.json();
    if (!dryRun && !isSuperAdmin(user.role)) {
      return NextResponse.json({ error: '시스템관리자만 등록할 수 있습니다.' }, { status: 403 });
    }
    const termName = String(term || '').trim();
    if (!termName) return NextResponse.json({ error: '학기 이름이 필요합니다. (예: 2027-1)' }, { status: 400 });
    if (!DATE_RE.test(String(week1Start || ''))) {
      return NextResponse.json({ error: '1주차 시작일(월요일)을 입력해 주세요.' }, { status: 400 });
    }
    if (new Date(week1Start + 'T00:00:00Z').getUTCDay() !== 1) {
      return NextResponse.json({ error: '1주차 시작일은 월요일이어야 합니다.' }, { status: 400 });
    }

    const errors: string[] = [];
    const rows: {
      term: string; name: string; studentId: string | null; groupNo: number; weekNo: number; startDate: string; endDate: string;
      subject: string; hospital: string; ward: string; shift: string | null;
    }[] = [];

    String(text || '')
      .split(/\r?\n/)
      .forEach((raw, idx) => {
        const line = raw.trim();
        if (!line) return;
        const cells = (line.includes('\t') ? line.split('\t') : line.split(',')).map(c => c.trim());
        if (idx === 0 && cells[0] === '이름') return; // 머리글
        const [name, g, w, subject, hospital, ward, shiftRaw = '', sid = ''] = cells;
        const lineNo = idx + 1;
        const groupNo = Number(g);
        const weekNo = Number(w);
        const shift = normShift(shiftRaw);
        if (!name || !subject || !hospital || !ward) return void errors.push(`${lineNo}번째 줄: 이름·과목·병원·병동이 비어 있어요`);
        if (!Number.isInteger(groupNo) || groupNo < 1) return void errors.push(`${lineNo}번째 줄: 조가 숫자가 아니에요`);
        if (!Number.isInteger(weekNo) || weekNo < 1 || weekNo > 20) return void errors.push(`${lineNo}번째 줄: 주차가 올바르지 않아요`);
        if (shift === undefined) return void errors.push(`${lineNo}번째 줄: 근무는 Day / Eve / 빈칸 중 하나예요`);
        const start = addDays(week1Start, 7 * (weekNo - 1));
        rows.push({ term: termName, name, studentId: sid || null, groupNo, weekNo, startDate: start, endDate: addDays(start, 4), subject, hospital, ward, shift });
      });

    // 동명이인 의심: 같은 사람(학번 또는 이름)이 같은 주에 서로 다른 곳에 배정돼 있으면 학번이 필요하다
    const seen = new Map<string, string>();
    const dupNames = new Set<string>();
    rows.forEach(r => {
      const key = `${r.studentId || r.name}|${r.weekNo}`;
      const place = `${r.subject}|${r.hospital}|${r.ward}|${r.shift}`;
      const prev = seen.get(key);
      if (prev && prev !== place) dupNames.add(r.name);
      else seen.set(key, place);
    });
    dupNames.forEach(n => errors.push(`'${n}' 이름이 같은 주에 서로 다른 곳에 배정돼 있어요. 동명이인이면 8번째 열에 학번을 적어 주세요`));

    if (errors.length) {
      return NextResponse.json({ error: '입력을 확인해 주세요.', details: errors.slice(0, 10) }, { status: 400 });
    }
    if (!rows.length) return NextResponse.json({ error: '입력된 행이 없어요.' }, { status: 400 });

    const students = new Set(rows.map(r => r.name)).size;
    const weeks = new Set(rows.map(r => r.weekNo)).size;
    if (dryRun) return NextResponse.json({ ok: true, rows: rows.length, students, weeks });

    // 학번이 하나도 없으면 학번 칸을 건드리지 않는다 (DB에 칸이 아직 없어도 저장되도록)
    const hasSid = rows.some(r => r.studentId);
    const data = hasSid ? rows : rows.map(({ studentId, ...rest }) => rest);
    await prisma.$transaction([
      prisma.clinicalAssignment.deleteMany({ where: { term: termName } }),
      prisma.clinicalAssignment.createMany({ data }),
    ]);
    return NextResponse.json({ ok: true, rows: rows.length, students, weeks });
  } catch {
    return NextResponse.json({ error: '저장하지 못했어요. (테이블이 만들어졌는지 확인해 주세요)' }, { status: 500 });
  }
}

// 학기 데이터 삭제
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSuperAdmin(user.role)) {
    return NextResponse.json({ error: '시스템관리자만 삭제할 수 있습니다.' }, { status: 403 });
  }
  const { term } = await req.json();
  if (!term) return NextResponse.json({ error: 'term 필요' }, { status: 400 });
  await prisma.clinicalAssignment.deleteMany({ where: { term: String(term) } });
  return NextResponse.json({ ok: true });
}
