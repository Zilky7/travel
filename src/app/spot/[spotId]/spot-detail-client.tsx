"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PhotoItem {
  id: number;
  url: string;
  alt: string | null;
}

interface SpotInfo {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  compositionTips: string | null;
  outfitTips: string | null;
  photoTips: string | null;
  bestTime: string | null;
}

interface Props {
  spot: SpotInfo;
  attractionName: string;
  attractionId: number;
  photos: PhotoItem[];
}

export default function SpotDetailClient({ spot, attractionName, attractionId, photos }: Props) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const displayPhotos = photos.length > 0 ? photos : [{ id: 0, url: spot.coverImage || "/placeholder-spot.jpg", alt: spot.name }];

  const tips = [
    spot.compositionTips,
    spot.outfitTips,
    spot.photoTips,
  ].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero photo */}
      <div className="relative bg-black max-w-5xl mx-auto" style={{ height: "50vh", minHeight: "320px" }}>
        <img
          src={displayPhotos[activePhoto]?.url || "/placeholder-spot.jpg"}
          alt={spot.name}
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
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {activePhoto + 1}/{displayPhotos.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {displayPhotos.length > 1 && (
        <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto max-w-5xl mx-auto">
          {displayPhotos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActivePhoto(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                i === activePhoto ? "border-indigo-500" : "border-transparent"
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Info section */}
      <div className="bg-white mt-1 px-4 py-4 max-w-5xl mx-auto">
        <h1 className="text-lg font-bold text-gray-900">
          {attractionName}-{spot.name.replace(attractionName, "").replace(/^[-_\s]+/, "") || spot.name}
        </h1>

        {/* Tips */}
        {tips && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-blue-700 whitespace-nowrap">出片建议</span>
              <p className="text-sm text-gray-700 line-clamp-3">{tips}</p>
            </div>
          </div>
        )}

        {spot.bestTime && (
          <div className="mt-3 text-sm text-gray-500">
            最佳时间: {spot.bestTime}
          </div>
        )}

        {spot.description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-4">{spot.description}</p>
        )}
      </div>

      {/* Back to attraction link */}
      {attractionId > 0 && (
        <div className="bg-white mt-2 px-4 py-3 max-w-5xl mx-auto">
          <Link
            href={`/attraction/${attractionId}`}
            className="text-sm text-indigo-600 font-medium"
          >
            查看 {attractionName} 全部机位 &gt;
          </Link>
        </div>
      )}
    </div>
  );
}
