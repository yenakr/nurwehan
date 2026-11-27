import { getCurrentUser } from '@/lib/auth';
import { listCases, cleanupCases } from '@/lib/ehr';
import { SAMPLE_VER } from './enrich';
import { listVirtuals, studentVirtuals } from '@/lib/ehr-class';
import { isAdminRole } from '@/lib/auth-core';
import type { Sample } from './types';
import { notFound, redirect } from 'next/navigation';
import EhrHome from './EhrHome';
import { aiConfigured } from '@/lib/ai';
import { hasEhrAccess, EHR_CASE_LIMIT } from '@/lib/ehr-access';
import { aiQuotaLeft } from '@/lib/practicum-ai';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR' };

export default async function EhrPage({ searchParams }: { searchParams: Promise<{ view?: string; go?: string }> }) {
  const { view, go } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  if (!(await hasEhrAccess(user))) notFound();
  if (!view && !go) {
    const card = { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minHeight: 280, padding: 32, borderRadius: 16, background: 'var(--background)', border: '2px solid var(--border)', textDecoration: 'none', color: 'inherit' } as const;
    return (
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'grid', alignItems: 'center', padding: '28px 0' }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, textAlign: 'center' }}>어떤 EHR로 연습할까요?</h1>
          <p style={{ margin: '0 0 22px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 14 }}>두 모드의 차트와 환자는 서로 완전히 분리돼 있어요.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
            <a href="/ehr?go=1" style={{ ...card, borderColor: '#2563eb' }}>
              <span style={{ fontSize: 40 }}>🏥</span>
              <b style={{ fontSize: 22 }}>자유 연습 EHR</b>
              <span style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>병동·외래·응급 환자를 마음대로 열어 처방, 간호기록, 투약, Flowsheet 같은 실제 EHR 화면을 익히는 프로그램 연습 모드예요.</span>
            </a>
            <a href="/ehr/skills" style={{ ...card, borderColor: '#16a34a' }}>
              <span style={{ fontSize: 40 }}>🎯</span>
              <b style={{ fontSize: 22 }}>핵심술기 훈련 EHR</b>
              <span style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>투약·욕창사정·활력징후 같은 술기 하나를 시나리오로 수행하고, 체크리스트와 AI 피드백으로 채점받거나 시험을 봐요.</span>
            </a>
          </div>
        </div>
      </main>
    );
  }
  await cleanupCases(user.id, SAMPLE_VER);
  const cases = await listCases(user.id);
  const extra: Sample[] = (isAdminRole(user.role) ? (await listVirtuals()).filter(v => v.published) : await studentVirtuals(user.id)).map(v => {
    const d = v.data as Sample['data'];
    const key = `v:${v.id}`;
    return { key, subject: d.info?.ward || '', title: `${d.info?.name || '가상환자'} · ${d.info?.dx || ''}`, data: { ...d, info: { ...d.info, sampleKey: key } } };
  });
  const ai = aiConfigured();
  const aiLeft = ai ? await aiQuotaLeft(user.id, '#ehrgen', EHR_CASE_LIMIT) : 0;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrHome extra={extra} ai={ai} aiLeft={aiLeft} initialView={view} cases={cases.map(c => ({ id: c.id, ward: c.ward, bed: c.bed, sampleKey: c.sampleKey, ptNo: c.ptNo, name: c.name, ageSex: c.ageSex, dx: c.dx, doctor: c.doctor, attending: c.attending, admit: c.admit, dept: c.dept, visitTime: c.visitTime, vstatus: c.vstatus, ktas: c.ktas, zone: c.zone, cc: c.cc, discharged: c.discharged, submitted: c.submitted, reviewed: c.reviewed, badges: c.badges, title: c.title }))} />
      </div>
    </main>
  );
}
