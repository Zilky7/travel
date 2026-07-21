import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spotId = searchParams.get("spotId");
  const attractionId = searchParams.get("attractionId");
  const cityId = searchParams.get("cityId");

  const conditions = [];
  if (spotId) conditions.push(eq(photos.spotId, parseInt(spotId)));
  if (attractionId)
    conditions.push(eq(photos.attractionId, parseInt(attractionId)));
  if (cityId) conditions.push(eq(photos.cityId, parseInt(cityId)));

  const result = await db
    .select()
    .from(photos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(photos.createdAt))
    .limit(100);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, thumbnailUrl, alt, width, height, spotId, attractionId, cityId, sortOrder } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const [photo] = await db
      .insert(photos)
      .values({
        url,
        thumbnailUrl: thumbnailUrl || null,
        alt: alt || null,
        width: width || null,
        height: height || null,
        spotId: spotId || null,
        attractionId: attractionId || null,
        cityId: cityId || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(photo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create photo" }, { status: 500 });
  }
}
