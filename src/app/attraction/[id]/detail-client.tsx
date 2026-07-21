"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SpotPhoto {
  id: number;
  url: string;
  alt: string | null;
}

interface SpotData {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  compositionTips: string | null;
  outfitTips: string | null;
  photoTips: string | null;
  bestTime: string | null;
  difficulty: string;
  photos: SpotPhoto[];
}

interface AttractionData {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  openHours: string | null;
  ticketInfo: string | null;
  tips: string | null;
  spotsCount: number;
  cityName: string;
}

interface AttractionPhoto {
  id: number;
  url: string;
  alt: string | null;
}

interface Props {
  attraction: AttractionData;
  spots: SpotData[];
  attractionPhotos: AttractionPhoto[];
}

export default function AttractionDetailClient({
  attraction,
  spots,
  attractionPhotos,
}: Props) {
  const router = useRouter();
  const allPhotos = spots.flatMap((s) => s.photos);
  const heroPhotos = allPhotos.slice(0, 8);
  const [heroIdx, setHeroIdx] = useState(0);

  const heroSrc = heroPhotos[heroIdx]?.url || attraction.coverImage || "/placeholder-spot.jpg";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero image area */}
      <div className="relative bg-black max-w-5xl mx-auto" style={{ height: "45vh", minHeight: "300px" }}>
        <img
          src={heroSrc}
          alt={attraction.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-spot.jpg"; }}
        />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {heroPhotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {heroIdx + 1}/{heroPhotos.length}
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5 overflow-x-auto max-w-[70%]">
          {heroPhotos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setHeroIdx(i)}
              className={`flex-shrink-0 w-10 h-10 rounded overflow-hidden border-2 ${
                i === heroIdx ? "border-white" : "border-transparent opacity-70"
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-t-2xl -mt-4 relative z-10 px-4 pt-5 pb-4 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900">{attraction.name}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>{attraction.cityName}</span>
          {attraction.openHours && (
            <>
              <span>-</span>
              <span className="text-green-600">{attraction.openHours}</span>
            </>
          )}
        </div>
        {attraction.address && (
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{attraction.address}</span>
          </div>
        )}
        {attraction.description && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">{attraction.description}</p>
        )}
      </div>

      {/* Spots grid */}
      <div className="bg-white mt-2 px-4 py-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-gray-900">
            机位 {spots.length}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {spots.map((spot) => (
            <SpotGridItem key={spot.id} spot={spot} attractionName={attraction.name} />
          ))}
        </div>
      </div>

      {/* Attraction-level photos (no specific spot) */}
      {attractionPhotos.length > 0 && (
        <div className="bg-white mt-2 px-4 py-4 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-bold text-gray-900">
              更多样片 {attractionPhotos.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {attractionPhotos.map((photo) => (
              <div key={photo.id} className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt={photo.alt || attraction.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-spot.jpg";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpotGridItem({ spot, attractionName }: { spot: SpotData; attractionName: string }) {
  const coverSrc = spot.coverImage || spot.photos[0]?.url || "/placeholder-spot.jpg";
  const displayName = spot.name.replace(attractionName, "").replace(/^[-_\s]+/, "") || spot.name;
  const shortName = displayName.length > 8 ? displayName.slice(0, 8) + "..." : displayName;

  return (
    <Link href={`/spot/${spot.id}`} className="block">
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
        <img
          src={coverSrc}
          alt={spot.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-spot.jpg"; }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-700 truncate">{shortName}</p>
    </Link>
  );
}
