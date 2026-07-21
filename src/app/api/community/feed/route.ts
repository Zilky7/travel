import { NextResponse } from "next/server";
import { db } from "@/db";
import { spots, attractions, cities, photos } from "@/db/schema";
import { eq, desc, isNotNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await db
    .select({
      id: spots.id,
      name: spots.name,
      description: spots.description,
      coverImage: spots.coverImage,
      attractionId: spots.attractionId,
      attractionName: attractions.name,
      cityName: cities.name,
    })
    .from(spots)
    .innerJoin(attractions, eq(spots.attractionId, attractions.id))
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(isNotNull(spots.coverImage))
    .orderBy(desc(spots.createdAt))
    .limit(100);

  const spotIds = result.map((r) => r.id);
  const photoCounts: Record<number, number> = {};
  if (spotIds.length > 0) {
    const counts = await db
      .select({
        spotId: photos.spotId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(photos)
      .where(isNotNull(photos.spotId))
      .groupBy(photos.spotId);

    for (const c of counts) {
      if (c.spotId) photoCounts[c.spotId] = Number(c.count);
    }
  }

  const posts = result.map((r) => ({
    ...r,
    photoCount: photoCounts[r.id] || 0,
  }));

  return NextResponse.json({ posts });
}
