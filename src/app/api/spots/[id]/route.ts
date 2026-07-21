import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { spots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(spot);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const body = await request.json();
  const [updated] = await db
    .update(spots)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(spots.id, id))
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
  await db.delete(spots).where(eq(spots.id, id));
  return NextResponse.json({ success: true });
}
