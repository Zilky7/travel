import { db } from "@/db";
import { cities, attractions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: { cityId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityId = parseInt(params.cityId);
  const [city] = await db.select().from(cities).where(eq(cities.id, cityId));
  if (!city) return { title: "未找到" };
  return {
    title: `${city.name}摄影点位 | TravelShots`,
    description: city.description || `发现${city.name}最佳拍照机位和摄影攻略`,
    openGraph: {
      title: `${city.name} - 出片机位指南`,
      description: city.description || `${city.name}热门拍照点位推荐`,
      type: "article",
      images: city.coverImage ? [{ url: city.coverImage }] : [],
    },
  };
}

export default async function CityPage({ params }: Props) {
  const cityId = parseInt(params.cityId);
  const [city] = await db.select().from(cities).where(eq(cities.id, cityId));
  if (!city) notFound();

  const cityAttractions = await db
    .select()
    .from(attractions)
    .where(eq(attractions.cityId, cityId))
    .orderBy(asc(attractions.sortOrder));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600">
          首页
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{city.name}</span>
      </nav>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold text-gray-900">{city.name}</h1>
          {city.nameEn && (
            <span className="text-lg text-gray-400">{city.nameEn}</span>
          )}
        </div>
        {city.province && (
          <p className="text-sm text-gray-400 mb-3">{city.province}</p>
        )}
        {city.description && (
          <p className="text-gray-600 max-w-3xl">{city.description}</p>
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        景点 ({cityAttractions.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cityAttractions.map((attraction) => (
          <Link
            key={attraction.id}
            href={`/city/${cityId}/attraction/${attraction.id}`}
          >
            <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <span className="text-4xl font-bold text-green-300/60">
                  {attraction.name.charAt(0)}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {attraction.name}
                </h3>
                {attraction.address && (
                  <p className="text-sm text-gray-400 mb-2">
                    {attraction.address}
                  </p>
                )}
                {attraction.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {attraction.description}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  {attraction.ticketInfo && (
                    <span>{attraction.ticketInfo}</span>
                  )}
                  {attraction.openHours && (
                    <span>{attraction.openHours}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
