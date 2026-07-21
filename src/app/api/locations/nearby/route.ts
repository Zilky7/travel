import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attractions, spots, cities } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "");
  const lng = parseFloat(request.nextUrl.searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const distanceExpr = sql<number>`(
    6371 * acos(
      cos(radians(${lat})) * cos(radians(CAST(${attractions.latitude} AS float8)))
      * cos(radians(CAST(${attractions.longitude} AS float8)) - radians(${lng}))
      + sin(radians(${lat})) * sin(radians(CAST(${attractions.latitude} AS float8)))
    )
  )`;

  const nearbyAttractions = await db
    .select({
      id: attractions.id,
      name: attractions.name,
      cityName: cities.name,
      latitude: attractions.latitude,
      longitude: attractions.longitude,
      distance: distanceExpr,
    })
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(
      and(
        eq(attractions.isPublished, true),
        sql`${distanceExpr} < 5`
      )
    )
    .orderBy(distanceExpr)
    .limit(5);

  if (nearbyAttractions.length === 0) {
    return NextResponse.json({ attraction: null, spots: [] });
  }

  const best = nearbyAttractions[0];

  const nearbySpots = await db
    .select({
      id: spots.id,
      name: spots.name,
    })
    .from(spots)
    .where(
      and(
        eq(spots.attractionId, best.id),
        eq(spots.isPublished, true)
      )
    )
    .orderBy(spots.sortOrder);

  return NextResponse.json({
    attraction: {
      id: best.id,
      name: best.name,
      cityName: best.cityName,
      distance: Math.round((best.distance as number) * 1000),
    },
    spots: nearbySpots,
    allNearby: nearbyAttractions.map((a) => ({
      id: a.id,
      name: a.name,
      cityName: a.cityName,
      distance: Math.round((a.distance as number) * 1000),
    })),
  });
}
