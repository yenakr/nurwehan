// 실제 환자 정보로 보이는 형식(주민등록번호, 휴대전화)을 찾는다. 서버·클라이언트 공용.
const RRN = /(?<!\d)\d{6}[- ]?[1-4]\d{6}(?!\d)/;
const TEL = /(?<!\d)01[016789][- ]?\d{3,4}[- ]?\d{4}(?!\d)/;

export function findPhi(data: unknown): string[] {
  const hit = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string') {
      if (RRN.test(v)) hit.add('주민등록번호 형식');
      if (TEL.test(v)) hit.add('전화번호 형식');
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(data);
  return [...hit];
}
