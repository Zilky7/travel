import { notFound } from "next/navigation";
import { db } from "@/db";
import { attractions, cities, spots, photos } from "@/db/schema";
import { eq } from "drizzle-orm";
import AttractionDetailClient from "./detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function AttractionDetailPage({ params }: Props) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  // Fetch attraction with city name
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
      spotsCount: attractions.spotsCount,
      cityName: cities.name,
    })
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .where(eq(attractions.id, id));

  if (!attractionRow) notFound();

  // Fetch spots
  const spotRows = await db
    .select()
    .from(spots)
    .where(eq(spots.attractionId, id))
    .orderBy(spots.sortOrder);

  // Fetch all photos for this attraction
  const allPhotos = await db
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

  // Group photos by spot, and collect attraction-level photos (no spot)
  const photosBySpot: Record<number, typeof allPhotos> = {};
  const attractionPhotos: typeof allPhotos = [];
  allPhotos.forEach((p) => {
    if (p.spotId) {
      if (!photosBySpot[p.spotId]) photosBySpot[p.spotId] = [];
      photosBySpot[p.spotId].push(p);
    } else {
      attractionPhotos.push(p);
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
    difficulty: s.difficulty,
    photos: photosBySpot[s.id] || [],
  }));

  const attractionData = {
    ...attractionRow,
    latitude: attractionRow.latitude
      ? parseFloat(attractionRow.latitude)
      : null,
    longitude: attractionRow.longitude
      ? parseFloat(attractionRow.longitude)
      : null,
  };

  return (
    <AttractionDetailClient
      attraction={attractionData}
      spots={spotsWithPhotos}
      attractionPhotos={attractionPhotos}
    />
  );
}
