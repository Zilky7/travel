"use client";

import { useRef } from "react";

interface SpotPhoto {
  id: number;
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
}

interface SpotCardProps {
  name: string;
  description?: string | null;
  photos: SpotPhoto[];
  compositionTips?: string | null;
  outfitTips?: string | null;
  photoTips?: string | null;
  bestTime?: string | null;
  difficulty?: string;
}

function TipSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3">
      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
        {label}
      </span>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

export default function SpotCard({
  name,
  description,
  photos,
  compositionTips,
  outfitTips,
  photoTips,
  bestTime,
  difficulty,
}: SpotCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Photo gallery - horizontal scroll */}
      {photos.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex-shrink-0 snap-start w-64 h-48"
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.alt || name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900">{name}</h3>
          {bestTime && (
            <span className="text-xs text-gray-400">{bestTime}</span>
          )}
          {difficulty && difficulty !== "easy" && (
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {difficulty}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        )}

        {compositionTips && (
          <TipSection label="构图建议" text={compositionTips} />
        )}
        {outfitTips && <TipSection label="穿搭推荐" text={outfitTips} />}
        {photoTips && <TipSection label="拍摄技巧" text={photoTips} />}
      </div>
    </div>
  );
}
