import { getCurrentUser } from '@/lib/auth';
import { getCase, listCases } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import { hasEhrAccess } from '@/lib/ehr-access';
import Link from 'next/link';
import { migrate, shiftChart } from '../types';
import { SAMPLES } from '../samples';
import { DEPTS } from '../directory';
import { Rich } from '../rich';
import PrintBtn from './PrintBtn';

export const dynamic = 'force-dynamic';
export const metadata = { title: '인수인계지' };

const vit = (r?: Record<string, string>) =>
  r ? [r.time, r.bp && `BP ${r.bp}`, r.hr && `HR ${r.hr}`, r.rr && `RR ${r.rr}`, r.bt && `BT ${r.bt}`, r.spo2 && `SpO₂ ${r.spo2}`].filter(Boolean).join(' ') : '';

const teamOf = (bed: string | null) => ((Number((bed || '').split('-')[0]) || 0) % 100 <= 3 ? '1팀' : '2팀');

export default async function HandoverPage({ searchParams }: { searchParams: Promise<{ ward?: string; team?: string }> }) {
  const { ward, team } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  if (!(await hasEhrAccess(user))) notFound();
  const w = ward || '';
  const tm = team === '1팀' || team === '2팀' ? team : '전체';
  const saved = (await listCases(user.id)).filter(c => !c.discharged && c.ward === w && c.bed);
  const savedRows = await Promise.all(saved.map(async c => ({ bed: c.bed || '', d: migrate((await getCase(user.id, c.id))?.data) })));
  const have = new Set(savedRows.map(r => r.d.info.ptNo));
  const sampleRows = SAMPLES.filter(sp => sp.data.info.ward === w && sp.data.info.bed && !have.has(sp.data.info.ptNo || '')).map(sp => ({ bed: sp.data.info.bed || '', d: shiftChart(migrate(sp.data)) }));
  const rows = [...savedRows, ...sampleRows]
    .filter(r => tm === '전체' || teamOf(r.bed) === tm)
    .sort((a, b) => a.bed.localeCompare(b.bed, 'ko', { numeric: true }));
  const pages: (typeof rows)[] = [];
  for (let k = 0; k < rows.length; k += 6) pages.push(rows.slice(k, k + 6));
  const duty = (() => { const h = new Date(Date.now() + 9 * 3600e3).getUTCHours(); return h >= 7 && h < 15 ? 'D' : h >= 15 && h < 23 ? 'E' : 'N'; })();
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <style>{`
          .hp { background: var(--background, #fff); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 14px; }
          .hp h2 { margin: 0 0 8px; font-size: 14px; }
          .hg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .hc { border: 1px solid #94a3b8; border-radius: 4px; padding: 8px; font-size: 12px; line-height: 1.5; display: flex; flex-direction: column; gap: 4px; min-height: 220px; break-inside: avoid; }
          .hc .hh { display: flex; align-items: baseline; gap: 6px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
          .hc .hh b { font-size: 14px; }
          .hc .hh span { color: var(--sub-text); }
          .hc .hh i { margin-left: auto; font-style: normal; font-weight: 700; }
          .hc .fl { display: flex; flex-wrap: wrap; gap: 3px; }
          .hc .fl em { font-style: normal; font-size: 11px; font-weight: 700; padding: 0 6px; border-radius: 999px; background: rgba(245,158,11,.2); color: #b9770e; }
          .hc .fl em.al { background: rgba(239,68,68,.14); color: #dc2626; }
          .hc .lb { font-weight: 700; color: var(--primary); }
          .hc .mm { white-space: pre-wrap; background: #fcf1d0; color: #3b3320; border-radius: 3px; padding: 4px 6px; flex: 1; }
          .hc .none { color: var(--sub-text); }
          @media (max-width: 900px) { .hg { grid-template-columns: 1fr; } }
          @media print { .noprint { display: none !important; } .hp { border: 0; padding: 0; margin: 0; page-break-after: always; } main { padding: 0 !important; } @page { size: A4 landscape; margin: 8mm; } .hc { min-height: 85mm; } }
        `}</style>
        <div className="noprint" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Link href="/ehr" style={{ color: 'inherit' }}>← 목록</Link>
          <b style={{ marginLeft: 8 }}>{w} {tm === '전체' ? '' : tm} 인수인계지 ({duty} 근무, {rows.length}명)</b>
          <PrintBtn />
        </div>
        {rows.length === 0 && <div className="hp">입원 중인 환자가 없어요.</div>}
        {pages.map((pg, pi) => (
          <section key={pi} className="hp">
            <h2>{w} {tm === '전체' ? '' : tm} 인수인계지 {pi + 1}/{pages.length}</h2>
            <div className="hg">
              {pg.map(({ bed, d }) => {
                const i = d.info;
                const v = [...d.vitals].sort((a, b) => (b.time || '').localeCompare(a.time || ''))[0];
                const h = d.handover[0];
                const memo = d.memos.find(x => x.type === '간호메모');
                const req = d.memos.filter(x => x.type === '진료메모').slice(-2);
                const al = i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim());
                return (
                  <div key={bed + (i.ptNo || '')} className="hc">
                    <div className="hh"><b>{bed}</b><span>{i.name} {i.ageSex}</span><i>{i.ptNo}</i></div>
                    <div>{DEPTS.find(x => x.code === i.dept)?.name || i.dept} {i.doctor && `· ${i.doctor}`}</div>
                    <div>{i.dx}</div>
                    <div className="fl">
                      {al && <em className="al">알러지 {i.allergy}</em>}
                      {i.iso && i.iso !== '해당 없음' && i.iso !== '없음' && <em>{i.iso}</em>}
                      {i.npo === '1' && <em>금식</em>}
                    </div>
                    {v && <div><span className="lb">V/S</span> {vit(v)}</div>}
                    {h && <div><span className="lb">SBAR</span> {[h.s && `S ${h.s}`, h.b && `B ${h.b}`, h.a && `A ${h.a}`, h.r && `R ${h.r}`].filter(Boolean).join(' / ')}</div>}
                    {req.length > 0 && <div><span className="lb">요청·관찰</span> {req.map(x => x.text).join(' / ')}</div>}
                    <div className="mm">{memo?.text ? <Rich text={memo.text} /> : <span className="none">간호메모 없음</span>}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
