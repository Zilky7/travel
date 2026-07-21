import { db } from "@/db";
import { spots, attractions, photos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import SpotDetailClient from "./spot-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: { spotId: string };
}

export default async function SpotPage({ params }: Props) {
  const spotId = parseInt(params.spotId);
  if (isNaN(spotId)) notFound();

  const [spot] = await db.select().from(spots).where(eq(spots.id, spotId));
  if (!spot) notFound();

  const [attraction] = await db
    .select()
    .from(attractions)
    .where(eq(attractions.id, spot.attractionId));

  const spotPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.spotId, spotId))
    .orderBy(asc(photos.sortOrder));

  return (
    <SpotDetailClient
      spot={{
        id: spot.id,
        name: spot.name,
        description: spot.description,
        coverImage: spot.coverImage,
        compositionTips: spot.compositionTips,
        outfitTips: spot.outfitTips,
        photoTips: spot.photoTips,
        bestTime: spot.bestTime,
      }}
      attractionName={attraction?.name || ""}
      attractionId={attraction?.id || 0}
      photos={spotPhotos.map((p) => ({ id: p.id, url: p.url, alt: p.alt }))}
    />
  );
}
