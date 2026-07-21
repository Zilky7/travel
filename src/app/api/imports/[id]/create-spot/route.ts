import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialImports, spots } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  const id = parseInt(params.id);
  const { attractionId } = await request.json();

  if (!attractionId) {
    return NextResponse.json(
      { error: "attractionId is required" },
      { status: 400 }
    );
  }

  const [item] = await db
    .select()
    .from(socialImports)
    .where(eq(socialImports.id, id));

  if (!item) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  if (item.status !== "approved") {
    return NextResponse.json(
      { error: "Import must be approved first" },
      { status: 400 }
    );
  }

  const parsed = (item.parsedData || {}) as Record<string, string>;

  const [spot] = await db
    .insert(spots)
    .values({
      attractionId,
      name: parsed.spotName || parsed.attractionName || "Imported Spot",
      description: parsed.description || null,
      bestTime: parsed.bestTime || null,
      compositionTips: parsed.compositionTips || null,
      outfitTips: parsed.outfitTips || null,
      photoTips: parsed.photoTips || null,
      difficulty: parsed.difficulty || "easy",
    })
    .returning();

  await db
    .update(socialImports)
    .set({ linkedSpotId: spot.id, status: "approved" })
    .where(eq(socialImports.id, id));

  return NextResponse.json(spot, { status: 201 });
}
