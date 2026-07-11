import "server-only";
import { prisma } from "@yogapratishthan/db";

export async function listBatches() {
  return prisma.batch.findMany({
    orderBy: { name: "asc" },
  });
}
