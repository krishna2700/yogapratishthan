import { PrismaClient, Weekday } from "@prisma/client";

const prisma = new PrismaClient();

const BATCHES: { name: string; weekdays: Weekday[]; startTime: string; endTime: string }[] = [
  { name: "Batch A", weekdays: [Weekday.MONDAY, Weekday.THURSDAY], startTime: "07:30", endTime: "08:30" },
  { name: "Batch B", weekdays: [Weekday.MONDAY, Weekday.THURSDAY], startTime: "09:00", endTime: "10:00" },
  { name: "Batch C", weekdays: [Weekday.TUESDAY, Weekday.FRIDAY], startTime: "07:30", endTime: "08:30" },
  { name: "Batch D", weekdays: [Weekday.TUESDAY, Weekday.FRIDAY], startTime: "09:00", endTime: "10:00" },
];

async function main() {
  for (const batch of BATCHES) {
    await prisma.batch.upsert({
      where: { name: batch.name },
      update: { weekdays: batch.weekdays, startTime: batch.startTime, endTime: batch.endTime },
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
