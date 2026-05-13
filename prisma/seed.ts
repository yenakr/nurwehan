import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

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
  const skillsData = [
    { 
      name: '간헐적 위관영양', 
      description: 'Nasogastric Tube Feeding',
      supplies: [
        { supplyName: '처방된 위관영양액 (200-500mL)', quantity: 1, unit: '개' },
        { supplyName: '50mL 세정용 주사기', quantity: 1, unit: '개' },
        { supplyName: '영양액 주입백', quantity: 1, unit: '개' },
        { supplyName: '위관영양백 걸대', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 2, unit: '개' },
        { supplyName: '일회용 장갑', quantity: 1, unit: '켤레' },
      ]
    },
    { 
      name: '단순도뇨', 
      description: 'Simple Catheterization',
      supplies: [
        { supplyName: '단순도뇨 세트 (멸균)', quantity: 1, unit: '개' },
        { supplyName: '도뇨관 (넬라톤)', quantity: 1, unit: '개' },
        { supplyName: '멸균 윤활제', quantity: 1, unit: '개' },
        { supplyName: '곡반', quantity: 1, unit: '개' },
        { supplyName: '소독솜', quantity: 5, unit: '개' },
      ]
    },
    { 
      name: '유치도뇨', 
      description: 'Indwelling Catheterization',
      supplies: [
        { supplyName: '유치도뇨 세트 (멸균)', quantity: 1, unit: '개' },
        { supplyName: '유치도뇨관 (폴리)', quantity: 1, unit: '개' },
        { supplyName: '멸균 증류수 (10mL 주사기 포함)', quantity: 1, unit: '개' },
        { supplyName: '소변 수집백', quantity: 1, unit: '개' },
      ]
    },
    { 
      name: '정맥수액주입', 
      description: 'Intravenous Fluid Infusion',
      supplies: [
        { supplyName: '수액백', quantity: 1, unit: '개' },
        { supplyName: '수액세트', quantity: 1, unit: '개' },
        { supplyName: '정맥카테터 (22G/24G)', quantity: 1, unit: '개' },
        { supplyName: '토니켓', quantity: 1, unit: '개' },
        { supplyName: '알코올 솜', quantity: 3, unit: '개' },
        { supplyName: '테가덤 (드레싱)', quantity: 1, unit: '개' },
        { supplyName: '수액 걸대', quantity: 1, unit: '개' },
      ]
    },
    { name: '피내주사', description: 'Intradermal Injection' },
    { name: '피하주사', description: 'Subcutaneous Injection' },
    { name: '근육주사', description: 'Intramuscular Injection' },
    { name: '활력징후', description: 'Vital Signs' },
    { name: '산소요법', description: 'Oxygen Therapy' },
    { name: '흡인', description: 'Suction' },
    { name: '기관절개관 관리', description: 'Tracheostomy Care' },
    { name: '배출관장', description: 'Evacuation Enema' },
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
  const noticeTitle = 'OPEN LAB 이용 안내';
  const noticeContent = `
### 3. 신청 방법
- Open lab 진행할 인원을 모아 조를 구성하고, 한 명이 대표로 신청서를 제출합니다.
- 한 타임에 최대 2가지 술기까지 신청 가능합니다.
- 학생 1명당 **주 1회** 오픈랩 신청이 가능합니다. 예: 동일 학생이 월요일, 수요일 2개 타임 모두 신청은 불가합니다.
- 희망하는 모든 학생들이 Open lab에 참여할 수 있도록 조끼리 소통하여 신청이 겹치지 않도록 소통해주십시오.
- 예외: 2학년은 주 1회 금요일 수업을 고려해 금주 금요일부터 차주 금요일 오픈랩 중 1회만 신청 가능합니다.
- 신청은 최대 신청 가능 인원 내에서 신청서 제출 및 접수 완료되는 순서대로 선착순 마감됩니다.
- 신청 후 참여하지 않거나 Open lab 시작 30분 이후에 참여하는 경우에는 2주 동안 Open lab 신청 및 참여가 불가합니다.

### 4. 신청기간
- 신청서는 Open lab 날짜 일주일 전부터 공휴일 제외 이틀 전까지 행정실 근무시간 오후 5시 30분 내에 제출합니다.
- 기간 내에 신청서를 제출하지 않은 경우 오픈랩 이용이 불가합니다.
- 예외: 월요일 Open lab 신청은 전 주 금요일 오전까지 제출 가능합니다.

### 5. 신청 시 유의사항
- 신청서 제출 후 반드시 승인 여부를 확인하십시오.
- 신청이 불가능한 경우 반려 사유가 표시됩니다.
- 기자재 신청 수량은 실습실 물품 재고를 고려하여 신청 수량보다 적게 준비될 수 있습니다.

### 6. Open lab 이용
- Open lab 종료 전 Open lab 사용일지를 학생별로 작성하여 제출합니다.
- 사용일지 미작성 시 참여하지 않은 것으로 간주하여 2주간 Open lab 신청 및 참여가 불가합니다.

### 7. Open lab 시 유의사항
- 마지막 10분은 정리를 실시합니다.
- 정리 상태 불량 3회 적발 시 해당 조원 모두 Open lab 이용이 불가합니다.
- 사용한 물품을 처음과 동일한 상태로 정리하고, 일반의료 폐기물과 손상성 폐기물을 반드시 구별하여 버립니다.
- 일반의료 폐기물/일반 쓰레기: 제품 포장지, 알콜솜을 포함한 거의 모든 물품
- 손상성 폐기물: 바늘류 및 앰플, 바이알 등 유리류
- 손상성 폐기물 박스에 알콜솜, 주사기 몸통 등은 폐기하지 않습니다.
- 뚜껑이 있는 생수 또는 밀폐되는 텀블러를 제외한 음료는 실습실 내 반입 및 섭취를 금지합니다.
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
  const semester = await prisma.semester.upsert({
    where: { id: 'sem-2026-1' },
    update: { isActive: true },
    create: {
      id: 'sem-2026-1',
      name: '2026학년도 1학기',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-06-20'),
      isActive: true,
    },
  });

  const gradeRules = [
    // 2nd Year
    { grade: 2, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 4, startTime: '09:00', endTime: '10:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 2, dayOfWeek: 4, startTime: '10:00', endTime: '11:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    // 3rd Year
    { grade: 3, dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 2, startTime: '10:00', endTime: '11:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 3, startTime: '09:00', endTime: '10:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 3, dayOfWeek: 3, startTime: '10:00', endTime: '11:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    // 4th Year
    { grade: 4, dayOfWeek: 1, startTime: '11:00', endTime: '12:00', room: '임상수기실습실 5층', maxCapacity: 16 },
    { grade: 4, dayOfWeek: 2, startTime: '11:00', endTime: '12:00', room: '시뮬레이션실습실 6층', maxCapacity: 16 },
    { grade: 4, dayOfWeek: 4, startTime: '11:00', endTime: '12:00', room: '임상수기실습실 5층', maxCapacity: 16 },
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

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
