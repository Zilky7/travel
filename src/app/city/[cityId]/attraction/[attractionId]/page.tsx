import { db } from "@/db";
import { cities, attractions, spots } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import AttractionMap from "./attraction-map";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: { cityId: string; attractionId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const attractionId = parseInt(params.attractionId);
  const [attraction] = await db
    .select()
    .from(attractions)
    .where(eq(attractions.id, attractionId));
  if (!attraction) return { title: "未找到" };
  return {
    title: `${attraction.name} - 拍照机位 | TravelShots`,
    description: attraction.description || `${attraction.name}的最佳拍照点位和摄影建议`,
    openGraph: {
      title: `${attraction.name} - 出片机位`,
      description: attraction.description || `${attraction.name}拍照攻略`,
      type: "article",
      images: attraction.coverImage ? [{ url: attraction.coverImage }] : [],
    },
  };
}

const difficultyLabel: Record<string, string> = { easy: "简单", medium: "中等", hard: "困难" };

export default async function AttractionPage({ params }: Props) {
  const cityId = parseInt(params.cityId);
  const attractionId = parseInt(params.attractionId);

  const [city] = await db.select().from(cities).where(eq(cities.id, cityId));
  if (!city) notFound();

  const [attraction] = await db
    .select()
    .from(attractions)
    .where(eq(attractions.id, attractionId));
  if (!attraction) notFound();

  const attractionSpots = await db
    .select()
    .from(spots)
    .where(eq(spots.attractionId, attractionId))
    .orderBy(asc(spots.sortOrder));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/city/${cityId}`} className="hover:text-gray-600">
          {city.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{attraction.name}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {attraction.name}
        </h1>
        {attraction.address && (
          <p className="text-sm text-gray-400 mb-2">{attraction.address}</p>
        )}
        {attraction.description && (
          <p className="text-gray-600 max-w-3xl mb-4">
            {attraction.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {attraction.openHours && <span>开放时间: {attraction.openHours}</span>}
          {attraction.ticketInfo && (
            <span>门票: {attraction.ticketInfo}</span>
          )}
        </div>
        {attraction.tips && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            小贴士: {attraction.tips}
          </div>
        )}
      </div>

      {attraction.latitude && attraction.longitude && (
        <AttractionMap
          attractionLat={parseFloat(attraction.latitude)}
          attractionLng={parseFloat(attraction.longitude)}
          spots={attractionSpots}
        />
      )}

      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        拍照点位 ({attractionSpots.length})
      </h2>

      <div className="space-y-6">
        {attractionSpots.map((spot) => (
          <Link key={spot.id} href={`/spot/${spot.id}`}>
            <div className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {spot.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    spot.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : spot.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {difficultyLabel[spot.difficulty || ""] || spot.difficulty}
                </span>
              </div>
              {spot.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {spot.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {spot.bestTime && (
                  <div>
                    <span className="text-gray-400">最佳时间:</span>
                    <p className="text-gray-700">{spot.bestTime}</p>
                  </div>
                )}
                {spot.outfitTips && (
                  <div>
                    <span className="text-gray-400">穿搭:</span>
                    <p className="text-gray-700 line-clamp-2">
                      {spot.outfitTips}
                    </p>
                  </div>
                )}
                {spot.compositionTips && (
                  <div>
                    <span className="text-gray-400">构图:</span>
                    <p className="text-gray-700 line-clamp-2">
                      {spot.compositionTips}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
