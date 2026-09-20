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
