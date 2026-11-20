import { getCurrentUser } from '@/lib/auth';
import { getCase, listCases } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import { hasEhrAccess } from '@/lib/ehr-access';
import Link from 'next/link';
import { migrate } from '../types';
import PrintBtn from './PrintBtn';

export const dynamic = 'force-dynamic';
export const metadata = { title: '인수인계지' };

const vit = (r?: Record<string, string>) =>
  r ? [r.time, r.bp && `BP ${r.bp}`, r.hr && `HR ${r.hr}`, r.rr && `RR ${r.rr}`, r.bt && `BT ${r.bt}`, r.spo2 && `SpO₂ ${r.spo2}`].filter(Boolean).join(' ') : '';

export default async function HandoverPage({ searchParams }: { searchParams: Promise<{ ward?: string }> }) {
  const { ward } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  if (!(await hasEhrAccess(user))) notFound();
  const list = (await listCases(user.id)).filter(c => !c.discharged && c.ward === (ward || '') && c.bed).sort((a, b) => (a.bed || '').localeCompare(b.bed || ''));
  const rows = await Promise.all(list.map(async c => ({ c, d: migrate((await getCase(user.id, c.id))?.data) })));
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <style>{`
          .hov { background: var(--background, #fff); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
          .hov table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .hov th { text-align: left; padding: 6px 8px; border-bottom: 2px solid var(--border); white-space: nowrap; }
          .hov td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; white-space: pre-wrap; line-height: 1.6; }
          .hov .im { color: #dc2626; font-weight: 700; }
          @media print { .noprint { display: none !important; } .hov { border: 0; } main { padding: 0 !important; } }
        `}</style>
        <div className="noprint" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Link href="/ehr" style={{ color: 'inherit' }}>← 목록</Link>
          <b style={{ marginLeft: 8 }}>{ward} 인수인계지 ({(() => { const h = new Date(Date.now() + 9 * 3600e3).getUTCHours(); return h >= 7 && h < 15 ? 'D' : h >= 15 && h < 23 ? 'E' : 'N'; })()} 근무)</b>
          <PrintBtn />
        </div>
        <div className="hov">
          <table>
            <thead><tr><th>병상</th><th>환자</th><th>진단</th><th>최근 활력징후</th><th>인수인계 (SBAR)</th><th>메모</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6}>입원 중인 환자가 없어요.</td></tr>}
              {rows.map(({ c, d }) => {
                const v = [...d.vitals].sort((a, b) => (b.time || '').localeCompare(a.time || ''))[0];
                const h = d.handover[0];
                const m = d.memos.filter(x => x.type !== '진료메모').slice(0, 3);
                return (
                  <tr key={c.id}>
                    <td><b>{c.bed}</b></td>
                    <td>{c.name}{'\n'}{c.ageSex}</td>
                    <td>{c.dx}</td>
                    <td>{vit(v)}</td>
                    <td>{h ? [h.s && `S ${h.s}`, h.b && `B ${h.b}`, h.a && `A ${h.a}`, h.r && `R ${h.r}`].filter(Boolean).join('\n') : ''}</td>
                    <td>{m.map((x, i) => <div key={i} className={x.imp ? 'im' : ''}>[{x.type}{x.shift ? ` ${x.shift}` : ''}] {x.text}</div>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
