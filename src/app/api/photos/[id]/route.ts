import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const [photo] = await db.select().from(photos).where(eq(photos.id, id));

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(photo);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const body = await request.json();

  const [updated] = await db
    .update(photos)
    .set({
      alt: body.alt,
      spotId: body.spotId || null,
      attractionId: body.attractionId || null,
      cityId: body.cityId || null,
      sortOrder: body.sortOrder,
    })
    .where(eq(photos.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const [deleted] = await db
    .delete(photos)
    .where(eq(photos.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
