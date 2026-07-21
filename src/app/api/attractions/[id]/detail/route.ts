import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attractions, cities, spots, photos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Fetch attraction with city
  const [attractionRow] = await db
    .select({
      id: attractions.id,
      name: attractions.name,
      description: attractions.description,
      coverImage: attractions.coverImage,
      address: attractions.address,
      latitude: attractions.latitude,
      longitude: attractions.longitude,
      openHours: attractions.openHours,
      ticketInfo: attractions.ticketInfo,
      tips: attractions.tips,
      hotScore: attractions.hotScore,
      spotsCount: attractions.spotsCount,
      cityName: cities.name,
    })
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(eq(attractions.id, id));

  if (!attractionRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch spots for this attraction
  const spotRows = await db
    .select()
    .from(spots)
    .where(eq(spots.attractionId, id))
    .orderBy(spots.sortOrder);

  // Fetch photos for each spot
  const spotIds = spotRows.map((s) => s.id);
  let allPhotos: {
    id: number;
    spotId: number | null;
    url: string;
    thumbnailUrl: string | null;
    alt: string | null;
  }[] = [];

  if (spotIds.length > 0) {
    allPhotos = await db
      .select({
        id: photos.id,
        spotId: photos.spotId,
        url: photos.url,
        thumbnailUrl: photos.thumbnailUrl,
        alt: photos.alt,
      })
      .from(photos)
      .where(eq(photos.attractionId, id))
      .orderBy(photos.sortOrder);
  }

  // Group photos by spotId
  const photosBySpot: Record<number, typeof allPhotos> = {};
  allPhotos.forEach((p) => {
    if (p.spotId) {
      if (!photosBySpot[p.spotId]) photosBySpot[p.spotId] = [];
      photosBySpot[p.spotId].push(p);
    }
  });

  const spotsWithPhotos = spotRows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    coverImage: s.coverImage,
    compositionTips: s.compositionTips,
    outfitTips: s.outfitTips,
    photoTips: s.photoTips,
    bestTime: s.bestTime,
    bestSeason: s.bestSeason,
    difficulty: s.difficulty,
    photos: photosBySpot[s.id] || [],
  }));

  return NextResponse.json({
    attraction: {
      ...attractionRow,
      latitude: attractionRow.latitude
        ? parseFloat(attractionRow.latitude)
        : null,
      longitude: attractionRow.longitude
        ? parseFloat(attractionRow.longitude)
        : null,
    },
    spots: spotsWithPhotos,
  });
}
