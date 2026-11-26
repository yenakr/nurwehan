// 의존성 없는 간단한 QR 코드 생성기 (바이트 모드, 오류정정 M, 버전 1~10)
const EC: [number, number][] = [[0, 0], [10, 1], [16, 1], [26, 1], [18, 2], [24, 2], [16, 4], [18, 4], [22, 4], [22, 5], [26, 5]];
const TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const ALIGN: number[][] = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const gmul = (x: number, y: number) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; };
const divisor = (deg: number) => {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = gmul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = gmul(root, 2); }
  return r;
};
const remainder = (data: number[], div: number[]) => {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ (r.shift() as number); r.push(0); div.forEach((c, i) => { r[i] ^= gmul(c, f); }); }
  return r;
};

export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 10; ver++) {
    const dataCw = TOTAL[ver] - EC[ver][0] * EC[ver][1];
    const need = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8;
    if (need <= dataCw * 8) break;
  }
  if (ver > 10) throw new Error('QR 데이터가 너무 길어요');
  const [ecLen, nBlocks] = EC[ver];
  const dataCw = TOTAL[ver] - ecLen * nBlocks;
  // 비트열
  const bits: number[] = [];
  const put = (v: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, dataCw * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < dataCw * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const cws: number[] = [];
  for (let i = 0; i < bits.length; i += 8) cws.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  // 블록 분할 + RS
  const nShort = nBlocks - (TOTAL[ver] % nBlocks);
  const shortLen = Math.floor(TOTAL[ver] / nBlocks);
  const div = divisor(ecLen);
  const blocks: number[][] = []; const ecs: number[][] = [];
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const dl = shortLen - ecLen + (i < nShort ? 0 : 1);
    const d = cws.slice(k, k + dl); k += dl;
    blocks.push(d); ecs.push(remainder(d, div));
  }
  const all: number[] = [];
  for (let i = 0; i < blocks[blocks.length - 1].length; i++) blocks.forEach(b => { if (i < b.length) all.push(b[i]); });
  for (let i = 0; i < ecLen; i++) ecs.forEach(e => all.push(e[i]));
  // 매트릭스
  const n = ver * 4 + 17;
  const m: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const fn: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (x: number, y: number, v: boolean) => { if (x >= 0 && y >= 0 && x < n && y < n) { m[y][x] = v; fn[y][x] = true; } };
  for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx: number, cy: number) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
  const ap = ALIGN[ver];
  ap.forEach((ax, i) => ap.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const fmt = (mask: number) => {
    const data = (0 << 3) | mask; // 오류정정 M = 00
    let r = data; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const bitsF = ((data << 10) | r) ^ 0x5412;
    const g = (i: number) => ((bitsF >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, g(i));
    set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, g(i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, g(i));
    set(8, n - 8, true);
  };
  if (ver >= 7) {
    let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const v = (ver << 12) | r;
    for (let i = 0; i < 18; i++) { const b = ((v >>> i) & 1) !== 0; const a = n - 11 + (i % 3); const c = Math.floor(i / 3); set(a, c, b); set(c, a, b); }
  }
  fmt(0);
  // 데이터 배치 (마스크 전)
  const raw: boolean[][] = m.map(r => r.slice());
  let bi = 0; let up = true;
  for (let x = n - 1; x >= 1; x -= 2) {
    if (x === 6) x = 5;
    for (let k = 0; k < n; k++) {
      const y = up ? n - 1 - k : k;
      for (let dx = 0; dx < 2; dx++) {
        const xx = x - dx;
        if (fn[y][xx]) continue;
        raw[y][xx] = bi < all.length * 8 ? ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0 : false;
        bi++;
      }
    }
    up = !up;
  }
  const MASKS: ((x: number, y: number) => boolean)[] = [
    (x, y) => (x + y) % 2 === 0, (_x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const penalty = (g: boolean[][]) => {
    let p = 0;
    const line = (get: (i: number) => boolean) => {
      let run = 1;
      for (let i = 1; i < n; i++) { if (get(i) === get(i - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
      for (let i = 0; i + 10 < n; i++) {
        const w = (o: number[]) => o.every((v, k) => get(i + k) === (v === 1));
        if (w([1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]) || w([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1])) p += 40;
      }
    };
    for (let i = 0; i < n; i++) { line(j => g[i][j]); line(j => g[j][i]); }
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) if (g[y][x] === g[y][x + 1] && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 1][x + 1]) p += 3;
    const dark = g.flat().filter(Boolean).length;
    p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return p;
  };
  let best = 0; let bestP = Infinity; let bestG: boolean[][] = m;
  for (let mk = 0; mk < 8; mk++) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) m[y][x] = fn[y][x] ? raw[y][x] : raw[y][x] !== MASKS[mk](x, y);
    fmt(mk);
    const pe = penalty(m);
    if (pe < bestP) { bestP = pe; best = mk; bestG = m.map(r => r.slice()); }
  }
  void best;
  return bestG;
}

// SVG 문자열 (quiet zone 포함)
export function qrSvg(text: string, px = 140): string {
  const m = qrMatrix(text); const n = m.length; const q = 4;
  let d = '';
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + q},${y + q}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
