import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BATCHES = [
  { name: "Batch A", days: "Monday & Thursday", startTime: "07:30", endTime: "08:30" },
  { name: "Batch B", days: "Monday & Thursday", startTime: "09:00", endTime: "10:00" },
  { name: "Batch C", days: "Tuesday & Friday", startTime: "07:30", endTime: "08:30" },
  { name: "Batch D", days: "Tuesday & Friday", startTime: "09:00", endTime: "10:00" },
] as const;

async function main() {
  for (const batch of BATCHES) {
    await prisma.batch.upsert({
      where: { name: batch.name },
      update: { days: batch.days, startTime: batch.startTime, endTime: batch.endTime },
      create: batch,
    });
  }
  console.log(`Seeded ${BATCHES.length} batches.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
