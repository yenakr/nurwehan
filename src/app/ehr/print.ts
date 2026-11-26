import type { ChartData, Row } from './types';
import { medQr, patientQr } from './pda';
import { qrSvg } from './qr';

const esc = (t: string) => (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function show(title: string, body: string, css = '') {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title><style>
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif; color: #000; font-size: 12px; }
${css}
</style></head><body>${body}</body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

// 네임지(명패): 병상 앞에 붙이는 카드. 가상 환자 정보만 쓴다.
export function printNameTag(i: Record<string, string | null | undefined>, id?: string) {
  const row = (k: string, v?: string | null) => (v ? `<tr><th>${k}</th><td>${esc(v)}</td></tr>` : '');
  show('네임지', `<div class="tag">
<div class="bed">${esc(`${i.ward || ''} ${i.bed || ''}`.trim())}</div>
<div class="nm">${esc(i.name || '')}</div>
${id ? `<div class="qr">${qrSvg(patientQr(id), 96)}<span>환자 팔찌 QR</span></div>` : ''}
<table>${row('환자번호', i.ptNo)}${row('나이/성별', i.ageSex)}${row('진료과', i.dept)}${row('주치의', i.doctor)}${row('진단명', i.dx)}${row('입원일', i.admit)}${i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) ? `<tr class="al"><th>알러지</th><td>${esc(i.allergy)}</td></tr>` : ''}</table>
</div>`, `.qr{float:right;text-align:center;font-size:9px;margin-left:6px}.qr span{display:block}.tag{width:90mm;margin:10mm auto;border:2px solid #000;padding:8mm}.bed{font-size:14px;font-weight:700}.nm{font-size:30px;font-weight:800;margin:4px 0 8px}table{width:100%;border-collapse:collapse}th{width:24mm;text-align:left;padding:3px 0;font-weight:600}td{padding:3px 0}.al th,.al td{color:#c00;font-weight:700}`);
}

export type TicketKind = '투약' | '주사' | '수액';
const FLUID = /(n\/s|d5|d10|saline|식염|포도당|hartmann|하트만|수액|plasma|링거|ringer|[0-9]\s?ml\s*\/\s*h)/i;
const kindOf = (r: Row): TicketKind => {
  const route = (r.route || '').toUpperCase();
  if (route === 'PO' || route === 'SL' || route === 'PR') return '투약';
  return FLUID.test(r.name || '') ? '수액' : '주사';
};

export function printTickets(d: ChartData, kind: TicketKind | '전체', id?: string) {
  const meds = d.orders.filter(r => r.kind !== 'sec' && r.kind !== 'memo' && r.pri !== 'D/C' && r.st !== '취소' && (r.dose || r.route) && (kind === '전체' || kindOf(r) === kind));
  const i = d.info;
  const cards = meds.map(r => `<div class="tk">
${id ? `<div class="qr">${qrSvg(medQr(id, d.orders.indexOf(r), r.name || ''), 78)}</div>` : ''}
<div class="h"><b>${esc(i.name || '')}</b> ${esc(`${i.ward || ''} ${i.bed || ''}`.trim())} · ${esc(i.ptNo || '')}</div>
<div class="n">${esc(r.name || '')}</div>
<div>${esc([r.dose && `${r.dose}${r.unit || ''}`, r.route, r.cnt && `하루 ${r.cnt}회`, r.pri].filter(Boolean).join(' · '))}</div>
<div class="s">${esc(i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) ? `알러지 ${i.allergy}` : '')}</div>
</div>`).join('');
  show(`${kind} 티켓`, `<h2>${kind} 티켓 (${meds.length})</h2><div class="g">${cards || '<p>출력할 처방이 없어요.</p>'}</div>`,
    `.qr{float:right}h2{font-size:14px;margin:0 0 8px}.g{display:grid;grid-template-columns:1fr 1fr;gap:6px}.tk{border:1px dashed #000;padding:6px 8px;break-inside:avoid}.h{font-size:11px;margin-bottom:3px}.n{font-size:14px;font-weight:700}.s{color:#c00;font-weight:700;font-size:11px}`);
}
