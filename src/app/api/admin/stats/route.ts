import { NextResponse } from "next/server";
import { db } from "@/db";
import { cities, attractions, spots, users } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [citiesCount] = await db.select({ value: count() }).from(cities);
  const [attractionsCount] = await db
    .select({ value: count() })
    .from(attractions);
  const [spotsCount] = await db.select({ value: count() }).from(spots);
  const [usersCount] = await db.select({ value: count() }).from(users);

  return NextResponse.json({
    cities: citiesCount.value,
    attractions: attractionsCount.value,
    spots: spotsCount.value,
    users: usersCount.value,
  });
}
