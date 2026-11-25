// 가상 인명 생성 (샘플·원내번호부 공용)
const SUR = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
const GIV = ['민준', '서연', '지후', '하윤', '도윤', '수아', '예준', '지우', '시우', '유진', '건우', '다은', '현우', '채원', '준서', '소율'];
export const nm = (seed: number) => `${SUR[seed % SUR.length]}${GIV[(seed * 7 + 3) % GIV.length]}`;
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
// 진료과별 레지던트(= 병동 주치의)
export const residentName = (dept: string) => nm(hash(dept || 'X') + 2);
