import { NextResponse } from "next/server";
import { getDashboardData } from "@/features/dashboard/services/dashboard-service";

export async function GET() {
  const data = await getDashboardData();
  return NextResponse.json(data);
}
