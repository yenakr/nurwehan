'use client';

import { useState } from 'react';
import { SKILLS, defaultCfg, recordsOf, type Cfg, type Ord } from '@/app/ehr/skills/scn';

type Row = { id: string; published: boolean; classId: string | null; skill: string; title: string; exam: boolean; assign: 'same' | 'random'; cfg: Cfg };
const inp = { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'inherit', width: '100%' } as const;

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 3, fontSize: 12, color: 'var(--muted-foreground)' }}>{l}{children}</label>;
}

export default function SkillsAdmin({ rows: init, classes }: { rows: Row[]; classes: { id: string; label: string }[] }) {
  const [rows, setRows] = useState(init);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState('');
  const [openSk, setOpenSk] = useState('');
  const [prev, setPrev] = useState('');
  const upd = (id: string, f: (r: Row) => Row) => setRows(rs => rs.map(r => (r.id === id ? f(r) : r)));
  const create = async (skill: string) => {
    const r = await fetch('/api/admin/ehr/skills', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ skill }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id) { setMsg('만들지 못했어요'); return; }
    const t = SKILLS.find(x => x.key === skill)?.title || skill;
    setRows(rs => [...rs, { id: j.id, published: false, classId: null, skill, title: `${t} 시험`, exam: false, assign: 'same', cfg: defaultCfg(skill) }]);
    setOpenSk(skill); setOpen(j.id); setMsg('');
  };
  const save = async (r: Row) => {
    const res = await fetch(`/api/admin/ehr/skills/${r.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) });
    setMsg(res.ok ? '저장했어요' : '저장하지 못했어요');
  };
  const del = async (id: string) => {
    if (!confirm('이 시나리오를 지울까요? 학생이 이미 만든 연습 차트는 남아요.')) return;
    const res = await fetch(`/api/admin/ehr/skills/${id}`, { method: 'DELETE' });
    if (res.ok) setRows(rs => rs.filter(r => r.id !== id));
  };
  return (
    <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
            {(() => {
      const renderRow = (r: Row) => {
        const c = r.cfg;
        const setC = (p: Partial<Cfg>) => upd(r.id, x => ({ ...x, cfg: { ...x.cfg, ...p } }));
        const skTitle = SKILLS.find(s => s.key === r.skill)?.title;
        const isOpen = open === r.id;
        const pill = (t: string, bg: string) => <span style={{ background: bg, color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: 11, whiteSpace: 'nowrap' }}>{t}</span>;
        const sec = { background: 'var(--muted-background)', borderRadius: 8, padding: 12, display: 'grid', gap: 8 } as const;
        const h = { margin: 0, fontSize: 13, fontWeight: 800 } as const;
        return (
          <div key={r.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <button type="button" onClick={() => setOpen(isOpen ? '' : r.id)} aria-expanded={isOpen} style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', padding: '12px 14px', border: 0, background: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <b style={{ flex: 1 }}>{r.title}</b>
              {pill(skTitle || r.skill, '#2563eb')}
              {r.exam ? pill('시험', '#dc2626') : pill('연습', '#64748b')}
              {r.published ? pill('공개', '#16a34a') : pill('비공개', '#94a3b8')}
              <span style={{ color: 'var(--muted-foreground)' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 14px 14px', display: 'grid', gap: 12 }}>
                <div style={sec}>
                  <p style={h}>기본 설정</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
                    <F l="시나리오 이름"><input style={{ ...inp, fontWeight: 700 }} value={r.title} onChange={e => upd(r.id, x => ({ ...x, title: e.target.value }))} /></F>
                    <F l="대상 분반">
                      <select style={inp} value={r.classId || ''} onChange={e => upd(r.id, x => ({ ...x, classId: e.target.value || null }))}>
                        <option value="">전체 학생</option>{classes.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                      </select>
                    </F>
                    <F l="환자 배정">
                      <select style={inp} value={r.assign} onChange={e => upd(r.id, x => ({ ...x, assign: e.target.value as Row['assign'] }))}>
                        <option value="same">전원 동일</option>
                        <option value="random">학생마다 랜덤</option>
                      </select>
                    </F>
                    <F l="모드">
                      <select style={inp} value={r.exam ? '1' : ''} onChange={e => upd(r.id, x => ({ ...x, exam: e.target.value === '1' }))}>
                        <option value="">연습</option>
                        <option value="1">시험</option>
                      </select>
                    </F>
                  </div>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={r.published} onChange={e => upd(r.id, x => ({ ...x, published: e.target.checked }))} />공개</label>
                </div>
                <div style={sec}>
                  <p style={h}>환자</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
                    <F l="이름"><input style={inp} value={c.name} onChange={e => setC({ name: e.target.value })} /></F>
                    <F l="나이"><input style={inp} value={c.age} onChange={e => setC({ age: e.target.value })} /></F>
                    <F l="성별"><select style={inp} value={c.sex} onChange={e => setC({ sex: e.target.value as 'M' | 'F' })}><option value="F">여</option><option value="M">남</option></select></F>
                    <F l="병동"><input style={inp} value={c.ward} onChange={e => setC({ ward: e.target.value })} /></F>
                    <F l="병상"><input style={inp} value={c.bed} onChange={e => setC({ bed: e.target.value })} /></F>
                    <F l="진료과"><input style={inp} value={c.dept} onChange={e => setC({ dept: e.target.value })} /></F>
                    <F l="담당의"><input style={inp} value={c.doctor} onChange={e => setC({ doctor: e.target.value })} /></F>
                    <F l="알레르기"><input style={inp} value={c.allergy} onChange={e => setC({ allergy: e.target.value })} /></F>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
                    <F l="진단"><input style={inp} value={c.dx} onChange={e => setC({ dx: e.target.value })} /></F>
                    <F l="주호소"><input style={inp} value={c.cc} onChange={e => setC({ cc: e.target.value })} /></F>
                    <F l="시작 시각"><input style={inp} value={c.clock} onChange={e => setC({ clock: e.target.value })} /></F>
                    <F l="직전 활력징후"><input style={inp} placeholder="혈압,맥박,호흡,체온,SpO2  예) 118/72,84,18,37.2,97" value={c.vit} onChange={e => setC({ vit: e.target.value })} /></F>
                  </div>
                </div>
                <div style={sec}>
                  <p style={h}>상황 안내</p>
                  <textarea style={{ ...inp, minHeight: 90, fontFamily: 'inherit' }} value={c.situation} onChange={e => setC({ situation: e.target.value })} />
                </div>
                <div style={sec}>
                  <p style={h}>처방</p>
                  {c.orders.length === 0 && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>처방 없음</p>}
                  {c.orders.map((x, k) => {
                    const setO = (p: Partial<Ord>) => setC({ orders: c.orders.map((y, j) => (j === k ? { ...y, ...p } : y)) });
                    return (
                      <div key={k} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, display: 'grid', gap: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                          <F l="처방명"><input style={inp} value={x.name} onChange={e => setO({ name: e.target.value })} /></F>
                          <button type="button" aria-label="처방 삭제" onClick={() => setC({ orders: c.orders.filter((_, j) => j !== k) })} style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px 10px' }}>삭제</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 6 }}>
                          <F l="용량"><input style={inp} value={x.dose} onChange={e => setO({ dose: e.target.value })} /></F>
                          <F l="단위"><input style={inp} value={x.unit} onChange={e => setO({ unit: e.target.value })} /></F>
                          <F l="경로"><input style={inp} value={x.route} onChange={e => setO({ route: e.target.value })} /></F>
                          <F l="횟수"><input style={inp} value={x.cnt} onChange={e => setO({ cnt: e.target.value })} /></F>
                          <F l="투약 시간"><input style={inp} value={x.slots} onChange={e => setO({ slots: e.target.value })} /></F>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                          <F l="메모"><input style={inp} value={x.memo} onChange={e => setO({ memo: e.target.value })} /></F>
                          <label style={{ display: 'flex', gap: 4, alignItems: 'center', paddingBottom: 7 }}><input type="checkbox" style={{ width: 'auto' }} checked={x.prn} onChange={e => setO({ prn: e.target.checked })} />PRN</label>
                        </div>
                      </div>
                    );
                  })}
                  <div><button type="button" onClick={() => setC({ orders: [...c.orders, { name: '', dose: '', unit: '', route: '', cnt: '', slots: '', prn: false, memo: '' }] })} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'inherit', cursor: 'pointer' }}>+ 처방 추가</button></div>
                </div>
                <div style={sec}>
                  <p style={h}>평가 항목</p>
                  <textarea style={{ ...inp, minHeight: 110, fontFamily: 'inherit' }} value={c.checks.join('\n')} onChange={e => setC({ checks: e.target.value.split('\n') })} />
                </div>
                {prev === r.id && (
                  <div style={{ ...sec, border: '2px dashed #2563eb' }}>
                    <p style={h}>미리보기</p>
                    <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12, lineHeight: 1.65 }}>
                      <div><b>{c.name}</b> {c.age}/{c.sex} · {c.ward} {c.bed}<br />{c.dx}<br />알레르기 {c.allergy} · 시작 {c.clock}</div>
                      <p style={{ margin: '8px 0' }}>{c.situation}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>EHR 기록: {recordsOf(r.skill).join(' · ')}</p>
                    </div>
                    <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12, fontSize: 13 }}>
                      <b>처방 화면</b>
                      <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.7 }}>
                        <li>Check V/S q [4] hrs</li><li>Check I/O q [8] hrs</li>
                        {c.orders.filter(x => x.name.trim()).map((x, k) => <li key={k}>{x.name} {x.dose}{x.unit} {x.route} {x.cnt} {x.slots && `(${x.slots})`} {x.prn && <i>PRN</i>}{x.memo && <span style={{ color: '#be185d' }}> ※ {x.memo}</span>}</li>)}
                      </ol>
                      <p style={{ margin: '8px 0 0' }}>{c.vit ? `직전 활력징후 (${c.clock} 4시간 전): ${c.vit}` : '직전 활력징후 없음'}</p>
                    </div>
                    <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12, fontSize: 13 }}>
                      <b>평가 항목</b>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{c.checks.filter(x => x.trim()).map((x, k) => <li key={k}>{x}</li>)}</ul>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: 'var(--background)', padding: '8px 0' }}>
                  <button type="button" onClick={() => save(r)} style={{ padding: '8px 18px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>저장</button>
                  <button type="button" onClick={() => setPrev(prev === r.id ? '' : r.id)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2563eb', background: 'var(--background)', color: '#2563eb', cursor: 'pointer' }}>{prev === r.id ? '미리보기 닫기' : '미리보기'}</button>
                  <a href={`/ehr/skills/${r.id}`} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}>실제 EHR로 열어보기 ↗</a>
                  <button type="button" onClick={() => del(r.id)} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: '#dc2626', cursor: 'pointer' }}>삭제</button>
                </div>
                {msg && <p style={{ margin: 0, color: 'var(--primary)' }}>{msg}</p>}
              </div>
            )}
          </div>
        );
      };
      const known = new Set(SKILLS.map(x => x.key));
      const groups = [...SKILLS.map((sk, i) => ({ key: sk.key, title: `${i + 1}. ${sk.title}`, list: rows.filter(r => r.skill === sk.key), add: true })), { key: '_old', title: '이전 술기 (더 이상 열리지 않음)', list: rows.filter(r => !known.has(r.skill)), add: false }].filter(g => g.add || g.list.length > 0);
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignItems: 'start' }}>{groups.map(g => {
        const isOpen = openSk === g.key;
        const pub = g.list.filter(r => r.published).length;
        return (
          <div key={g.key} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', gridColumn: isOpen ? '1 / -1' : undefined }}>
            <button type="button" onClick={() => setOpenSk(isOpen ? '' : g.key)} aria-expanded={isOpen} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '14px 16px', border: 0, background: isOpen ? 'var(--muted-background)' : 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 14 }}>{g.title}</b>
                <span style={{ fontSize: 12, color: g.list.length ? '#2563eb' : 'var(--muted-foreground)' }}>{g.list.length === 0 ? '시나리오 없음' : `시나리오 ${g.list.length}개 · 공개 ${pub}`}</span>
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: 12, display: 'grid', gap: 10, borderTop: '1px solid var(--border)' }}>
                {g.list.length === 0 && <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 13 }}>아직 만든 시나리오가 없어요.</p>}
                {g.list.map(r => renderRow(r))}
                {g.add && <div><button type="button" onClick={() => create(g.key)} style={{ padding: '8px 16px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>+ 이 술기 시나리오 추가</button></div>}
              </div>
            )}
          </div>
        );
      })}</div>;
      })()}
    </div>
  );
}
