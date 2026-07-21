import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialImports } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const [item] = await db
    .select()
    .from(socialImports)
    .where(eq(socialImports.id, id));

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const body = await request.json();

  const [updated] = await db
    .update(socialImports)
    .set({
      status: body.status,
      linkedSpotId: body.linkedSpotId || null,
      parsedData: body.parsedData || undefined,
    })
    .where(eq(socialImports.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
