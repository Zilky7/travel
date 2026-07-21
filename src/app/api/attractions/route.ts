import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attractions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const query = db.select().from(attractions);
  if (cityId) {
    const result = await query
      .where(eq(attractions.cityId, parseInt(cityId)))
      .orderBy(desc(attractions.sortOrder));
    return NextResponse.json(result);
  }
  const result = await query.orderBy(desc(attractions.sortOrder));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [attraction] = await db.insert(attractions).values(body).returning();
  return NextResponse.json(attraction, { status: 201 });
}
