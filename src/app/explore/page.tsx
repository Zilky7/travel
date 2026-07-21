"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { SpotMapData } from "@/components/map/photo-map-overlay";

const PhotoMapOverlay = dynamic(
  () => import("@/components/map/photo-map-overlay"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface ApiAttraction {
  id: number;
  name: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  coverImage: string | null;
  cityName: string;
  spotsCount: number;
}

interface CityInfo {
  name: string;
  latitude: string | null;
  longitude: string | null;
}

export default function ExplorePage() {
  const router = useRouter();
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [mapData, setMapData] = useState<SpotMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    { lat: 31.2304, lng: 121.4737 }
  );

  useEffect(() => {
    fetch("/api/cities?published=true")
      .then((r) => r.json())
      .then((data: CityInfo[]) => {
        setCities(data);
        if (data.length > 0 && !selectedCity) {
          const first = data[0];
          setSelectedCity(first.name);
          if (first.latitude && first.longitude) {
            setCenter({ lat: parseFloat(first.latitude), lng: parseFloat(first.longitude) });
          }
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    setLoading(true);
    fetch(`/api/attractions/feed?city=${selectedCity}`)
      .then((res) => res.json())
      .then((data) => {
        const mapped: SpotMapData[] = (data.attractions || [])
          .filter((a: ApiAttraction) => a.latitude && a.longitude)
          .map((a: ApiAttraction) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            lat: parseFloat(a.latitude!),
            lng: parseFloat(a.longitude!),
            coverImage: a.coverImage,
            attractionName: a.name,
            cityName: a.cityName,
          }));
        setMapData(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCity]);

  const handleClick = useCallback(
    (id: number) => {
      router.push(`/attraction/${id}`);
    },
    [router]
  );

  const handleCityChange = (city: CityInfo) => {
    setSelectedCity(city.name);
    if (city.latitude && city.longitude) {
      setCenter({ lat: parseFloat(city.latitude), lng: parseFloat(city.longitude) });
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto">
        {cities.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityChange(city)}
            className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              selectedCity === city.name
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          </div>
        ) : (
          <PhotoMapOverlay
            key={selectedCity}
            spots={mapData}
            center={center}
            zoom={12}
            onSpotClick={handleClick}
            height="100%"
          />
        )}
      </div>
    </div>
  );
}
