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

  // Seed Nursing Terms for 간호관리학 (category: 퀴즈 1) & 여성의부인과적장애와간호 (category: 중간고사 복습 퀴즈)
  await prisma.nursingTerm.deleteMany({});
  const nursingTermsData = [
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호관리', englishTerm: 'nursing management', definition: '간호조직의 목표 달성을 위하여 간호인력과 모든 자원을 활용하여 기획, 조직, 인적자원관리, 지휘, 통제를 하는 전 과정을 말한다.' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호관리체계모형', englishTerm: null, definition: '간호관리과정을 체계이론 관점으로 보고, 투입, 변환과정, 산출, 피드백으로 구성한다. 즉, 투입요소들이 관리지원기능의 지원 하에 전환과정을 거친 후 산출요소로 생산되는 순환과정을 말한다.' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '효과', englishTerm: 'efficiency', definition: '목적, 결과, 대상, 대외지향적인 것, 장기적인 측정치와 관련된 개념으로 목표달성을 의미한다.' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '효율', englishTerm: 'effectiveness', definition: '수단, 과정, 방법, 대내지향적인 것, 단기적인 측정치와 관련된 개념으로 업무수행 과정에서의 투입과 산출의 비율을 의미한다.' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호관리자의 관리수준', englishTerm: null, definition: '관리자의 유형으로, 최고관리자, 중간관리자, 일선관리자로 구분한다.' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '과학적 관리론', englishTerm: 'scientific management', definition: '작업의 능률과 효율을 향상시키기 위한 방법에 과학적 원칙을 적용한 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '행정관리이론', englishTerm: 'general administrative theory', definition: '전체로서의 조직관리에 초점을 두고 보편적 원리를 정립한 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '관료제이론', englishTerm: 'bureaucratic management', definition: '조직의 질서, 체제, 합리성, 통합성, 일관성을 강조하는 조직의 원형이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '인간관계론', englishTerm: 'human relations approach', definition: '조직구성원이 심리적·사회적 욕구를 가진 사회적 존재라는 가정 하에 구성원에 대한 인간성 존중을 통해 생산성을 도모하려는 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '행태과학론', englishTerm: 'behavioral science', definition: '조직 내에서 인간행동에 영향을 미치는 요인에 관한 지식을 체계화 한 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '체계이론', englishTerm: 'system theory', definition: '환경과 상호작용하는 개방체계로서의 조직이 특정 목표를 달성하기 위해 투입, 변환, 산출, 환류로 구성되는 통합체로서 기능한다는 사실을 정립한 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '상황이론', englishTerm: 'contingency theory', definition: '조직 외부의 환경, 조직 전체 시스템과 하위 시스템의 관계를 중시하며, 이러한 관계에 적합한 관리자의 능력·스타일을 찾아야 한다는 이론' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '재무관리', englishTerm: null, definition: '조직운영에 필요한 자금을 합리적으로 조달하고 그 자금을 효율적으로 운영하여 기업가치를 극대화하기 위한 의사결정을 수행하는 관리활동' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '대차대조표', englishTerm: null, definition: '일정 시점에서 그 기업의 재무상태를 표시하는 보고서' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '손익계산서', englishTerm: null, definition: '일정 기간에 기업의 경영성과를 나타내는 보고서, 당해기간에 발생한 모든 수익과 이에 대응되는 비용을 나타내는 재무보고서' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '현금흐름표', englishTerm: null, definition: '일정 기간에 현금이 어떻게 조달되고 사용되었는가를 보여주는 기본적 재무보고서' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '점진적 예산제', englishTerm: null, definition: '전 회계년도에서의 총 비용이 옳다는 가정 아래 전년도의 비용에 차기년도의 물가상승률이나 이자율을 곱하여 차기년도의 예산을 세우는 방법' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '영기준 예산제', englishTerm: 'zero-base', definition: '전 회계년도의 예산에 구애됨이 없이 조직체의 모든 사업과 활동에 대해 영기준(zero-base)을 적용해서 각각의 효율성과 효과성 및 중요성을 체계적으로 분석하고, 그에 따라 우선순위가 높은 사업·활동을 선택하여 실행예산을 결정하는 예산제도' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '운영예산', englishTerm: null, definition: '부서의 활동을 완수하기 위해 1년 이내에 소비하거나 사용할 서비스나 재화' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '상대가치수가제', englishTerm: null, definition: '진료항목 행위별 점수에 환산지수를 곱하여 총 진료비, 즉 수가를 책정하는 방식' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '포괄수가제', englishTerm: null, definition: '의료서비스의 양과 질에 관계없이 질병군(또는 환자군)별로 미리 책정된 정액진료비를 병의원에 지불하는 제도' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '신포괄수가제', englishTerm: null, definition: '입원 기간 동안 발생한 입원료, 처치 등 진료에 필요한 기본 서비스는 포괄수가로 묶고 의사의 수술, 시술 등은 행위별로 보상하는 제도' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '행위별수가제', englishTerm: null, definition: '개별 의료행위 각각에 수가를 산정하여 환자가 의료서비스를 많이 이용할수록 수가가 많이 부가되게 하는 방법' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호수가', englishTerm: null, definition: '간호사가 제공한 간호행위의 대가로 지불을 청구할 수 있는 금액' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호관리료', englishTerm: null, definition: '간호행위 중에서 개별 항목으로 수가화된 항목을 제외한 나머지 간호서비스에 대한 금액' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '간호관리료 차등제', englishTerm: null, definition: '간호인력 확보 수준에 따라 기본진료료 중 입원료를 차등 지급하는 제도' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '목표관리', englishTerm: 'management by objectives', definition: '조직의 상위관리자와 하위관리자들이 공동으로 목표를 설정하고 목표와 실제의 결과를 비교 통제하는 과정' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '의사결정', englishTerm: null, definition: '어떤 결정안에 이르는 사고 및 행동과정으로서 둘 이상의 문제해결 대안 중에서 의사결정자가 목적을 달성하는 데 가장 좋은 대안이라고 생각되는 것을 선택하는 행위' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '마케팅', englishTerm: 'marketing', definition: '개인과 조직들이 가치 창출 및 교환을 통해 자신들이 원하는 것을 얻기 위해 이루어지는 사회적·관리적 과정' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '서비스마케팅', englishTerm: 'service marketing', definition: '서비스란 특정한 소비자 욕구를 충족시키기 위해 제공되는 무형의 활동이며, 이러한 서비스가 고객의 기대와 욕구를 충족시킬 수 있도록 하는 일체의 활동' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '마케팅 믹스', englishTerm: 'marketing mix', definition: '마케팅을 목표로 효과적으로 달성하기 위한 도구들의 집합으로 제품(product), 가격(price), 유통(place), 촉진(promotion)의 4P로 불림' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '조직', englishTerm: 'organization', definition: '인간의 사회적, 개인적 목적을 달성하기 위한 집단의 모임' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '조직화', englishTerm: 'organizing', definition: '조직구성원들이 효과적으로 목표를 달성하도록 직무내용을 편성하고, 그 직무수행 에 필요한 권한 및 책임을 부여하며 조정해 가는 과정' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '통솔범위', englishTerm: 'span of control', definition: '관리자가 조직구성원을 효과적으로 관리할 수 있는 직원의 수' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '권력', englishTerm: 'power', definition: '어떤 개인이나 집단이 다른 개인 또는 집단의 형태에 영향을 미칠 수 있는 능력' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '권한', englishTerm: 'authority', definition: '조직의 규범에 의하여 합법성이 인정된 권력' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '위임', englishTerm: 'delegation', definition: '하위자에게 수행할 과업을 할당하고 그러한 과업수행 활동을 책임지는 데 필요한 재량권을 부여하는 것' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '집단', englishTerm: 'group', definition: '두 사람 이상이 모여 공동목표를 달성하기 위해 공통의 규범, 서로의 역할과 신분을 인정하고 상호작용하며, 유기적인 관계를 형성하는 개인들의 집합체' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '공식적 집단', englishTerm: 'formal group', definition: '조직 내에 지위, 부서, 계층 등을 가지고 형성된 집단으로 조직의 특정한 과업을 수행하기 위하여 이루어진 집단' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '비공식적 집단', englishTerm: 'informal group', definition: '조직 내에서 공식목표나 과업에 관계없이 자연적으로 형성된 집단' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '조직구조', englishTerm: 'organizational structure', definition: '조직의 경영활동을 위해 필요한 일과 부서, 직위 및 권한관계 등을 안정적으로 짜놓은 틀' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '집권화', englishTerm: 'centralization', definition: '의사결정의 권한이 중앙 또는 상위기관에서 이루어지는 것' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '분권화', englishTerm: 'decentralization', definition: '의사결정의 권한이 지방 또는 하급기관으로 위임되어 있는 것' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '공식적 조직', englishTerm: 'formal organization', definition: '공식적으로 만들어진 조직 내의 의도적인 역할구조' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '비공식적 조직', englishTerm: 'informal organization', definition: '자생적으로 형성된 개인적이고 사회적인 관계의 네트워크' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '라인 조직', englishTerm: 'line organization', definition: '명령이나 권한이 조직의 상층에서 이루어지는 명령형태' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '라인-스태프 조직', englishTerm: 'line-staff organization', definition: '조언기능을 발휘하여 라인업무를 효과적으로 지원할 수 있는 스태프 부서를 둔 조직' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '기능적 조직', englishTerm: 'functional organization', definition: '각 분야의 전문가를 두어 집행부서에 대한 지도 및 조언을 직접 할 수 있게 만든 조직' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '프로젝트 조직', englishTerm: 'project organization', definition: '특정 과업 달성을 위해 각 부서에서 전문요원을 차출하여 구성하는 한시적 조직' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '매트릭스 조직', englishTerm: 'matrix organization', definition: '기존 라인 조직에 프로젝트 조직을 결합시킨 형태' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '위원회 조직', englishTerm: 'commission organization', definition: '둘 이상의 사람이 모여 의사결정을 하는 조직 형태' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '기획', englishTerm: 'planning', definition: '조직이 달성해야 할 목표를 설정하고 이를 달성하기 위해 여러 대안 중 가장 좋은 안을 선택하는 과정' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '비전', englishTerm: 'vision', definition: '조직의 장래 목적과 지향점에 대한 진술로서, 조직구성원들이 함께 성취하기 원하는 것에 대한 청사진' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '사명', englishTerm: 'mission', definition: '조직이 존재하는 목적, 존재 이유, 사명 또는 임무' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '철학', englishTerm: 'philosophy', definition: '조직의 목적을 달성하기 위하여 조직의 행동을 이끌어가는 가치 또는 신념' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '목적과 목표', englishTerm: 'goal and objectives', definition: '목적은 기대하는 최종산물이며 목표는 목적을 실천하기 위해 일정 기간 내에 달성해야 할 바람직한 수준' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '정책', englishTerm: 'policies', definition: '목표달성을 위한 지침 또는 수단' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '절차', englishTerm: 'procedure', definition: '정책에 근거한 보다 구체적인 행동방식으로 표준화된 처리순서 또는 방법' },
    { subject: '간호관리학', category: '퀴즈 1', itemType: 'TERM', term: '규칙', englishTerm: 'rule', definition: '규칙은 일반적인 업무처리 기준이며, 구체적이고 명확한 행동을 요구하는 지침' },

    // 간호관리학 (카테고리: 퀴즈 2 - 10월 8일 배부 용어 및 사후테스트 포함)
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '간호표준', englishTerm: 'nursing standard', definition: '간호의 구조적, 과정적, 결과적측면의 질을 평가 할 수 있는 바람직한 수준에 대한 요약적 진술' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '갈등', englishTerm: 'conflict', definition: '상반되는 두 개 이상의 욕구 혹은 동기가 동시에 존재하여 한쪽을 만족시키고자 하면 다른 한쪽이 만족하지 않는 상태' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '모집', englishTerm: 'recruitment', definition: '조직의 목적 활동에 적합한 인력을 확보하기 위해 우수한 후보자들을 지원하게 하는 절차' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '선발', englishTerm: 'selection', definition: '모집활동에 의해 응모한 지원자 가운데 조직이 필요로 하는 직무에 적합한 자질을 갖추었다고 판단되는 간호직원을 채용할 것을 결정하는 과정' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '이직', englishTerm: 'turn over', definition: '자의나 직장의 사정, 정년 등으로 인하여 직장을 떠나는 것' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '인력개발', englishTerm: 'staffing development', definition: '직원의 직업적, 인격적인 지식, 기술 및 태도를 향상시키기 위하여 제공하는 모든 훈련과 교육' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '환자분류체계', englishTerm: 'patient classification system', definition: '각 환자에게 요구되는 간호의존도에 따른 간호시간, 양, 복잡성에 따라 환자를 분류하는 방법' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '고객접점', englishTerm: 'moment of truth : MOT', definition: '고객이 조직의 일면과 접촉하면서 그 서비스품질에 관하여 뭔가 인상을 얻을 수 있는 순간. 조직의 일면은 시설, 사람, 물건, 환경에 관한 모두를 뜻함' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '동기부여', englishTerm: 'motivation', definition: '개인이 어떤 목표를 달성하기 위해 노력하도록 해주는 과정' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '리더십', englishTerm: 'leadership', definition: '리더가 일정한 상황 하에서 목표달성을 위해 개인이나 집단행위에 영향력을 행사하는 과정' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '질 보장', englishTerm: 'quality assurance', definition: '비용감소에 따른 간호의 질을 보장하기 위해 문제해결 방법을 이용하는 관리 철학.' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '주장행동', englishTerm: 'assertive behavior', definition: '상대방의 권리를 침해하거나 불쾌감을 주지 않으면서 자신의 권리, 욕구, 의견, 생각, 느낌 등을 솔직하게 나타내는 행동' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '지표', englishTerm: 'indicator', definition: '특정기준의 달성정도를 객관적으로 측정할 수 있게 하는 관찰 및 측정 가능한 요소' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '전자의무기록', englishTerm: 'electronic medical record : EMR', definition: '병원에서 사용하는 종이문서를 없애고 모든 데이터를 전산매체에 저장하는 방식' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '처방전달시스템', englishTerm: 'order communication system : OCS', definition: '가장 기본이 되는 병원정보 시스템으로 환자에게 발생되는 처방을 중심으로 일어나는 모든 흐름을 전산화 한 것' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '의료영상저장전송시스템', englishTerm: 'picture archiving communication system : PACS', definition: '기존의 필름을 가지고 진단하고 판독하던 병원의 업무를 처리해 나가는데 도움을 주는 것' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '과실', englishTerm: 'negligence', definition: '유사한 상황에서 합리적이고 신중한 태도로 행동하지 않은 잘못' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '근접오류', englishTerm: 'near miss', definition: '의료오류가 발생하여 환자에 대한 위해 가능성이 있을 수 있으나 우연, 예방, 완화조치 등에 의해 환자에게 위해가 발생하지 않은 사건' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '위해사건', englishTerm: 'adverse event', definition: '환자에게 위해를 가져온 사건' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '안전문화', englishTerm: 'safety culture', definition: '조직의 모든 구성원들이 작업 환경에서 ‘ 안전’ 이라는 목표에 도달하는 방식의 하나로서 안전에 관하여 공유하는 태도나 신념, 인식, 가치관을 통칭하는 개념' },

    // 사후테스트 포함
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '관리', englishTerm: 'management', definition: '조직의 목표를 달성하기 위해 개인이나 그룹 모두가 자원을 활용하여 기획, 조직. 지휘, 인사, 통제를 하는 과정' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '권한', englishTerm: 'authority', definition: '공식적 권위에서 비롯되는 특정 지위에 부여되는 합법적 권력. 조직 규범에 의해 정당성이 인정된 합법적이니 권력' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '기획', englishTerm: 'planning', definition: '조직의 목적이나 목표를 사정, 수립하고 수행하여 평가하고 조정하는 지속적인 과정' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '목표관리', englishTerm: 'management by objectives : MBO', definition: '조직구성원의 참여과정을 통하여 상층관리자로부터 일선관리자에 이르기까지 그들이 연간목표를 설정하고 목표와 실제의 결과를 정기적으로 비교, 통제하는 관리시스템' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '비공식조직', englishTerm: 'informal organization', definition: '조직구성원들 사이의 인간관계를 바탕으로 자연발생적으로 나는 자생적 조직으로 조직기구표 상에는 나타나지 않는 조직 나타' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '임파워먼트', englishTerm: 'empowerment', definition: '실무자들의 업무수행능력을 제고시키고 잠재능력 및 창의력을 발휘하도록 관리자의 권한을 실무자에게 위임하는 것' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '오제이티', englishTerm: 'on the job training : OJT', definition: '직장 내 교육 및 훈련. 종업원가 경영자가 직무를 수행함으로써 기업목적달성에 기여하는 동시에, 직무에 대한 훈련을 받도록 하는 제도. 팀워크 조성이나 영향력이 강한 직속 상사가 업무에 대한 지식, 기능, 태도를 포함한 전인교육을 실시함으로써 사풍의 확립과 개인의 능력개발에 대한 성취감을 갖고 체계적 업무수행 능력을 배양하도록 도움.' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '정책', englishTerm: 'policies', definition: '조직의 목표를 달성하기 위한 방법을 제시하고, 목표를 행동화하는 과정 및 활동 범위를 알려주는 포괄적인 지침' },
    { subject: '간호관리학', category: '퀴즈 2', itemType: 'TERM', term: '지속적인 질 향상', englishTerm: 'continuous quality improvement : CQI', definition: '직무수행 시에 자료수집, 시스템분석, 변화제안에 다학제적 팀을 이용하며, 개선을 목적으로 하는 계속적인 측정과 평가과정' },

    // 간호관리학 (카테고리: 추가 퀴즈)
    {
      subject: '간호관리학',
      category: '추가 퀴즈',
      term: '1. 상황이론이 관리에 미친 영향은?\n가) 조직특성과 상황간의 관련성을 체계적으로 연구할 수 있는 개념적 특성을 제공해 준다.\n나) 조직의 영향요인은 환경, 기업규모, 기업문화이다.\n다) 조직과 상황 간의 적합, 부적합 관계를 규명함으로써 조직의 효율성을 높일 수 있게 한다.\n라) 인간의 사회적, 심리적 욕구 충족이 생산성 향상을 가져온다',
      englishTerm: null,
      definition: '상황이론은 조직과 상황 간의 관련성 및 적합관계를 통해 효율성을 도모하는 이론입니다. (가, 다)',
      answer: '② 가, 다',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 가, 나, 다',
        '② 가, 다',
        '③ 나, 라',
        '④ 라',
        '⑤ 가, 나, 다, 라'
      ],
    },
    {
      subject: '간호관리학',
      category: '추가 퀴즈',
      term: '2. 스코트(Scott)가 제시한 조직이론의 분류에 따른 관련 이론을 연결하시오.\n\n□ 폐쇄-합리적 조직이론:\n□ 폐쇄-자연적 조직이론:\n□ 개방-합리적 조직이론:\n\n[보기]\n1. 인간관계론  2. 과학적 관리론  3. 행정관리학파  4. 체계이론  5. 관료제이론  6. 구조적 상황이론  7. X, Y 이론',
      englishTerm: null,
      definition: '폐쇄-합리적: 과학적 관리론, 행정관리학파, 관료제이론 / 폐쇄-자연적: 인간관계론, X,Y이론 / 개방-합리적: 구조적 상황이론, 체계이론',
      answer: '폐쇄-합리적: 과학적 관리론, 행정관리학파, 관료제이론 / 폐쇄-자연적: 인간관계론, X,Y이론 / 개방-합리적: 구조적 상황이론, 체계이론',
      itemType: 'SHORT_ANSWER',
      options: [],
    },
    {
      subject: '간호관리학',
      category: '추가 퀴즈',
      term: '3. 예약율을 높이는 방안으로 병원 애플리케이션을 개발하기로 하였다. 이러한 전략은 마케팅 믹스 개발의 어떤 요소인가?',
      englishTerm: null,
      definition: '모바일 애플리케이션을 통한 예약 경로 확대는 의료서비스 접근성을 높이는 유통전략(Place)에 해당합니다.',
      answer: '3) 유통전략',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '1) 사람전략',
        '2) 제품전략',
        '3) 유통전략',
        '4) 가격전략',
        '5) 촉진전략'
      ],
    },
    {
      subject: '간호관리학',
      category: '추가 퀴즈',
      term: '4. 중환자실 간호관리자는 면회시간 운영에 대한 보호자들의 제안서 중 면회시간이 15분으로 제한되어 짧다는 불만사항을 개선하기 위해 면회 시간 변경에 대한 대안 의사결정을 하려고 한다. 의사결정 유형중 문제의 적응수준과 구조화 정도에 따라 알맞은 유형은?',
      englishTerm: null,
      definition: '일상적 부서 운영에 관한 문제이므로 운영적 의사결정이며, 문제 해결 절차가 정해진 정형적 의사결정입니다.',
      answer: '1) 운영적, 정형적',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '1) 운영적, 정형적',
        '2) 전략적, 정형적',
        '3) 운영적, 비정형적',
        '4) 전략적, 비정형적',
        '5) 관리적, 비정형적'
      ],
    },
    {
      subject: '간호관리학',
      category: '추가 퀴즈',
      term: '5. 제시된 조직 중 공식적 조직으로 분류 할 수 없는 것은?',
      englishTerm: null,
      definition: '병원 관리자로 구성된 의료봉사단은 구성원들의 자발적 의사에 의해 결성된 비공식적 조직(동호회/봉사모임)입니다.',
      answer: '1) 병원 관리자로 구성된 의료봉사단',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '1) 병원 관리자로 구성된 의료봉사단',
        '2) 병원 조직도에 그려져 있는 기획팀',
        '3) 병원시설관리를 위한 지원파트 직속 시설팀',
        '4) 간호본부 조직도에 그려진 임상간호과학 연구소',
        '5) 간호단위운영 지침서의 조직도에 그려져 있는 간호업무 개발 위원회'
      ],
    },

    // 성인간호학:인지조절 (카테고리: 5주차 퀴즈)
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '1. 우측 슬관절에 퇴행성 관절염을 앓고 있는 노인에게 시행할 간호로 부적절한 것은?',
      englishTerm: null,
      definition: '정답: ④관절의 부동',
      answer: '④관절의 부동',
      itemType: 'MULTIPLE_CHOICE',
      options: ['①수영', '②체중조절', '③등척성 운동', '④관절의 부동', '⑤열냉요법 적용'],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '2. 급성 통풍 환자에게 투여된 콜히친(colchicine)의 부작용은?',
      englishTerm: null,
      definition: '정답: ②설사',
      answer: '②설사',
      itemType: 'MULTIPLE_CHOICE',
      options: ['①복시', '②설사', '③혈뇨', '④저혈압', '⑤구강건조'],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '3. 다음 환자에게 일상생활 중 피해야 할 행동을 교육할 때 적절한 내용은?\n[사례] 오른쪽 손에 헤베르덴 결절을 가진 60대 여성이 심해지는 통증으로 내원하였다.',
      englishTerm: null,
      definition: '정답: ②마사지 시행',
      answer: '②마사지 시행',
      itemType: 'MULTIPLE_CHOICE',
      options: ['①수영하기', '②마사지 시행', '③쪼그려 앉지 않기', '④통증 시 휴식 취하기', '⑤매일 냉요법 적용하기'],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '4. 전고관절치환술을 받은 80대 남성의 다리 사이에 베개를 적용하는 목적은?',
      englishTerm: null,
      definition: '정답: ④탈구 예방',
      answer: '④탈구 예방',
      itemType: 'MULTIPLE_CHOICE',
      options: ['①염증 예방', '②통증 감소', '③부종 예방', '④탈구 예방', '⑤혈전 생성 예방'],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '5. 왼쪽 무릎의 전슬관절치환술을 받은 70대 환자의 기동성 증진을 위한 중재는?',
      englishTerm: null,
      definition: '정답: ④ 왼쪽 무릎 관절에 지속적수동운동기구(CPM)를 적용한다.',
      answer: '④ 왼쪽 무릎 관절에 지속적수동운동기구(CPM)를 적용한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 양쪽 대퇴 사이에 외전베개를 대어 준다.',
        '② 수술 직후 왼쪽 무릎에 온습포를 적용한다.',
        '③ 움직일 때 왼쪽 다리에 체중부하가 되도록 격려한다.',
        '④ 왼쪽 무릎 관절에 지속적수동운동기구(CPM)를 적용한다.',
        '⑤ 침상 안정 시 바로 누운 자세에서 양쪽 다리를 약간 올린다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '6. 전고관절치환술을 받은 지 2일 째 되는 환자의 중재로 옳은 것은?',
      englishTerm: null,
      definition: '정답: ①근육이완제를 투여한다.',
      answer: '①근육이완제를 투여한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①근육이완제를 투여한다.',
        '②수술한 쪽으로 측위를 취해준다.',
        '③90° 이상의 고관절 굴곡을 하게 한다.',
        '④매 시간 고관절 내회전 운동을 하게 한다.',
        '⑤한쪽 다리 위에 다른 쪽 다리를 편하게 올려놓게 한다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '7. 70대 골관절염 노인에게서 나타날 수 있는 증상은?',
      englishTerm: null,
      definition: '정답: ③헤베르덴 결절',
      answer: '③헤베르덴 결절',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①관절 염증',
        '②관절 기형',
        '③헤베르덴 결절',
        '④관절의 대칭적 부종',
        '⑤손과 발의 백조 목(swan neck) 기형'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '8. 70대 남성이 슬관절치환술을 받은 지 이틀이 지났을 때 기동성 증진을 위한 간호로 적절한 것은?',
      englishTerm: null,
      definition: '정답: ②대퇴사두근 힘주기 운동을 시작한다.',
      answer: '②대퇴사두근 힘주기 운동을 시작한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①체중부하운동을 시작한다.',
        '②대퇴사두근 힘주기 운동을 시작한다.',
        '③침상에 걸터앉아 다리를 아래로 내리게 한다.',
        '④수술 초기 환부를 침상위에 일직선으로 놓는다.',
        '⑤수술한 무릎에 간헐적 공기압박장치를 적용한다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '9. 손목의 정중신경부위를 가볍게 두드릴 때 3개 반 정도의 손가락에 작열감, 저림현상 등으로 수근관증후군을 확인할 수 있는 사정자료는?',
      englishTerm: null,
      definition: '정답: ①티넬 징후(Tinel’s sign)',
      answer: '①티넬 징후(Tinel’s sign)',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①티넬 징후(Tinel’s sign)',
        '②팔렌 징후(Phalen sign)',
        '③호만 징후(Homan sign)',
        '④커니그 징후(Kernig sign)',
        '⑤상지하수검사(drop arm test)'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '※ 다음 사례를 읽고 물음에 답하시오. (10~11)\n30년 전부터 관절통증이 있는 60대 여성이 최근에 Swan neck 기형(손의 기형)을 보이고 있다.\n\n10. 사례 환자에게 나타나는 증상에 대한 간호중재로 부적절한 것은?',
      englishTerm: null,
      definition: '정답: ⑤흔히 저녁에 손의 강직과 통증을 호소하며 냉찜질로 완화된다.',
      answer: '⑤흔히 저녁에 손의 강직과 통증을 호소하며 냉찜질로 완화된다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①수동적 저항운동이 효과적이다.',
        '②스테로이드를 적용하여 염증을 완화시킨다.',
        '③부목을 적용하면 통증이나 염증이 완화된다.',
        '④운동 전후로 따뜻한 물로 샤워하면 통증을 줄일 수 있다.',
        '⑤흔히 저녁에 손의 강직과 통증을 호소하며 냉찜질로 완화된다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '※ 다음 사례를 읽고 물음에 답하시오. (10~11)\n30년 전부터 관절통증이 있는 60대 여성이 최근에 Swan neck 기형(손의 기형)을 보이고 있다.\n\n11. 사례 환자의 질병에 대한 특징으로 옳은 것은?',
      englishTerm: null,
      definition: '정답: ②관절의 대칭적인 부종',
      answer: '②관절의 대칭적인 부종',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①직업적 환경의 영향',
        '②관절의 대칭적인 부종',
        '③근위지 관절에 부샤르 결절',
        '④원위지 관절에 헤르베덴 결절',
        '⑤한 자세로 오래 서 있을 때 나타나는 관절 강직'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '12. 골수염 환자의 치료 및 간호중재로 옳은 것은?',
      englishTerm: null,
      definition: '정답: ③자세를 바르게 유지하고 환부를 고정한다.',
      answer: '③자세를 바르게 유지하고 환부를 고정한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①스테로이드제를 경구투여한다.',
        '②항생제 염주(감염부위에 직접 주사)는 3주 이상 장기간 사용한다.',
        '③자세를 바르게 유지하고 환부를 고정한다.',
        '④치료 초기부터 체중부하를 자주 적용한다.',
        '⑤고농도 항생제를 1~2주 동안 정맥 내 투여한다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '13. 심한 요통을 동반한 체중감소와 발열로 내원한 30대 여성에게 척추결핵이 의심된다. 환자 사정 시 꼭 확인해야 하는 과거력은?',
      englishTerm: null,
      definition: '정답: ②폐결핵',
      answer: '②폐결핵',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①골수염',
        '②폐결핵',
        '③척추손상',
        '④류마티스열',
        '⑤화농성 늑막염'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '14. 전고관절치환술 후 퇴원한 환자가 일상생활에서 주의해야 할 사항으로 옳은 것은?',
      englishTerm: null,
      definition: '정답: ⑤수술 후 6주 이상 되어야 운전할 수 있다.',
      answer: '⑤수술 후 6주 이상 되어야 운전할 수 있다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①낮은 변기를 사용한다.',
        '②대퇴관절은 직각을 유지한다.',
        '③팔걸이가 없고 안락한 의자를 사용한다.',
        '④인공관절에 적응하기 위해 조깅을 한다.',
        '⑤수술 후 6주 이상 되어야 운전할 수 있다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '15. 골연화증 환자에게서 확인할 수 있는 검사결과로 적절한 것은?',
      englishTerm: null,
      definition: '정답: ⑤ 알칼리인산 분해효소(alkaline phosphatase) 증가, 부갑상샘 호르몬 증가',
      answer: '⑤ 알칼리인산 분해효소(alkaline phosphatase) 증가, 부갑상샘 호르몬 증가',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 혈청 내 칼슘 증가, 혈청 내 인 증가',
        '② 혈청 내 인 증가, 부갑상샘 호르몬 증가',
        '③ 혈청 내 칼슘 감소, 부갑상샘 호르몬 감소',
        '④ 알칼리인산 분해효소(alkaline phosphatase) 증가, 혈청 내 인 증가',
        '⑤ 알칼리인산 분해효소(alkaline phosphatase) 증가, 부갑상샘 호르몬 증가'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '16. 요통을 예방하기 위한 교육내용으로 부적절 한 것은?',
      englishTerm: null,
      definition: '정답: ①윗몸일으키기를 규칙적으로 한다.',
      answer: '①윗몸일으키기를 규칙적으로 한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①윗몸일으키기를 규칙적으로 한다.',
        '②슬관절과 고관절을 뻗은 상태로 눕는다.',
        '③몸을 비틀지 않고 전체를 움직이도록 한다.',
        '④서서 일할 때는 한쪽 다리를 발판에 올리고 한다.',
        '⑤물건을 을 경우 허리를 구부리지 않고 무릎을 구부린다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '17. 40대 여성이 류마티스관절염을 진단 받은 후 장기간 부신피질 호르몬을 투여받고 있다. 환자에게 골밀도 검사를 실시하는 이유를 가장 잘 설명한 것은?',
      englishTerm: null,
      definition: '정답: ④약물치료로 인한 골다공증 유발이 염려되므로',
      answer: '④약물치료로 인한 골다공증 유발이 염려되므로',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①나이의 위험성이 높으므로',
        '②혈중 비타민 A가 부족하므로',
        '③혈중에 칼시토닌 수치가 높으므로',
        '④약물치료로 인한 골다공증 유발이 염려되므로',
        '⑤류마티스관절염이 골다공증의 합병증을 일으킬 수 있으므로'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '18. 전고관절치환술을 받고 퇴원하는 환자에게 주의사항을 교육했을 때 이를 이해한 환자의 반응은?',
      englishTerm: null,
      definition: '정답: ④“30분 정도 산책할 수 있겠네요.”',
      answer: '④“30분 정도 산책할 수 있겠네요.”',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①“운전이 가능하겠네요.”',
        '②“수영을 할 수 있겠네요.”',
        '③“양반다리를 할 수 있겠네요.”',
        '④“30분 정도 산책할 수 있겠네요.”',
        '⑤“1시간 정도 앉아 있어도 괜찮겠네요.”'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '19. 다음과 같은 상황의 환자에게 가장 우선적으로 내릴 수 있는 간호진단은?\n• 80대 독거노인 • 요통과 식욕부진 • 키가 줄었음/척추후만증 • T 수치: -3.5',
      englishTerm: null,
      definition: '정답: ⑤ 골밀도 감소와 관련된 신체손상 위험성',
      answer: '⑤ 골밀도 감소와 관련된 신체손상 위험성',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 부동으로 인한 변비',
        '② 식욕부진과 관련된 영양결핍',
        '③ 외부자극 감소와 관련된 지식부족',
        '④ 지속적인 와상과 관련된 자기간호 결핍',
        '⑤ 골밀도 감소와 관련된 신체손상 위험성'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '20. 전고관절치환술 후 간호중재로 적절한 것은?',
      englishTerm: null,
      definition: '정답: ④허리 굽히는 운동을 삼가도록 교육',
      answer: '④허리 굽히는 운동을 삼가도록 교육',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①가벼운 조깅 권장',
        '②고관절 내전 자세 유지',
        '③체중부하운동 및 활동 격려',
        '④허리 굽히는 운동을 삼가도록 교육',
        '⑤고관절 굴곡-신전-내전 운동 격려'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '5주차 퀴즈',
      term: '21. 다음 대상자에게 전슬관절치환술을 시행하기 어려운 요인은?\n• 66세 여성 • T <-3 • 고혈압, 고지혈증 • 일상활동의 어려움 • 키 159㎝, 체중 51Kg • 류마티스관절염으로 관절 파괴',
      englishTerm: null,
      definition: '정답: ③골다공증',
      answer: '③골다공증',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '①고혈압',
        '②BMI 값',
        '③골다공증',
        '④65세 이상',
        '⑤류마티스관절염'
      ],
    },

    // 성인간호학:인지조절 (카테고리: 비사용증후군, 자기간호결핍 환자간호 퀴즈)
    {
      subject: '성인간호학:인지조절',
      category: '비사용증후군, 자기간호결핍 환자간호 퀴즈',
      term: '1. 왼쪽 장하지석고붕대(long leg cast)를 적용한 대상자 의 첫째와 둘째 발가락 사이에 자극을 주는 이유는?',
      englishTerm: null,
      definition: '첫째와 둘째 발가락 사이의 감각 사정은 심비골신경(deep peroneal nerve) 기능을 확인하기 위함입니다.',
      answer: '⑤ 비골신경 기능 확인',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 척추협착증 확인',
        '② 대퇴신경(femoral nerve) 기능 확인',
        '③ 좌골신경(sciatic nerve) 기능 확인',
        '④ 경골신경 기능 확인',
        '⑤ 비골신경 기능 확인'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '비사용증후군, 자기간호결핍 환자간호 퀴즈',
      term: '2. 오른쪽 장하지 석고붕대(long leg cast)를 한 40대 남성이 다리의 심한 통증과 발의 무감각을 호소하여 사정한 결과, 오른쪽 족배동 맥의 맥박소실과 부종을 관찰했을 때 우선적인 간호중재는?',
      englishTerm: null,
      definition: '극심한 통증, 무감각, 족배동맥 맥박 소실, 부종은 구획증후군(compartment syndrome)의 의심 징후로 즉시 석고붕대를 절개/제거하여 압박을 해소해야 합니다.',
      answer: '① 석고붕대를 제거한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 석고붕대를 제거한다.',
        '② 파울러 체위를 취해준다.',
        '③ 마약성 진통제를 투여한다.',
        '④ 압력붕대를 교체하여 다시 감는다.',
        '⑤ 오른쪽 다리의 등척성 운동을 격려한다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '비사용증후군, 자기간호결핍 환자간호 퀴즈',
      term: '3. 오토바이 사고로 30대 남성이 대퇴골절로 내부 고정술을 받은지 이틀이 되었을 때 적절한 간호중재는?',
      englishTerm: null,
      definition: '수술 후 대퇴사두근 힘주기(등척성 운동)는 근위축을 예방하고 정맥 환류를 촉진합니다.',
      answer: '④ 대퇴사두근 등척성 운동격려',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 휠체어 이동 격려',
        '② 대퇴경부 내회전 유지',
        '③ 고관절굴곡 운동 격려',
        '④ 대퇴사두근 등척성 운동격려',
        '⑤ 편하다면 수술한 부위로 측위 유지'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '비사용증후군, 자기간호결핍 환자간호 퀴즈',
      term: '4. 절단환자의 관절구축을 예방하기 위한 간호중재로 옳은 것은?',
      englishTerm: null,
      definition: '절단 후 24~48시간이 지나면 절단부 상승은 고관절/슬관절 굴곡구축을 유발하므로 더 이상 상승시키지 않습니다.',
      answer: '⑤ 48시간 이후에는 절단부를 상승하지 않는다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 대퇴사이에 베개를 놓는다.',
        '② 절단부를 규칙적으로 외전시킨다.',
        '③ 슬부나 둔부를 굴곡시킨 채 눕는다.',
        '④ 주기적으로 앙와위를 취하도록 한다.',
        '⑤ 48시간 이후에는 절단부를 상승하지 않는다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '비사용증후군, 자기간호결핍 환자간호 퀴즈',
      term: '5. 운동 중 무릎을 다쳐 장하지석고붕대를 적용한 20대 남성 에게서 비골신경 압박이 확인된다면 예상되는 합병증은?',
      englishTerm: null,
      definition: '비골신경 손상 시 족배굴곡이 불가능해져 발이 아래로 처지는 족하수(footdrop)가 발생합니다.',
      answer: '③ 족하수(footdrop)',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 근육수축',
        '② 관절경축',
        '③ 족하수(footdrop)',
        '④ 구획증후군(compartment syndrome)',
        '⑤ 볼크만 허혈 구축(Volkman’s ischemic contracture)'
      ],
    },

    // 성인간호학:인지조절 (카테고리: 기동성 장애 4주차 퀴즈)
    {
      subject: '성인간호학:인지조절',
      category: '기동성 장애 4주차 퀴즈',
      term: '1. 40대 여성이 아래와 같은 증상을 호소할 때 나타날 수 있는 검사 결과는?\n- 아침 강직과 통증\n- 관절의 대칭적인 부종\n- 관절의 백조 목(swan neck) 변형',
      englishTerm: null,
      definition: '류마티스 관절염(RA)의 전형적 증상으로 자가면역 검사상 류마티스인자(RF) 양성 소견을 보입니다.',
      answer: '④ 류마티스인자 양성',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 백혈구 증가',
        '② 적혈구 증가증',
        '③ C-반응 단백 감소',
        '④ 류마티스인자 양성',
        '⑤ 자가항체검사 음성'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '기동성 장애 4주차 퀴즈',
      term: '2. 60대 여성이 오른쪽 어깨관절의 심한 통증으로 내원 후, 회전근개파열로 진단받았다. 회전근개복수술을 받은 후 간호중재로 옳은 것은?',
      englishTerm: null,
      definition: '회전근개 봉합술 후 수술 부위 보존을 위해 어깨 고정기/외전 베개를 이용하여 수술한 어깨를 외전 상태로 고정합니다.',
      answer: '① 오른쪽 어깨를 어깨 고정기로 외전시킨다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 오른쪽 어깨를 어깨 고정기로 외전시킨다.',
        '② 오른쪽 팔에 수 주 동안 냉요법을 적용한다.',
        '③ 오른쪽 어깨의 내회전 관절운동을 하게 한다.',
        '④ 오른쪽 팔을 수 주 동안 움직이지 않도록 한다.',
        '⑤ 오른쪽 팔의 통증이 느껴져도 어깨 위로 팔을 올린다.'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '기동성 장애 4주차 퀴즈',
      term: '3. 통풍 환자에게 권장할 수 있는 음식은?',
      englishTerm: null,
      definition: '통풍 환자는 퓨린 함량이 높은 붉은 고기, 내장(곱창), 정어리, 조개류를 제한하고 곡류(흑미밥)나 채소를 권장합니다.',
      answer: '④ 흑미밥',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 곱창',
        '② 쇠고기',
        '③ 정어리',
        '④ 흑미밥',
        '⑤ 모시조개'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '기동성 장애 4주차 퀴즈',
      term: '4. 어깨통증을 호소하는 40대 남성의 회전근개 손상이 의심될 때 확인하는 검사는?',
      englishTerm: null,
      definition: '상지하수 검사(Drop arm test)는 팔을 90도 외전시킨 후 스스로 천천히 내리게 하여 극상근/회전근개 파열을 사정하는 검사입니다.',
      answer: '③ 상지하수 검사(Drop arm test)',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 티넬 징후(Tinel’s sign)',
        '② 팔렌 징후(Phalen’s sign)',
        '③ 상지하수 검사(Drop arm test)',
        '④ 맥머레이 검사(McMurray test)',
        '⑤ 모세혈관 충만검사(Blanching test)'
      ],
    },
    {
      subject: '성인간호학:인지조절',
      category: '기동성 장애 4주차 퀴즈',
      term: '5. 류마티스관절염 환자에게 시행할 운동에 대한 교육내용으로 적절한 것은?',
      englishTerm: null,
      definition: '류마티스 관절염 운동 중/후 2시간 이상 지속되는 통증이 나타나면 관절 과사용 징후이므로 운동을 중단하거나 강도를 줄여야 합니다.',
      answer: '③ 운동 후 2시간까지 통증이 지속되면 그 운동은 중지하도록 한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 마비증세 시 움직이지 않고 안정하는 것이 우선적이다.',
        '② 관절에 강직 증세가 나타나면 힘을 주어 움직이면서 운동한다.',
        '③ 운동 후 2시간까지 통증이 지속되면 그 운동은 중지하도록 한다.',
        '④ 마비증세가 있을 때에는 통증을 느끼지 못하므로 운동을 많이 하는 것이 좋다.',
        '⑤ 염증이 심한 경우의 운동은 관절손상을 일으키므로 증상이 완화될 때까지 절대안정을 한다.'
      ],
    },

    // 여성의부인과적장애와간호 (카테고리: 중간고사 복습 퀴즈)
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which menstrual cycle length is within the normal range?',
      englishTerm: null,
      definition: '정답: 32 days',
      answer: '32 days',
      itemType: 'MULTIPLE_CHOICE',
      options: ['19 days', '32 days', '45 days'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman who previously menstruated regularly has missed several periods. What should the nurse assess FIRST?',
      englishTerm: null,
      definition: '정답: Pregnancy status',
      answer: 'Pregnancy status',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Serum progesterone', 'Serum prolactin', 'Pregnancy status'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Frequent epistaxis and easy bruising in a woman with heavy menstrual bleeding may suggest an underlying bleeding disorder.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'In a pale, dizzy patient with heavy menstrual bleeding, temperature should be assessed before BP and HR because infection is the primary concern.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which finding is a red flag in abnormal uterine bleeding assessment?',
      englishTerm: null,
      definition: '정답: Soaking a pad every 1 hour',
      answer: 'Soaking a pad every 1 hour',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Bleeding for 6 days', 'Mild cramps', 'Soaking a pad every 1 hour'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'PMS symptoms usually begin after menstruation starts and continue throughout the follicular phase.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which deficiencies have been proposed as contributors to PMS?',
      englishTerm: null,
      definition: '정답: Vitamin B6 and magnesium',
      answer: 'Vitamin B6 and magnesium',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Iron and calcium', 'Vitamin C and zinc', 'Vitamin B6 and magnesium'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman reports fatigue and irritability all month. What finding would make PMS less likely?',
      englishTerm: null,
      definition: '정답: Symptoms are noncyclic',
      answer: 'Symptoms are noncyclic',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Symptoms are noncyclic', 'Symptoms worsen before menses', 'Symptoms improve with menses'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'In women with secondary dysmenorrhea, pain may begin 1–2 weeks before menstruation and persist for several days after menstruation ends.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman has suspected secondary dysmenorrhea. What is the priority?',
      englishTerm: null,
      definition: '정답: Treat underlying disorder',
      answer: 'Treat underlying disorder',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Apply heat', 'Bed rest', 'Treat underlying disorder'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which patient meets one of the criteria for primary amenorrhea?',
      englishTerm: null,
      definition: '정답: A 15-year-old with secondary sexual characteristics who has never menstruated',
      answer: 'A 15-year-old with secondary sexual characteristics who has never menstruated',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'A 12-year-old who has not yet had menarche',
        'A 15-year-old with secondary sexual characteristics who has never menstruated',
        'A 16-year-old whose menstrual cycles occur every 35 days'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A 14-year-old reports menstruation lasting 9 days and soaking a pad every 1–2 hours. She appears pale and dizzy. What is the nurse’s priority?',
      englishTerm: null,
      definition: '정답: Assess hemodynamic stability and possible anemia',
      answer: 'Assess hemodynamic stability and possible anemia',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Assess her preferred menstrual pad',
        'Teach relaxation techniques',
        'Assess hemodynamic stability and possible anemia'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which statement correctly distinguishes the climacteric from menopause?',
      englishTerm: null,
      definition: '정답: The climacteric is a transitional period, whereas menopause is a specific event',
      answer: 'The climacteric is a transitional period, whereas menopause is a specific event',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Menopause is broader than climacteric',
        'Both refer only to the final menstrual period',
        'The climacteric is a transitional period, whereas menopause is a specific event'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'As ovarian follicles decline during the menopausal transition, which hormonal pattern occurs?',
      englishTerm: null,
      definition: '정답: AMH ↓, inhibin B ↓, FSH ↑',
      answer: 'AMH ↓, inhibin B ↓, FSH ↑',
      itemType: 'MULTIPLE_CHOICE',
      options: ['AMH ↑, inhibin B ↑, FSH ↓', 'AMH ↓, inhibin B ↓, FSH ↑', 'AMH ↑, inhibin B ↓, FSH ↑'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which finding is most consistent with genitourinary syndrome of menopause (GSM)?',
      englishTerm: null,
      definition: '정답: Vaginal dryness',
      answer: 'Vaginal dryness',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Increased vaginal lubrication', 'Vaginal dryness', 'Decreased vaginal pH'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Menopause is a treatable disease.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Receiving chemotherapy can be a cause of menopause.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Menopausal transition is the period from the onset of persistent menstrual cycle changes until the first 12 months after the final menstrual period.',
      englishTerm: null,
      definition: 'False — 엄밀한 병기에서 menopausal transition은 최종 월경 시점까지입니다. 최종 월경 후 첫 12개월은 초기 폐경후기에 속합니다.',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Bone loss accelerates around the FMP and is fastest during the first 3 to 5 years after menopause.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'The increased risk of osteoporosis after menopause is mainly due to decreased osteoclast activity caused by estrogen deficiency.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'What is the main cause of osteoporosis in postmenopausal women?',
      englishTerm: null,
      definition: '정답: Decreased estrogen levels',
      answer: 'Decreased estrogen levels',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Decreased progesterone levels', 'Decreased estrogen levels', 'Decreased hCG levels'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A 36-year-old woman asks about starting a combined oral contraceptive pill. Which finding is MOST important for the nurse to consider?',
      englishTerm: null,
      definition: '정답: She smokes cigarettes daily.',
      answer: 'She smokes cigarettes daily.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'She wants more regular periods.',
        'She has mild acne.',
        'She smokes cigarettes daily.',
        'She has mild dysmenorrhea.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which statement BEST explains the contraceptive mechanism of a copper IUD?',
      englishTerm: null,
      definition: '정답: It releases copper ions that impair sperm function.',
      answer: 'It releases copper ions that impair sperm function.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'It releases progestin that thickens cervical mucus.',
        'It releases copper ions that impair sperm function.',
        'It permanently suppresses ovulation.',
        'It blocks both fallopian tubes mechanically.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A man has undergone a vasectomy. Which discharge instruction is most appropriate?',
      englishTerm: null,
      definition: '정답: Use another contraceptive method until semen analysis confirms success.',
      answer: 'Use another contraceptive method until semen analysis confirms success.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'No additional contraception is needed after the procedure.',
        'Ejaculation will no longer occur after the procedure.',
        'Use another contraceptive method until semen analysis confirms success.',
        'Testosterone production will decrease after the procedure.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman presents 96 hours after unprotected intercourse and requests emergency contraception. Which option is MOST appropriate?',
      englishTerm: null,
      definition: '정답: Use ulipristal acetate (ellaOne), which can be used for up to 120 hours.',
      answer: 'Use ulipristal acetate (ellaOne), which can be used for up to 120 hours.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Emergency contraception is used to terminate an established pregnancy.',
        'Use ulipristal acetate (ellaOne), which can be used for up to 120 hours.',
        'No emergency contraception is useful after 72 hours.',
        'Levonorgestrel (NorLevo One), because it remains equally effective through 120 hours.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Nausea and headaches are common side effects of emergency contraceptive pills.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Progestin-only pills are used for women who are breastfeeding to avoid estrogen-related venous thromboembolism (VTE) risk.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Spermicides are inserted right after intercourse to maximize effectiveness.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman is learning how to use a diaphragm for contraception. Which statement by the woman indicates a need for further teaching?',
      englishTerm: null,
      definition: '정답: “I can remove it immediately after intercourse.”',
      answer: '“I can remove it immediately after intercourse.”',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '“I will insert it before intercourse.”',
        '“I will make sure it completely covers the cervix.”',
        '“I can remove it immediately after intercourse.”',
        '“Using spermicide with it can increase effectiveness.”'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which contraceptive method also helps protect against sexually transmitted infections (STIs)?',
      englishTerm: null,
      definition: '정답: Condom',
      answer: 'Condom',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Cervical cap', 'Oral contraceptive pill', 'Vasectomy', 'Withdrawal method', 'Condom'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'What is the primary mechanism of a diaphragm or cervical cap?',
      englishTerm: null,
      definition: '정답: Physically blocking sperm entering the cervix',
      answer: 'Physically blocking sperm entering the cervix',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Suppressing ovulation', 'Physically blocking sperm entering the cervix', 'Weakening the endometrium'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'What is the main contraceptive mechanism of combined oral contraceptive pills?',
      englishTerm: null,
      definition: '정답: Suppression of ovulation',
      answer: 'Suppression of ovulation',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Suppression of ovulation', 'Impairment of sperm', 'Blocking the fallopian tube by releasing FSH'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Near ovulation, cervical mucus typically becomes:',
      englishTerm: null,
      definition: '정답: Clearer, wetter, and stretchier',
      answer: 'Clearer, wetter, and stretchier',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Clearer, wetter, and stretchier', 'Thick, dry, and sticky', 'Completely absent'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which assisted reproductive technique is injecting a single sperm directly into an egg cell?',
      englishTerm: null,
      definition: '정답: ICSI',
      answer: 'ICSI',
      itemType: 'MULTIPLE_CHOICE',
      options: ['IUI', 'IVF', 'ICSI', 'HSG', 'IGH'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which contraceptive method contains no hormones?',
      englishTerm: null,
      definition: '정답: Copper IUD',
      answer: 'Copper IUD',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Combined oral contraceptive pills', 'Implanon', 'Copper IUD', 'Progestin-only pill'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'AMH (Anti-Müllerian hormone) can be tested on any day of the menstrual cycle.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'IUI requires at least one patent fallopian tube because fertilization still occurs in the fallopian tube.',
      englishTerm: null,
      definition: '정답: True',
      answer: 'True',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Oocyte (egg cell) retrieval during IVF is usually performed after ovulation has occurred.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'In IVF-ET, fertilization occurs inside the woman’s fallopian tube.',
      englishTerm: null,
      definition: '정답: False',
      answer: 'False',
      itemType: 'TRUE_FALSE',
      options: ['True', 'False'],
    },
    // Inclass 복습 문제들
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which hormone is secreted by the anterior pituitary gland and shows a rapid surge immediately before ovulation?',
      englishTerm: null,
      definition: '황체형성호르몬',
      answer: 'Luteinizing hormone (LH)',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Luteinizing hormone (LH)', 'Estrogen', 'Vasopressin', 'Progesterone'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A woman experiences anxiety, weight gain, and edema severe enough to interfere with daily activities several days before menstruation. These symptoms occur cyclically and disappear when menstruation begins. Which nursing intervention is most appropriate?',
      englishTerm: null,
      definition: '녹황색 채소 섭취를 늘리게 한다.',
      answer: 'Increase the intake of green and yellow vegetables.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Increase the intake of fried foods',
        'Increase the intake of green and yellow vegetables.',
        'Increase the intake of caffeinated beverages.',
        'Increase the intake of concentrated sweets.',
        'Increase the intake of salty foods.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which of the following is a cause of primary amenorrhea?',
      englishTerm: null,
      definition: '처녀막 막힘증',
      answer: 'Imperforate hymen',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Pregnancy',
        'Premature menopause / Premature ovarian insufficiency',
        'Imperforate hymen',
        'Postpartum breastfeeding',
        'Intrauterine adhesions after miscarriage'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A 23-year-old woman with a regular 28-day menstrual cycle reports that she has not had a menstrual period for the past 3 months. Which test should be performed first?',
      englishTerm: null,
      definition: '사람융모성선자극호르몬 검사',
      answer: 'Human chorionic gonadotropin, hCG test',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Chest X-ray',
        'Red blood cell count',
        'Hysterosalpingography, HSG',
        'Cervical cancer screening',
        'Human chorionic gonadotropin, hCG test'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'A 14-year-old girl with no history of sexual activity reports that after menarche, she has not had another menstrual period for 2 months. Which explanation by the nurse is most appropriate?',
      englishTerm: null,
      definition: '"초경 후 첫 1년 동안은 월경주기가 불규칙할 수 있습니다."',
      answer: '"Menstrual cycles can be irregular during the first year after menarche."',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '"An imperforate hymen is suspected."',
        '"If amenorrhea continues, the risk of endometrial cancer will increase."',
        '"This is caused by excessive ovulation."',
        '"Menstrual cycles can be irregular during the first year after menarche."',
        '"This is caused by increased progesterone secretion."'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which hormone increases as menopause progresses?',
      englishTerm: null,
      definition: '정답: Follicle-stimulating hormone (FSH)',
      answer: 'Follicle-stimulating hormone (FSH)',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Growth hormone', 'Estrogen', 'Progesterone', 'Follicle-stimulating hormone (FSH)', 'Oxytocin'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which food is recommended for women experiencing menopausal symptoms?',
      englishTerm: null,
      definition: '정답: Soy products',
      answer: 'Soy products',
      itemType: 'MULTIPLE_CHOICE',
      options: ['Soy products', 'High-fat foods', 'High-sodium foods', 'Refined carbohydrate foods', 'Processed foods high in phosphorus'],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'Which statement about the menopausal transition in a 49-year-old woman is correct?',
      englishTerm: null,
      definition: '정답: Loss of ovarian follicles accelerates.',
      answer: 'Loss of ovarian follicles accelerates.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'The ovaries increase in size.',
        'Loss of ovarian follicles accelerates.',
        'Estrogen secretion progressively increases.',
        'FSH secretion decreases.',
        'Progesterone secretion increases.'
      ],
    },
    {
      subject: '여성의부인과적장애와간호',
      category: '중간고사 복습 퀴즈',
      term: 'In which situation may menopausal hormone therapy (MHT) be considered?',
      englishTerm: null,
      definition: '정답: Hot flashes and vasomotor symptoms',
      answer: 'Hot flashes and vasomotor symptoms',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'Thrombophlebitis',
        'Active liver disease',
        'History of endometrial cancer',
        'Hot flashes and vasomotor symptoms',
        'Undiagnosed vaginal bleeding'
      ],
    },

    // 아동건강문제와가족간호2
    // 카테고리 1: 호흡기능장애 아동의 간호
    {
      subject: '아동건강문제와가족간호2',
      category: '호흡기능장애 아동의 간호',
      term: '아동기 호흡기계 특성으로 적절하지 않은 것은?',
      englishTerm: null,
      definition: '아동의 늑골은 성인에 비해 수평적인 구조를 가지고 있어 호흡 시 갈비뼈의 운동성이 제한적이며 복식호흡에 의존합니다.',
      answer: '늑골이 성인에 비해 경사진 구조이다',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '늑골이 성인에 비해 경사진 구조이다',
        '유스타키오관이 짧고, 넓고, 수평적이다',
        '면역 체계가 미숙하다',
        '점액선의 밀도가 높다'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '호흡기능장애 아동의 간호',
      term: '비인두염에 대한 설명으로 옳은 것은?',
      englishTerm: null,
      definition: '비인두염(감기)은 대부분 라이노바이러스 등 바이러스 감염이 원인이므로 특별한 치료 없이 자연 치유되며 대증요법을 시행합니다. 아스피린은 아동에게 라이증후군 위험이 있어 금기입니다.',
      answer: '특별한 치료 없이 자연경과를 보인다',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        'A군 연쇄상구균이 주 원인이다',
        '나이가 많을수록 증상이 심하고 합병증이 자주 발생한다',
        '고열 시 아스피린 등 해열제를 복용한다',
        '특별한 치료 없이 자연경과를 보인다'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '호흡기능장애 아동의 간호',
      term: '편도염에 관한 설명으로 옳은 것은?',
      englishTerm: null,
      definition: '편도염은 원인균에 따라 치료법이 달라집니다. 바이러스성인 경우 대증요법을, 세균성인 경우 항생제 치료를 시행합니다.',
      answer: '바이러스성인 경우 대증요법을, 세균성인 경우 항생제 치료를 한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '바이러스성인 경우 대증요법을, 세균성인 경우 항생제 치료를 한다.',
        '편도비대로 불편감 호소 시 편도선절제술이 추천된다',
        '항생제 내성을 막기 위해 증상 완화시 복용을 중단한다',
        '편도절제술 후 배액 촉진을 위해 앙와위를 취한다'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '호흡기능장애 아동의 간호',
      term: '생후 9개월 영아가 매우 보채고 오른쪽 귀와 가까운 머리카락을 잡아 당기며 부르는 소리에 반응하지 않는다. 의심할 수 있는 질환은?',
      englishTerm: null,
      definition: '영아가 귀를 잡아당기거나 비비는 행위, 통증으로 인한 보채기, 난청(부르는 소리에 불응)은 급성 중이염(Otitis media)의 대표적 징후입니다.',
      answer: '중이염',
      itemType: 'SHORT_ANSWER',
      options: [],
    },

    // 카테고리 2: 면역기능장애 아동의 간호
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '1. 아동기 면역체계와 면역질환의 특성으로 옳은 것은?',
      englishTerm: null,
      definition: '아동기 면역질환은 성장에 따라 병변 부위나 증상이 변화(알레르기 행진)하거나 연령 증가에 따라 자연 호전되기도 합니다.',
      answer: '③ 면역질환과 관련된 임상증상은 아동의 성장과 함께 변화하거나 사라지기도 한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 다양한 면역질환 진단방법을 통해 정확한 진단이 가능하다.',
        '② 신생아는 모체순환과 모유를 통해 면역글로불린을 받아 1년간 수동면역을 지닌다.',
        '③ 면역질환과 관련된 임상증상은 아동의 성장과 함께 변화하거나 사라지기도 한다.',
        '④ 면역체계가 미숙하여 면역질환에 의한 임상증상이 가볍게 나타난다.'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '2. 아토피피부염의 임상증상과 치료에 대한 설명으로 옳은 것은?',
      englishTerm: null,
      definition: '아토피피부염 환아의 약 50%에서 천식이나 알레르기 비염 등의 다른 알레르기 질환으로 이환되는 알레르기 행진(atopic march)을 보입니다.',
      answer: '② 아토피피부염 환아의 절반 정도가 천식으로 이환된다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 영아에서는 사지의 접히는 부위에, 아동에서는 펴지는 부위에 병변이 분포 한다.',
        '② 아토피피부염 환아의 절반 정도가 천식으로 이환된다.',
        '③ 전염성이 있기 때문에 긴팔이나 긴 바지를 착용한다.',
        '④ 보습크림은 가려움증을 유발할 수 있어 사용을 피한다.'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '3. 알레르기비염에서 코막힘으로 인해 구강호흡이 지속되면 입을 벌리고 숨을 쉬게 되면서 앞니가 튀어나오는 등 특징적인 얼굴형을 무엇이라고 하는가?',
      englishTerm: null,
      definition: '만성 구강호흡으로 인해 상악 치열이 좁아지고 앞니가 돌출되는 특징적인 아동의 얼굴형을 아데노이드 얼굴(Adenoid facies)이라 합니다.',
      answer: '아데노이드 얼굴 / 아데노이드 페이스 / Adenoid facies',
      itemType: 'SHORT_ANSWER',
      options: [],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '4. 천식의 약물요법 중 급성 증상을 완화하는 데에 사용되는 약물은?',
      englishTerm: null,
      definition: 'Albuterol은 속효성 베타2-아고니스트(SABA)로, 급성 증상 완화제(Quick reliever)로 사용됩니다.',
      answer: '④ Albuterol',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① Corticosteroid',
        '② Aminophylline',
        '③ Cromolyn sodium',
        '④ Albuterol'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '5. 가와사키병의 대표적인 임상증상으로 옳지 않은 것은?',
      englishTerm: null,
      definition: '아쇼프소체(Aschoff body)는 류마티스열(Rheumatic fever)의 특징적 병리 소견입니다.',
      answer: '② 아쇼프소체',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 결막 충혈',
        '② 아쇼프소체',
        '③ 전신 홍반',
        '④ 경부림프절 비대'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '면역기능장애 아동의 간호',
      term: '6. 7세 남아가 엉덩이와 다리에 출혈성 반점이 여러개 생겨 병원에 내원하였다. 사정 결과 최근 구토와 설사가 빈번하고, 무릎이 아프다고 호소하였다. 혈액검사 결과 혈소판 수치나 혈액응고 관련 검사 모두 정상이었다. 이 아동에게 의심되는 질환은?',
      englishTerm: null,
      definition: '혈소판 수치가 정상임에도 엉덩이와 하지의 자색반, 복통(구토, 설사), 관절통이 동반되는 IgA 매개 혈관염 질환입니다.',
      answer: '헤노흐-쇤라인 자색반병 / 헤노흐 쇤라인 자색반병 / 헤노흐-쇤라인 자반증 / 헤노흐 쇤라인 자반증 / HSP',
      itemType: 'SHORT_ANSWER',
      options: [],
    },

    // 카테고리 3: 혈액기능장애 아동의 간호
    {
      subject: '아동건강문제와가족간호2',
      category: '혈액기능장애 아동의 간호',
      term: '1. 철결핍빈혈의 임상증상으로 옳지 않은 것은?',
      englishTerm: null,
      definition: '골격 이상은 지중해성 빈혈이나 겸상적혈구빈혈 등 골수 확장이 일어나는 용혈성 빈혈의 특징입니다.',
      answer: '④ 골격 이상이 나타난다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 밤에 푹 자지 못하고 자주 깨어나 보챈다.',
        '② 이미증이 나타난다.',
        '③ 스푼형 손톱이 나타난다.',
        '④ 골격 이상이 나타난다.'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '혈액기능장애 아동의 간호',
      term: '2. 재생불량빈혈의 치료 및 간호로 적절한 것은?',
      englishTerm: null,
      definition: '중증 재생불량빈혈의 주 치료법은 HLA 일치 공여자로부터 조혈모세포(골수) 이식을 시행하는 것입니다.',
      answer: '② HLA가 일치하는 공여자로부터 골수이식을 한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 60%에서 6개월 이내 자연 치유된다.',
        '② HLA가 일치하는 공여자로부터 골수이식을 한다.',
        '③ 비장을 절제한다.',
        '④ 철분 제제를 식간에 오렌지주스와 함께 복용한다.'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '혈액기능장애 아동의 간호',
      term: '3. 다음 검사 중 혈소판 기능 평가 검사가 아닌 것은?',
      englishTerm: null,
      definition: '프로트롬빈시간(PT)은 외인성 응고 기전 및 응고인자를 평가하는 검사입니다.',
      answer: '② 프로트롬빈시간',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 혈병수축검사',
        '② 프로트롬빈시간',
        '③ 지혈대검사',
        '④ 출혈시간'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '혈액기능장애 아동의 간호',
      term: '4. 다음 중 혈우병에 대한 설명으로 옳은 것은?',
      englishTerm: null,
      definition: '혈우병 환자에게 아스피린/NSAIDs는 출혈 위험을 촉진하므로 금기이며 통증 조절에는 아세트아미노펜을 사용합니다.',
      answer: '③ 활막염으로 인한 통증 시 아세트아미노펜을 사용한다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 상염색체 열성 유전질환이다.',
        '② 응고인자 Ⅶ의 결핍에 의해 발생한다.',
        '③ 활막염으로 인한 통증 시 아세트아미노펜을 사용한다.',
        '④ 점상출혈이 자주 발생한다.'
      ],
    },
    {
      subject: '아동건강문제와가족간호2',
      category: '혈액기능장애 아동의 간호',
      term: '5. 특발성 저혈소판 자색반병에 대한 설명으로 옳은 것은?',
      englishTerm: null,
      definition: '아동 ITP는 발병 1~3주 전 바이러스성 상기도 감염 등의 병력이 선행되는 특징이 있습니다.',
      answer: '② 바이러스 감염이 선행된다.',
      itemType: 'MULTIPLE_CHOICE',
      options: [
        '① 대부분 만성질환으로 이행된다.',
        '② 바이러스 감염이 선행된다.',
        '③ 간비대와 비장비대가 동반된다.',
        '④ 항흉선세포 글로불린을 투여한다.'
      ],
    },
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
