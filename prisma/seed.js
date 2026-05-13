const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin1234!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { studentId: 'admin' },
    update: {},
    create: {
      studentId: 'admin',
      name: '시스템 관리자',
      email: 'admin@hanyang.ac.kr',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      approvalStatus: 'APPROVED',
    },
  });
  console.log('Super Admin created:', superAdmin.studentId);

  // 2. Create Initial Skills
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
      create: {
        name: skill.name,
        description: skill.description,
      },
    });
  }
  // 3. Create Sample Semester
  const semester = await prisma.semester.upsert({
    where: { id: 'sem-2026-1' },
    update: {},
    create: {
      id: 'sem-2026-1',
      name: '2026학년도 1학기',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-06-20'),
      isActive: true,
    },
  });

  // 4. Create Sample Slots
  const slots = [
    {
      semesterId: semester.id,
      allowedGrade: 2,
      date: new Date('2026-05-20'),
      startTime: '13:00',
      endTime: '15:00',
      room: '임상수기실습실 5층',
      maxCapacity: 20,
    },
    {
      semesterId: semester.id,
      allowedGrade: 3,
      date: new Date('2026-05-21'),
      startTime: '18:00',
      endTime: '20:00',
      room: '시뮬레이션실습실 6층',
      maxCapacity: 15,
    }
  ];

  for (const slot of slots) {
    await prisma.openLabSlot.create({ data: slot });
  }
  console.log('Sample slots seeded');
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
