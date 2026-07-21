import { db } from "@/db";
import { cities, attractions, spots } from "@/db/schema";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://zilky7777.cn";

  const allCities = await db.select({ id: cities.id }).from(cities);
  const allAttractions = await db
    .select({ id: attractions.id, cityId: attractions.cityId })
    .from(attractions);
  const allSpots = await db.select({ id: spots.id }).from(spots);

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), priority: 0.7 },
  ];

  const cityPages = allCities.map((city) => ({
    url: `${baseUrl}/city/${city.id}`,
    lastModified: new Date(),
    priority: 0.9,
  }));

  const attractionPages = allAttractions.map((a) => ({
    url: `${baseUrl}/city/${a.cityId}/attraction/${a.id}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  const spotPages = allSpots.map((s) => ({
    url: `${baseUrl}/spot/${s.id}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  return [...staticPages, ...cityPages, ...attractionPages, ...spotPages];
}
