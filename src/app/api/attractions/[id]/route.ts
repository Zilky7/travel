import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attractions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const [attraction] = await db
    .select()
    .from(attractions)
    .where(eq(attractions.id, id));
  if (!attraction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(attraction);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const body = await request.json();
  const [updated] = await db
    .update(attractions)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(attractions.id, id))
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
  await db.delete(attractions).where(eq(attractions.id, id));
  return NextResponse.json({ success: true });
}
