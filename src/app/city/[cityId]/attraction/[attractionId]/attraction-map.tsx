"use client";

import { BaiduMapDynamic, type MapMarker } from "@/components/map";

interface SpotMapData {
  id: number;
  name: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface AttractionMapProps {
  attractionLat: number;
  attractionLng: number;
  spots: SpotMapData[];
}

export default function AttractionMap({
  attractionLat,
  attractionLng,
  spots,
}: AttractionMapProps) {
  const markers: MapMarker[] = spots
    .filter((s) => s.latitude && s.longitude)
    .map((s) => ({
      lat: parseFloat(s.latitude!),
      lng: parseFloat(s.longitude!),
      title: s.name,
      description: s.description || undefined,
      href: `/spot/${s.id}`,
    }));

  if (markers.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Spot Locations
      </h2>
      <BaiduMapDynamic
        center={{ lat: attractionLat, lng: attractionLng }}
        zoom={16}
        markers={markers}
        height="350px"
      />
    </div>
  );
}
