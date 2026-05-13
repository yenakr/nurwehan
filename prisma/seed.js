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
  console.log('Initial skills seeded');
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
