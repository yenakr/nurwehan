const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding started...');

  // 1. Clean up existing data (Optional but recommended for a clean start)
  // await prisma.notice.deleteMany({});
  // await prisma.openLabSlot.deleteMany({});
  // await prisma.skill.deleteMany({});

  // 2. Create Super Admin
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

  // 3. Create Initial Skills
  const skills = [
    { name: '간헐적 위관영양', description: 'Nasogastric Tube Feeding' },
    { name: '단순도뇨', description: 'Simple Catheterization' },
    { name: '유치도뇨', description: 'Indwelling Catheterization' },
    { name: '정맥수액주입', description: 'Intravenous Fluid Infusion' },
    { name: '피내주사', description: 'Intradermal Injection' },
    { name: '피하주사', description: 'Subcutaneous Injection' },
    { name: '근육주사', description: 'Intramuscular Injection' },
    { name: '활력징후', description: 'Vital Signs' },
    { name: '산소요법', description: 'Oxygen Therapy' },
    { name: '흡인', description: 'Suction' },
    { name: '기관절개관 관리', description: 'Tracheostomy Care' },
    { name: '배출관장', description: 'Evacuation Enema' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }
  console.log('Skills seeded');

  // 4. Create Official Notice
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

  await prisma.notice.upsert({
    where: { id: 'official-guide' },
    update: {
      title: noticeTitle,
      content: noticeContent,
      isPinned: true,
    },
    create: {
      id: 'official-guide',
      title: noticeTitle,
      content: noticeContent,
      isPinned: true,
      createdById: superAdmin.id,
    },
  });
  console.log('Official notice seeded');

  // 5. Create Sample Semester & Slots (Fixed Room Names)
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

  const slotsData = [
    {
      date: new Date('2026-05-20'),
      startTime: '13:00',
      endTime: '15:00',
      room: '임상수기실습실 5층',
      maxCapacity: 20,
      allowedGrade: 2,
    },
    {
      date: new Date('2026-05-21'),
      startTime: '10:00',
      endTime: '12:00',
      room: '시뮬레이션실습실 6층',
      maxCapacity: 15,
      allowedGrade: 3,
    },
  ];

  for (const slot of slotsData) {
    await prisma.openLabSlot.create({
      data: {
        ...slot,
        semesterId: semester.id,
      }
    });
  }
  console.log('Sample slots seeded');

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
