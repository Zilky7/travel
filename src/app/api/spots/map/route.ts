import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { spots, attractions, cities } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");

  const conditions = [
    eq(spots.isPublished, true),
    eq(cities.isPublished, true),
    isNotNull(spots.latitude),
    isNotNull(spots.longitude),
  ];

  if (cityId) {
    conditions.push(eq(attractions.cityId, parseInt(cityId)));
  }

  const result = await db
    .select({
      id: spots.id,
      name: spots.name,
      description: spots.description,
      latitude: spots.latitude,
      longitude: spots.longitude,
      coverImage: spots.coverImage,
      attractionName: attractions.name,
      cityName: cities.name,
    })
    .from(spots)
    .innerJoin(attractions, eq(spots.attractionId, attractions.id))
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(and(...conditions))
    .limit(200);

  const mapped = result.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ? row.description.slice(0, 120) : null,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    coverImage: row.coverImage,
    attractionName: row.attractionName,
    cityName: row.cityName,
  }));

  return NextResponse.json({ spots: mapped });
}
