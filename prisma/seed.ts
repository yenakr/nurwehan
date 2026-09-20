import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding started...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const superAdmin = await prisma.user.upsert({
    where: { studentId: 'admin' },
    update: {
      password: adminPassword,
      role: 'SUPER_ADMIN',
      approvalStatus: 'APPROVED',
    },
    create: {
      studentId: 'admin',
      name: '시스템 관리자',
      email: 'admin@hanyang.ac.kr',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      approvalStatus: 'APPROVED',
    },
  });
  console.log('Super Admin created: admin / admin1234');

  // 2. Create Skills and Supplies
  // Clear existing supplies to prevent duplicates
  await prisma.skillSupply.deleteMany({});

  const skillsData = [
    {
      name: '활력징후 측정',
      supplies: [
        { supplyName: '대상자 모형 또는 실습 파트너', quantity: 1, unit: '개' },
        { supplyName: '전자체온계 또는 고막체온계', quantity: 1, unit: '개' },
        { supplyName: '체온계 커버', quantity: 1, unit: '개' },
        { supplyName: '혈압계', quantity: 1, unit: '개' },
        { supplyName: '청진기', quantity: 1, unit: '개' },
        { supplyName: '초침 있는 시계', quantity: 1, unit: '개' },
        { supplyName: 'pulse oximeter 필요 시', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '트레이', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '경구투약',
      supplies: [
        { supplyName: '대상자 모형 또는 실습 파트너', quantity: 1, unit: '개' },
        { supplyName: '투약카드/처방지', quantity: 1, unit: '개' },
        { supplyName: '경구약 모형 또는 실제 모형 알약', quantity: 1, unit: '개' },
        { supplyName: '약컵', quantity: 1, unit: '개' },
        { supplyName: '물컵', quantity: 1, unit: '개' },
        { supplyName: '물', quantity: 1, unit: '개' },
        { supplyName: '빨대', quantity: 1, unit: '개' },
        { supplyName: '투약 트레이', quantity: 1, unit: '개' },
        { supplyName: '티슈', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '환자확인용 팔찌 또는 이름표', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '근육주사',
      supplies: [
        { supplyName: '둔부/상완 근육주사 모형', quantity: 1, unit: '개' },
        { supplyName: '투약카드/처방지', quantity: 1, unit: '개' },
        { supplyName: '주사약 모형 앰플 또는 바이알', quantity: 1, unit: '개' },
        { supplyName: '3 mL 주사기', quantity: 1, unit: '개' },
        { supplyName: '주사침', quantity: 1, unit: '개' },
        { supplyName: '필터니들 필요 시', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '멸균 거즈', quantity: 1, unit: '개' },
        { supplyName: '반창고', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '투약 트레이', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '손상성 폐기물 전용 용기', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '피하주사 + 간이 혈당검사',
      supplies: [
        { supplyName: '피하주사 모형 또는 복부/상완 주사 모형', quantity: 1, unit: '개' },
        { supplyName: '혈당측정기', quantity: 1, unit: '개' },
        { supplyName: '혈당검사지', quantity: 1, unit: '개' },
        { supplyName: '채혈침/lancet', quantity: 1, unit: '개' },
        { supplyName: '채혈기', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '마른 솜 또는 거즈', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손상성 폐기물 전용 용기', quantity: 1, unit: '개' },
        { supplyName: '인슐린 주사기 또는 인슐린 펜', quantity: 1, unit: '개' },
        { supplyName: '인슐린 바이알/펜 모형', quantity: 1, unit: '개' },
        { supplyName: '투약카드/처방지', quantity: 1, unit: '개' },
        { supplyName: '투약 트레이', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '피내주사',
      supplies: [
        { supplyName: '피내주사 전완 모형 또는 피내주사 패드', quantity: 1, unit: '개' },
        { supplyName: '투약카드/처방지', quantity: 1, unit: '개' },
        { supplyName: '피내주사용 약물 모형', quantity: 1, unit: '개' },
        { supplyName: '1 mL 투베르쿨린 주사기', quantity: 1, unit: '개' },
        { supplyName: '주사침', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '투약 트레이', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '피부 표시용 펜', quantity: 1, unit: '개' },
        { supplyName: '자', quantity: 1, unit: '개' },
        { supplyName: '손상성 폐기물 전용 용기', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '정맥 수액 주입',
      supplies: [
        { supplyName: '정맥주사 팔 모형/IV arm model', quantity: 1, unit: '개' },
        { supplyName: '수액백', quantity: 1, unit: '개' },
        { supplyName: '수액세트', quantity: 1, unit: '개' },
        { supplyName: 'IV catheter', quantity: 1, unit: '개' },
        { supplyName: 'extension line', quantity: 1, unit: '개' },
        { supplyName: '3-way stopcock 또는 injection cap', quantity: 1, unit: '개' },
        { supplyName: '토니켓', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜 또는 클로르헥시딘 솜', quantity: 1, unit: '개' },
        { supplyName: '멸균 거즈', quantity: 1, unit: '개' },
        { supplyName: '투명 드레싱', quantity: 1, unit: '개' },
        { supplyName: '반창고', quantity: 1, unit: '개' },
        { supplyName: '수액 라벨', quantity: 1, unit: '개' },
        { supplyName: '10 mL 주사기', quantity: 1, unit: '개' },
        { supplyName: '생리식염수 flush', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손상성 폐기물 전용 용기', quantity: 1, unit: '개' },
        { supplyName: 'IV pole', quantity: 1, unit: '개' },
        { supplyName: 'infusion pump', quantity: 1, unit: '개' },
        { supplyName: 'syringe pump 필요 시', quantity: 1, unit: '개' },
        { supplyName: 'syringe pump용 주사기', quantity: 1, unit: '개' },
        { supplyName: 'pump line', quantity: 1, unit: '개' },
        { supplyName: '투약카드/처방지', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '트레이', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '수혈요법',
      supplies: [
        { supplyName: '대상자 모형 또는 정맥주사 팔 모형', quantity: 1, unit: '개' },
        { supplyName: '혈액제제 모형/모형 혈액백', quantity: 1, unit: '개' },
        { supplyName: '수혈세트', quantity: 1, unit: '개' },
        { supplyName: '0.9% 생리식염수', quantity: 1, unit: '개' },
        { supplyName: '생리식염수 수액세트 필요 시', quantity: 1, unit: '개' },
        { supplyName: 'IV catheter 또는 기존 IV line 모형', quantity: 1, unit: '개' },
        { supplyName: 'extension line', quantity: 1, unit: '개' },
        { supplyName: '3-way stopcock 또는 injection cap', quantity: 1, unit: '개' },
        { supplyName: 'IV pole', quantity: 1, unit: '개' },
        { supplyName: 'infusion pump 필요 시', quantity: 1, unit: '개' },
        { supplyName: '혈액출고지/수혈기록지/처방지', quantity: 1, unit: '개' },
        { supplyName: '혈액형 확인 자료', quantity: 1, unit: '개' },
        { supplyName: '환자확인용 팔찌', quantity: 1, unit: '개' },
        { supplyName: '활력징후 측정 물품', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '멸균 거즈', quantity: 1, unit: '개' },
        { supplyName: '반창고', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '트레이', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '손상성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '간헐적 위관영양',
      supplies: [
        { supplyName: '위관영양 모형 또는 상반신 마네킹', quantity: 1, unit: '개' },
        { supplyName: 'L-tube/Levin tube 삽입된 모형', quantity: 1, unit: '개' },
        { supplyName: '위관영양액', quantity: 1, unit: '개' },
        { supplyName: '미온수', quantity: 1, unit: '개' },
        { supplyName: '50 mL feeding syringe', quantity: 1, unit: '개' },
        { supplyName: '영양액 주입백 필요 시', quantity: 1, unit: '개' },
        { supplyName: '컵', quantity: 1, unit: '개' },
        { supplyName: '청진기', quantity: 1, unit: '개' },
        { supplyName: 'pH paper', quantity: 1, unit: '개' },
        { supplyName: '위 내용물 확인용 용기', quantity: 1, unit: '개' },
        { supplyName: '장갑', quantity: 1, unit: '개' },
        { supplyName: '수건', quantity: 1, unit: '개' },
        { supplyName: '방수포', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '클램프', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '단순도뇨',
      supplies: [
        { supplyName: '여성 또는 남성 단순도뇨 모형', quantity: 1, unit: '개' },
        { supplyName: '단순도뇨세트', quantity: 1, unit: '개' },
        { supplyName: '멸균 장갑', quantity: 1, unit: '개' },
        { supplyName: '도뇨관/nelaton catheter', quantity: 1, unit: '개' },
        { supplyName: '멸균 윤활제', quantity: 1, unit: '개' },
        { supplyName: '소독솜', quantity: 1, unit: '개' },
        { supplyName: '소독액', quantity: 1, unit: '개' },
        { supplyName: '멸균포', quantity: 1, unit: '개' },
        { supplyName: '방수포', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '소변기 또는 검체용기', quantity: 1, unit: '개' },
        { supplyName: '휴지 또는 물티슈', quantity: 1, unit: '개' },
        { supplyName: '조명 필요 시', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '감염성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '유치도뇨',
      supplies: [
        { supplyName: '여성 또는 남성 유치도뇨 모형', quantity: 1, unit: '개' },
        { supplyName: '유치도뇨세트', quantity: 1, unit: '개' },
        { supplyName: 'Foley catheter', quantity: 1, unit: '개' },
        { supplyName: '멸균 장갑', quantity: 1, unit: '개' },
        { supplyName: '멸균 윤활제', quantity: 1, unit: '개' },
        { supplyName: '소독솜', quantity: 1, unit: '개' },
        { supplyName: '소독액', quantity: 1, unit: '개' },
        { supplyName: '멸균포', quantity: 1, unit: '개' },
        { supplyName: '방수포', quantity: 1, unit: '개' },
        { supplyName: '10 mL 주사기', quantity: 1, unit: '개' },
        { supplyName: '주사용 증류수', quantity: 1, unit: '개' },
        { supplyName: '소변주머니/urine bag', quantity: 1, unit: '개' },
        { supplyName: 'catheter securement device 또는 고정용 테이프', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '검체용기 필요 시', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '감염성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '배출관장',
      supplies: [
        { supplyName: '관장 모형 또는 하반신 마네킹', quantity: 1, unit: '개' },
        { supplyName: '관장액', quantity: 1, unit: '개' },
        { supplyName: 'enema can 또는 enema bag', quantity: 1, unit: '개' },
        { supplyName: '직장관/rectal tube', quantity: 1, unit: '개' },
        { supplyName: '연결관', quantity: 1, unit: '개' },
        { supplyName: '윤활제', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '방수포', quantity: 1, unit: '개' },
        { supplyName: '수건', quantity: 1, unit: '개' },
        { supplyName: '휴지', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '이동변기 또는 bedpan', quantity: 1, unit: '개' },
        { supplyName: 'IV pole', quantity: 1, unit: '개' },
        { supplyName: '클램프', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '감염성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '말초산소포화도 측정 + 심전도 모니터 적용',
      supplies: [
        { supplyName: '대상자 모형 또는 실습 파트너', quantity: 1, unit: '개' },
        { supplyName: 'pulse oximeter', quantity: 1, unit: '개' },
        { supplyName: 'EKG monitor', quantity: 1, unit: '개' },
        { supplyName: 'EKG cable', quantity: 1, unit: '개' },
        { supplyName: 'EKG electrode 3개 또는 5개', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '피부 준비용 거즈', quantity: 1, unit: '개' },
        { supplyName: '면도기 필요 시', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '비강 캐뉼라 산소요법',
      supplies: [
        { supplyName: '대상자 모형 또는 실습 파트너', quantity: 1, unit: '개' },
        { supplyName: '산소 wall outlet 또는 산소통', quantity: 1, unit: '개' },
        { supplyName: '산소유량계/flowmeter', quantity: 1, unit: '개' },
        { supplyName: '비강 캐뉼라', quantity: 1, unit: '개' },
        { supplyName: '산소 연결관', quantity: 1, unit: '개' },
        { supplyName: 'humidifier bottle 필요 시', quantity: 1, unit: '개' },
        { supplyName: '멸균증류수', quantity: 1, unit: '개' },
        { supplyName: 'pulse oximeter', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '흡인',
      supplies: [
        { supplyName: '흡인 모형 또는 기관절개관/구강흡인 모형', quantity: 1, unit: '개' },
        { supplyName: 'suction machine', quantity: 1, unit: '개' },
        { supplyName: 'suction bottle', quantity: 1, unit: '개' },
        { supplyName: 'suction line/연결관', quantity: 1, unit: '개' },
        { supplyName: 'suction catheter', quantity: 1, unit: '개' },
        { supplyName: 'Yankauer suction tip 필요 시', quantity: 1, unit: '개' },
        { supplyName: '멸균 장갑', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '멸균 생리식염수', quantity: 1, unit: '개' },
        { supplyName: '멸균 용기', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '수건', quantity: 1, unit: '개' },
        { supplyName: '산소공급장치', quantity: 1, unit: '개' },
        { supplyName: 'Ambu bag 필요 시', quantity: 1, unit: '개' },
        { supplyName: 'pulse oximeter', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '감염성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '기본 심폐소생술 및 제세동기 적용',
      supplies: [
        { supplyName: 'CPR 마네킹', quantity: 1, unit: '개' },
        { supplyName: 'AED trainer 또는 제세동기 모형', quantity: 1, unit: '개' },
        { supplyName: 'AED pad', quantity: 1, unit: '개' },
        { supplyName: 'pocket mask 또는 face shield', quantity: 1, unit: '개' },
        { supplyName: 'Ambu bag 필요 시', quantity: 1, unit: '개' },
        { supplyName: '산소 연결관 및 산소공급장치 필요 시', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '소독티슈', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '통증관리',
      supplies: [
        { supplyName: '대상자 모형 또는 실습 파트너', quantity: 1, unit: '개' },
        { supplyName: '통증 사정 도구', quantity: 1, unit: '개' },
        { supplyName: 'NRS/VAS/FPRS 척도지', quantity: 1, unit: '개' },
        { supplyName: '활력징후 측정 물품', quantity: 1, unit: '개' },
        { supplyName: '처방지', quantity: 1, unit: '개' },
        { supplyName: '진통제 모형 필요 시', quantity: 1, unit: '개' },
        { supplyName: '투약카드 필요 시', quantity: 1, unit: '개' },
        { supplyName: '냉찜질팩', quantity: 1, unit: '개' },
        { supplyName: '온찜질팩', quantity: 1, unit: '개' },
        { supplyName: '수건', quantity: 1, unit: '개' },
        { supplyName: '베개 또는 체위 지지 도구', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '욕창관리 및 낙상예방간호',
      supplies: [
        { supplyName: '대상자 모형 또는 침상 모형', quantity: 1, unit: '개' },
        { supplyName: '병원침대', quantity: 1, unit: '개' },
        { supplyName: '침상난간', quantity: 1, unit: '개' },
        { supplyName: 'Braden scale', quantity: 1, unit: '개' },
        { supplyName: 'Morse fall scale', quantity: 1, unit: '개' },
        { supplyName: '욕창위험 표식', quantity: 1, unit: '개' },
        { supplyName: '낙상주의 표식', quantity: 1, unit: '개' },
        { supplyName: '낙상주의 팔찌 또는 이름표', quantity: 1, unit: '개' },
        { supplyName: '체위변경용 베개', quantity: 1, unit: '개' },
        { supplyName: '쿠션', quantity: 1, unit: '개' },
        { supplyName: '방수포', quantity: 1, unit: '개' },
        { supplyName: '피부보호제', quantity: 1, unit: '개' },
        { supplyName: '보습제', quantity: 1, unit: '개' },
        { supplyName: '멸균 거즈', quantity: 1, unit: '개' },
        { supplyName: '드레싱 재료 필요 시', quantity: 1, unit: '개' },
        { supplyName: 'hydrocolloid 또는 foam dressing 모형', quantity: 1, unit: '개' },
        { supplyName: '장갑', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '교육자료', quantity: 1, unit: '개' },
        { supplyName: '기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' },
        { supplyName: '폐기물통', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '배액관 관리 JP 또는 Hemovac',
      supplies: [
        { supplyName: 'JP drain 또는 Hemovac drain 모형', quantity: 1, unit: '개' },
        { supplyName: '배액관 삽입 부위 모형 또는 상처 모형', quantity: 1, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '개' },
        { supplyName: '멸균 장갑 필요 시', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 1, unit: '개' },
        { supplyName: '멸균 거즈', quantity: 1, unit: '개' },
        { supplyName: '반창고', quantity: 1, unit: '개' },
        { supplyName: '배액량 측정컵 또는 눈금컵', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '배액관 고정핀 또는 안전핀', quantity: 1, unit: '개' },
        { supplyName: '소독액 필요 시', quantity: 1, unit: '개' },
        { supplyName: '손소독제', quantity: 1, unit: '개' },
        { supplyName: '감염성 폐기물통', quantity: 1, unit: '개' },
        { supplyName: '일반 폐기물통', quantity: 1, unit: '개' },
        { supplyName: 'I/O 기록지', quantity: 1, unit: '개' },
        { supplyName: '펜', quantity: 1, unit: '개' }
      ]
    },
    {
      name: '기타'
    }
  ];

  for (const item of skillsData) {
    const { supplies, ...skillInfo } = item;
    const skill = await prisma.skill.upsert({
      where: { name: skillInfo.name },
      update: {},
      create: skillInfo,
    });

    if (supplies) {
      for (const supply of supplies) {
        await prisma.skillSupply.create({
          data: {
            ...supply,
            skillId: skill.id
          }
        });
      }
    }
  }
  console.log('Skills and supplies seeded');

  // 3. Create Official Notice
  await prisma.notice.deleteMany({});
  const noticeTitle = '2026학년도 2학기 OPEN LAB 운영 안내';
  const noticeContent = `
2026학년도 2학기 OPEN LAB 운영 일정

1. 운영기간 : 2026년 9월 1일 ~ 종강 시까지 (중간고사, 기말고사 및 평가 기간에는 변동 될 수 있음)

2. 운영시간 및 인원
[2학년]
화요일
- 09:00 – 10:00 (최대 신청 가능 인원 16명)
- 10:00 – 11:00 (최대 신청 가능 인원 16명)
수요일
- 09:00 – 10:00 (최대 신청 가능 인원 16명)
- 10:00 – 11:00 (최대 신청 가능 인원 16명)

[3학년]
월요일
- 09:00 – 10:00 (최대 신청 가능 인원 16명)
- 10:00 – 11:00 (최대 신청 가능 인원 16명)
화요일
- 13:00 – 14:00 (최대 신청 가능 인원 16명)
금요일
- 09:00 – 10:00 (최대 신청 가능 인원 16명)

[4학년]
월요일
- 11:00 – 12:00 (최대 신청 가능 인원 16명)
- 13:00 – 14:00 (최대 신청 가능 인원 16명)
수요일
- 11:00 – 12:00 (최대 신청 가능 인원 16명)
- 13:00 – 14:00 (최대 신청 가능 인원 16명)

3. 신청 방법
- 임상실습행정실 메일(rnassist@hanyang.ac.kr)로 신청서를 작성하여 제출합니다. (첨부파일 신청서 예시 참고)
Open lab 진행할 인원을 모아 조를 구성하고, 한 명이 대표로 신청서를 제출합니다.
- 한 타임에 최대 2가지 술기까지 신청가능 합니다.
- 학생 1명당 주 1회 오픈랩 신청이 가능합니다. (예시 : 동일 학생이 월요일, 수요일 2개 타임 모두 신청은 불가)
희망하는 모든 학생들이 Open lab에 참여할 수 있도록 조끼리 소통하여 신청이 겹치지 않도록 소통해주십시오.
(★예외 : 2학년은 주 1회(목요일) 수업을 고려해 <(금주)목요일~(차주)목요일> 오픈랩 중 1회만 신청 가능)
- 신청은 최대 신청 가능 인원 내에서, 신청서 제출 및 접수 완료되는 순서대로 선착순 마감됩니다.
신청 후 참여하지 않은 경우, 신청 시간 기준 30분 이후에 참여하는 경우 2주 동안 Open lab 신청 및 참여 불가합니다.

4. 신청기간
- 신청서는 Open lab 날짜 <일주일 전 ~ 공휴일 제외 이틀 전> 행정실 근무시간(~오후 5시30분) 내에 제출합니다.
(기간 내에 신청서 제출하지 않은 경우 오픈랩 불가. 기간 엄수.)
(★예외 : <월요일> Open lab 신청은 전 주 <금요일 오전>까지 제출 가능)

5. 신청 시 유의사항
- 신청서 제출 후 반드시 메일 답변을 확인하십시오. (신청 불가능한 경우 그 사유를 답변드립니다.)
- 기자재 신청 수량은 실습실 물품 재고 고려하여, 임의로 신청한 수량보다 적게 준비될 수 있습니다.

6. Open lab 이용
- Open lab 시작 전 출력된 신청서 하단에 신청자가 직접 서명합니다. (전자 서명하여 신청서 제출 시 제외)
- Open lab 종료 전 Open lab 사용일지를 학생별로 작성하여 제출합니다. 사용일지 미작성 시 참여하지 않은 것으로 간주하여 2주간 Open lab 신청 및 참여가 불가합니다.

7. Open lab 시 유의사항
- 마지막 10분은 정리를 실시합니다. 정리 상태 불량 3회 적발 시 해당 조원 모두 Open lab 이용 불가합니다.
- 사용한 물품을 처음과 동일한 상태로 정리하고, 일반의료 폐기물과 손상성 폐기물을 반드시 구별하여 버립니다.
* 일반의료 폐기물/일반 쓰레기 : 제품 포장지, 알콜솜을 포함한 거의 모든 물품
* 손상성 폐기물 : 바늘류 및 앰플, 바이알 등 유리류 (손상성 폐기물 박스에 알콜솜, 주사기 몸통 등 폐기 금지)
- 뚜껑이 있는 생수 또는 밀폐되는 텀블러를 제외한 음료(테이크아웃 컵 등)를 실습실 내 반입 및 섭취 금지합니다.
  `;

  await prisma.notice.create({
    data: {
      id: 'official-guide',
      title: noticeTitle,
      content: noticeContent,
      isPinned: true,
      createdById: superAdmin.id,
    },
  });
  console.log('Official notice seeded');

  // 4. Create Semester and Grade Rules
  // Deactivate old semesters
  await prisma.semester.updateMany({
    data: { isActive: false }
  });

  const semester = await prisma.semester.upsert({
    where: { id: 'sem-2026-2' },
    update: { isActive: true, name: '2026학년도 2학기' },
    create: {
      id: 'sem-2026-2',
      name: '2026학년도 2학기',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  const gradeRules = [
    // 2학년: 화요일 9-10, 10-11 / 수요일 9-10, 10-11 (16명)
    { grade: 2, dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 2, startTime: '10:00', endTime: '11:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 3, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 3, startTime: '10:00', endTime: '11:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    // 3학년: 월요일 9-10, 10-11 / 화요일 13-14 / 금요일 9-10 (16명)
    { grade: 3, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 2, startTime: '13:00', endTime: '14:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 5, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    // 4학년: 월요일 11-12, 13-14 / 수요일 11-12, 13-14 (16명)
    { grade: 4, dayOfWeek: 1, startTime: '11:00', endTime: '12:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 4, dayOfWeek: 1, startTime: '13:00', endTime: '14:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 4, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 4, dayOfWeek: 3, startTime: '13:00', endTime: '14:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
  ];

  await prisma.openLabGradeRule.deleteMany({ where: { semesterId: semester.id } });
  for (const rule of gradeRules) {
    await prisma.openLabGradeRule.create({
      data: {
        ...rule,
        semesterId: semester.id
      }
    });
  }
  console.log('Grade rules seeded');

  // Create some initial slots for next week to test
  const nextWeekStart = new Date();
  nextWeekStart.setDate(nextWeekStart.getDate() + (7 - nextWeekStart.getDay()) + 1); // Next Monday

  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(nextWeekStart);
    currentDate.setDate(nextWeekStart.getDate() + i);
    const day = currentDate.getDay();

    const rulesForDay = gradeRules.filter(r => r.dayOfWeek === day);
    for (const rule of rulesForDay) {
      await prisma.openLabSlot.create({
        data: {
          semesterId: semester.id,
          allowedGrade: rule.grade,
          date: currentDate,
          startTime: rule.startTime,
          endTime: rule.endTime,
          room: rule.room,
          maxCapacity: rule.maxCapacity,
        }
      });
    }
  }
  console.log('Initial slots for next week generated');

  // Seed Nursing Terms for 간호관리학
  await prisma.nursingTerm.deleteMany({});
  const nursingTermsData = [
    { subject: '간호관리학', category: '기획', term: 'POSDCORB', englishTerm: 'POSDCORB', definition: '기획(P), 조직(O), 인사(S), 지휘(D), 조정(CO), 보고(R), 예산(B)으로 구성된 최고관리자의 관리과정 7단계' },
    { subject: '간호관리학', category: '기획', term: '비전', englishTerm: 'Vision', definition: '조직이 장기적으로 지향하는 바람직한 미래상과 궁극적 성취 목표를 명시한 구체적 서술서' },
    { subject: '간호관리학', category: '기획', term: '미션', englishTerm: 'Mission', definition: '조직의 존재 이유, 사회적 본질적 목적 및 기본 역할을 명시한 사명서' },
    { subject: '간호관리학', category: '기획', term: '전략적 기획', englishTerm: 'Strategic Planning', definition: '최고관리자가 외부 환경 변화 분석을 바탕으로 조직 전체의 장기적 목표와 방향을 설정하는 기획' },
    { subject: '간호관리학', category: '기획', term: '전술적 기획', englishTerm: 'Tactical Planning', definition: '중간관리자가 전략적 기획을 달성하기 위해 부서별 단위 목표 및 자원 배분을 계획하는 중기 기획' },
    { subject: '간호관리학', category: '기획', term: '운영적 기획', englishTerm: 'Operational Planning', definition: '일선관리자가 일상적인 간호 업무 수행을 위해 구체적인 단기 행동 계획, 규칙 및 수순을 수립하는 기획' },
    { subject: '간호관리학', category: '기획', term: 'SWOT 분석', englishTerm: 'SWOT Analysis', definition: '조직의 내부 환경인 강점(S), 약점(W)과 외부 환경인 기회(O), 위협(T)을 평가하여 최적의 전략을 도출하는 분석 도구' },
    { subject: '간호관리학', category: '기획', term: '목표관리', englishTerm: 'MBO', definition: '상급자와 하급자가 공동 참여하여 명확한 목표를 설정하고 결과를 주도적으로 측정·평가하는 관리 방법' },
    { subject: '간호관리학', category: '조직', term: '권한', englishTerm: 'Authority', definition: '합법적인 직위나 위치에 부여되어 타인의 행동을 요구하고 지시할 수 있는 공식적인 정당한 권리' },
    { subject: '간호관리학', category: '조직', term: '권력', englishTerm: 'Power', definition: '직위에 관계없이 타인의 행동이나 의사결정에 영향을 미칠 수 있는 인과적 역량' },
    { subject: '간호관리학', category: '조직', term: '위임', englishTerm: 'Delegation', definition: '상급자가 간호 업무 수행에 필요한 권한과 책임을 하급 간호사에게 부여하고 결과를 감독하는 과정' },
    { subject: '간호관리학', category: '조직', term: '직무분석', englishTerm: 'Job Analysis', definition: '특정 직무의 임무, 책임, 작업 조건 및 인적 자격요건에 관한 자료를 체계적으로 수집·분석하는 과정' },
    { subject: '간호관리학', category: '조직', term: '직무기술서', englishTerm: 'Job Description', definition: '직무 분석 결과를 바탕으로 직무의 성격, 위치, 주요 과업, 책임 및 작업 환경 등을 기록한 공식 문서' },
    { subject: '간호관리학', category: '조직', term: '직무명세서', englishTerm: 'Job Specification', definition: '특정 직무를 성공적으로 수행하는 데 요구되는 개인의 학력, 경험, 자격, 지식 등 인적 조건에 초점을 맞춰 작성한 문서' },
    { subject: '간호관리학', category: '조직', term: '라인 조직', englishTerm: 'Line Organization', definition: '최고경영자부터 일선 직원까지 지휘 명령 계통이 단일 직선 형태로 이루어진 고전적 조직 구조' },
    { subject: '간호관리학', category: '조직', term: '매트릭스 조직', englishTerm: 'Matrix Organization', definition: '기존 기능별 조직과 프로젝트(프로그램) 조직을 통합하여 2명의 상급자에게 보고하는 격자형 구조' },
    { subject: '간호관리학', category: '인사', term: '환자분류체계', englishTerm: 'Patient Classification System', definition: '환자의 간호 요구도와 질병 중증도를 수치화하여 필요한 간호 인력 수요를 산정하는 도구' },
    { subject: '간호관리학', category: '인사', term: '사기', englishTerm: 'Morale', definition: '조직 구성원들이 목표 달성을 향해 발휘하는 집단적 열의, 협동심 및 사명감' },
    { subject: '간호관리학', category: '인사', term: '직무만족', englishTerm: 'Job Satisfaction', definition: '간호사가 자신의 직무 환경과 업무 경험 평가에서 느끼는 긍정적이고 유쾌한 감정 상태' },
    { subject: '간호관리학', category: '인사', term: '이직률', englishTerm: 'Turnover Rate', definition: '일정 기간(예: 1년) 동안 조직을 퇴직하거나 이동한 간호사의 비율' },
    { subject: '간호관리학', category: '지휘', term: '변혁적 리더십', englishTerm: 'Transformational Leadership', definition: '리더가 구성원에게 영감을 주고 자아실현을 유도하여 기대 이상의 성과를 창출하는 리더십' },
    { subject: '간호관리학', category: '지휘', term: '거래적 리더십', englishTerm: 'Transactional Leadership', definition: '리더와 구성원 간의 성과 보상 계약과 통제를 바탕으로 목표를 달성하는 리더십' },
    { subject: '간호관리학', category: '지휘', term: '서번트 리더십', englishTerm: 'Servant Leadership', definition: '구성원에 대한 섬김과 헌신, 배려를 최우선으로 두어 구성원의 성장을 돕는 리더십' },
    { subject: '간호관리학', category: '지휘', term: '동기부여', englishTerm: 'Motivation', definition: '특정 목표를 달성하도록 인간의 행동을 자극하고 방향을 유도하며 지속시키는 내적 상태' },
    { subject: '간호관리학', category: '지휘', term: '임파워먼트', englishTerm: 'Empowerment', definition: '구성원에게 의사결정 재량권과 자율성을 부여하여 주도적으로 업무를 수행하게 하는 권한 부여 과정' },
    { subject: '간호관리학', category: '통제', term: '질 향상', englishTerm: 'QI', definition: '간호 서비스 과정 및 결과를 체계적으로 평가하고 표준화하여 간호 품질을 지속 개선하는 활동' },
    { subject: '간호관리학', category: '통제', term: '환자안전', englishTerm: 'Patient Safety', definition: '의료 서비스 제공 과정에서 발생하는 부작용, 오류 및 손상 위험을 최소화하여 환자를 보호하는 것' },
    { subject: '간호관리학', category: '통제', term: '린 6시그마', englishTerm: 'Lean Six Sigma', definition: '업무 공정상의 불필요한 낭비를 제거(Lean)하고 변동성 및 결함을 최소화(Six Sigma)하는 품질 통제 기법' },
    { subject: '간호관리학', category: '통제', term: '위해사건', englishTerm: 'Adverse Event', definition: '의료 행위 과정에서 질병 자체가 아닌 의료 관리상 문제로 인해 환자에게 발생한 상해나 불상사' },
    { subject: '간호관리학', category: '통제', term: '적신호사건', englishTerm: 'Sentinel Event', definition: '환자의 사망 또는 심각한 신체적·정신적 손상을 유발하여 즉각적인 원인 조사와 대책 마련이 필요한 중대한 위해 사건' },
    { subject: '간호관리학', category: '간호윤리', term: '자율성 존중의 원칙', englishTerm: 'Autonomy', definition: '환자가 자신의 치료 과정에 대해 충분한 정보를 바탕으로 스스로 결정권을 행사하도록 보장하는 윤리 원칙' },
    { subject: '간호관리학', category: '간호윤리', term: '선행의 원칙', englishTerm: 'Beneficence', definition: '환자의 안녕과 이익을 도모하고 선을 적극적으로 행해야 하는 윤리 원칙' },
    { subject: '간호관리학', category: '간호윤리', term: '악행금지의 원칙', englishTerm: 'Non-maleficence', definition: '환자에게 신체적·정신적 해를 가하거나 위험을 초래하지 말아야 하는 윤리 원칙' },
    { subject: '간호관리학', category: '간호윤리', term: '정의의 원칙', englishTerm: 'Justice', definition: '공정성과 평등성에 기반하여 의료 자원과 간호 서비스를 합리적으로 배분하는 윤리 원칙' },
    { subject: '간호관리학', category: '간호윤리', term: '설명 및 동의', englishTerm: 'Informed Consent', definition: '의료진이 진단, 치료계획, 위험성 등을 충분히 설명한 후 환자로부터 자발적 승낙을 받아야 하는 법적·윤리적 의무' },
  ];

  await prisma.nursingTerm.createMany({
    data: nursingTermsData,
  });
  console.log(`Nursing terms seeded (${nursingTermsData.length} items)`);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
