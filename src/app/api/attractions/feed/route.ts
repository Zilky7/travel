import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attractions, cities, photos } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  const sort = request.nextUrl.searchParams.get("sort") || "hot";

  const conditions = [
    eq(attractions.isPublished, true),
    eq(cities.isPublished, true),
  ];

  if (city) {
    conditions.push(eq(cities.name, city));
  }

  const orderBy = sort === "new" ? desc(attractions.createdAt) : desc(attractions.hotScore);

  const result = await db
    .select({
      id: attractions.id,
      name: attractions.name,
      coverImage: attractions.coverImage,
      spotsCount: attractions.spotsCount,
      hotScore: attractions.hotScore,
      cityName: cities.name,
      description: attractions.description,
      latitude: attractions.latitude,
      longitude: attractions.longitude,
    })
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(50);

  const attractionIds = result.map((a) => a.id);
  const photoMap: Record<number, string[]> = {};

  if (attractionIds.length > 0) {
    const allPhotos = await db
      .select({ attractionId: photos.attractionId, url: photos.url })
      .from(photos)
      .where(inArray(photos.attractionId, attractionIds))
      .orderBy(photos.sortOrder)
      .limit(500);

    for (const p of allPhotos) {
      if (!p.attractionId) continue;
      if (!photoMap[p.attractionId]) photoMap[p.attractionId] = [];
      if (photoMap[p.attractionId].length < 6) {
        photoMap[p.attractionId].push(p.url);
      }
    }
  }

  const mapped = result.map((a) => ({
    ...a,
    photos: photoMap[a.id] || [],
  }));

  return NextResponse.json({ attractions: mapped });
}
