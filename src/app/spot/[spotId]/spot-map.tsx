"use client";

import { BaiduMapDynamic } from "@/components/map";

interface SpotMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function SpotMap({ lat, lng, name }: SpotMapProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
      <BaiduMapDynamic
        center={{ lat, lng }}
        zoom={17}
        markers={[{ lat, lng, title: name }]}
        height="300px"
      />
    </div>
  );
}
