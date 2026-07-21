import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const publishedOnly =
    request.nextUrl.searchParams.get("published") === "true";

  const query = db.select().from(cities);

  const result = publishedOnly
    ? await query
        .where(eq(cities.isPublished, true))
        .orderBy(desc(cities.sortOrder))
    : await query.orderBy(desc(cities.sortOrder));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [city] = await db.insert(cities).values(body).returning();
  return NextResponse.json(city, { status: 201 });
}
