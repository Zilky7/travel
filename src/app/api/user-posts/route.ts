import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userPosts, attractions, spots } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyPhotoLocation } from "@/lib/xiaomi-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      attractionId, spotId, description, photos,
      latitude, longitude, deviceLatitude, deviceLongitude,
    } = body;

    if (!attractionId || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: "attractionId and at least one photo are required" },
        { status: 400 }
      );
    }

    const [post] = await db
      .insert(userPosts)
      .values({
        attractionId,
        spotId: spotId || null,
        description: description || null,
        photos,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        deviceLatitude: deviceLatitude ? String(deviceLatitude) : null,
        deviceLongitude: deviceLongitude ? String(deviceLongitude) : null,
        aiVerified: "pending",
        status: "published",
      })
      .returning();

    triggerAiVerification(post.id, photos[0], attractionId, spotId).catch(
      () => {}
    );

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const limit = parseInt(
    request.nextUrl.searchParams.get("limit") || "20",
    10
  );

  const posts = await db
    .select()
    .from(userPosts)
    .where(eq(userPosts.status, "published"))
    .orderBy(desc(userPosts.createdAt))
    .limit(limit);

  return NextResponse.json(posts);
}

async function triggerAiVerification(
  postId: number,
  photoUrl: string,
  attractionId: number,
  spotId?: number
) {
  try {
    const [attr] = await db
      .select({ name: attractions.name })
      .from(attractions)
      .where(eq(attractions.id, attractionId));

    let spotName: string | undefined;
    if (spotId) {
      const [spot] = await db
        .select({ name: spots.name })
        .from(spots)
        .where(eq(spots.id, spotId));
      spotName = spot?.name;
    }

    if (!attr) return;

    const result = await verifyPhotoLocation(photoUrl, attr.name, spotName);

    await db
      .update(userPosts)
      .set({
        aiVerified: result.match,
        aiResult: result,
      })
      .where(eq(userPosts.id, postId));
  } catch {
    await db
      .update(userPosts)
      .set({ aiVerified: "error" })
      .where(eq(userPosts.id, postId));
  }
}
