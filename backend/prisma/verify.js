const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const part = await prisma.part.findUnique({
    where: { partId: 'HP47291' },
    include: { currentOwner: true }
  });

  if (part) {
    console.log('Part Found:');
    console.log(`- ID: ${part.partId}`);
    console.log(`- Owner: ${part.currentOwner.name} (${part.currentOwner.role})`);
  } else {
    console.log('Part HP47291 not found.');
  }
}

verify().finally(() => prisma.$disconnect());
