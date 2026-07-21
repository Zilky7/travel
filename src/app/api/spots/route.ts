import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { spots } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const attractionId = request.nextUrl.searchParams.get("attractionId");
  const query = db.select().from(spots);
  if (attractionId) {
    const result = await query
      .where(eq(spots.attractionId, parseInt(attractionId)))
      .orderBy(desc(spots.sortOrder));
    return NextResponse.json(result);
  }
  const result = await query.orderBy(desc(spots.sortOrder));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [spot] = await db.insert(spots).values(body).returning();
  return NextResponse.json(spot, { status: 201 });
}
