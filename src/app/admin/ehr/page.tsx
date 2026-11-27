import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { listSubmittedCases } from '@/lib/ehr';

export const dynamic = 'force-dynamic';

const fmt = (s: string) => new Date(s).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function AdminEhrPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t: tq } = await searchParams;
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr');
  const all = await listSubmittedCases();
  const kindOf = (r: { mode: string | null; exam: string | null }) => (r.mode === 'skill' ? (r.exam === '1' ? 'exam' : 'skill') : 'free');
  const tab = tq === 'skill' || tq === 'exam' ? tq : 'free';
  const cnt = { free: all.filter(r => kindOf(r) === 'free').length, skill: all.filter(r => kindOf(r) === 'skill').length, exam: all.filter(r => kindOf(r) === 'exam').length };
  const rows = all.filter(r => kindOf(r) === tab);
  const users = await prisma.user.findMany({ where: { id: { in: Array.from(new Set(rows.map(r => r.userId))) } }, select: { id: true, name: true, studentId: true } }).catch(() => []);
  const nm = new Map(users.map(u => [u.id, u]));

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>EHR 제출 기록</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link href="/ehr" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>학생 화면 보기</Link>
          <Link href="/admin/ehr/classes" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>분반 관리</Link>
          <Link href="/admin/ehr/patients" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>가상환자 관리</Link>
          <Link href="/admin/ehr/skills" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 700 }}>핵심술기 출제</Link>
        </div>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 12 }}>
          {([['free', '널위한병원'], ['skill', '핵심술기 연습'], ['exam', '핵심술기 시험']] as const).map(([k, l]) => (
            <Link key={k} href={`/admin/ehr?t=${k}`} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', background: tab === k ? '#fff' : 'transparent', color: tab === k ? 'var(--primary)' : '#64748b', boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,.12)' : 'none' }}>{l} {cnt[k]}</Link>
          ))}
        </div>
        <div className="card" style={{ padding: 0 }}>
          {rows.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'var(--sub-text)' }}>제출된 차트가 없어요.</p>}
          {rows.map((r, i) => {
            const u = nm.get(r.userId);
            return (
              <Link key={r.id} href={`/admin/ehr/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <span>
                  <b>{tab === 'exam' ? `${r.examName || ''} (${r.examNo || ''})` : u ? `${u.name} (${u.studentId})` : '알 수 없음'}</b>
                  <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{r.title} · {fmt(r.submitted)}</span>
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: r.reviewed ? '#2f7a46' : 'var(--primary)', whiteSpace: 'nowrap' }}>{tab === 'exam' && r.score ? `${r.score}점 · ` : ''}{r.reviewed ? '확인 완료' : '확인 대기'}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
