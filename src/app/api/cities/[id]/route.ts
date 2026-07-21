import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const [city] = await db.select().from(cities).where(eq(cities.id, id));
  if (!city) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(city);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const body = await request.json();
  const [updated] = await db
    .update(cities)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(cities.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  await db.delete(cities).where(eq(cities.id, id));
  return NextResponse.json({ success: true });
}
