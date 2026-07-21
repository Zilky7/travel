"use client";

import { useEffect, useState } from "react";

interface LocationInfo {
  attractionId: number;
  attractionName: string;
  cityName: string;
  spotId?: number;
  spotName?: string;
}

interface NearbyResult {
  attraction: {
    id: number;
    name: string;
    cityName: string;
    distance: number;
  } | null;
  spots: { id: number; name: string }[];
  allNearby: { id: number; name: string; cityName: string; distance: number }[];
}

interface Props {
  gps: { lat: number; lng: number } | null;
  location: LocationInfo | null;
  onLocationChange: (loc: LocationInfo | null) => void;
}

interface City {
  id: number;
  name: string;
}

interface Attraction {
  id: number;
  name: string;
}

interface Spot {
  id: number;
  name: string;
}

export function LocationPicker({ gps, location, onLocationChange }: Props) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<NearbyResult | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | undefined>();

  // Manual mode state
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [manualAttractions, setManualAttractions] = useState<Attraction[]>([]);
  const [selectedAttrId, setSelectedAttrId] = useState<number | null>(null);
  const [manualSpots, setManualSpots] = useState<Spot[]>([]);
  const [selectedManualSpotId, setSelectedManualSpotId] = useState<
    number | null
  >(null);

  // Auto-match when GPS available
  useEffect(() => {
    if (!gps || mode !== "auto") return;
    setAutoLoading(true);
    fetch(`/api/locations/nearby?lat=${gps.lat}&lng=${gps.lng}`)
      .then((r) => r.json())
      .then((data: NearbyResult) => {
        setAutoResult(data);
        if (data.attraction) {
          onLocationChange({
            attractionId: data.attraction.id,
            attractionName: data.attraction.name,
            cityName: data.attraction.cityName,
          });
        }
      })
      .finally(() => setAutoLoading(false));
  }, [gps, mode]);

  // Load cities for manual mode
  useEffect(() => {
    if (mode !== "manual" || cities.length > 0) return;
    fetch("/api/cities?published=true")
      .then((r) => r.json())
      .then(setCities);
  }, [mode, cities.length]);

  // Load attractions when city selected
  useEffect(() => {
    if (!selectedCity) {
      setManualAttractions([]);
      return;
    }
    fetch(`/api/attractions/feed?city=${encodeURIComponent(selectedCity)}`)
      .then((r) => r.json())
      .then((d) => setManualAttractions(d.attractions || []));
  }, [selectedCity]);

  // Load spots when attraction selected
  useEffect(() => {
    if (!selectedAttrId) {
      setManualSpots([]);
      return;
    }
    fetch(`/api/attractions/${selectedAttrId}/detail`)
      .then((r) => r.json())
      .then((d) => setManualSpots(d.spots || []));
  }, [selectedAttrId]);

  function handleSpotSelect(spotId: number | undefined) {
    setSelectedSpotId(spotId);
    if (autoResult?.attraction) {
      const spot = autoResult.spots.find((s) => s.id === spotId);
      onLocationChange({
        attractionId: autoResult.attraction.id,
        attractionName: autoResult.attraction.name,
        cityName: autoResult.attraction.cityName,
        spotId,
        spotName: spot?.name,
      });
    }
  }

  function handleManualAttrSelect(attrId: number) {
    setSelectedAttrId(attrId);
    setSelectedManualSpotId(null);
    const attr = manualAttractions.find((a) => a.id === attrId);
    if (attr) {
      onLocationChange({
        attractionId: attr.id,
        attractionName: attr.name,
        cityName: selectedCity,
      });
    }
  }

  function handleManualSpotSelect(spotId: number | null) {
    setSelectedManualSpotId(spotId);
    if (selectedAttrId) {
      const attr = manualAttractions.find((a) => a.id === selectedAttrId);
      const spot = manualSpots.find((s) => s.id === spotId);
      if (attr) {
        onLocationChange({
          attractionId: attr.id,
          attractionName: attr.name,
          cityName: selectedCity,
          spotId: spotId || undefined,
          spotName: spot?.name,
        });
      }
    }
  }

  function switchToManual() {
    setMode("manual");
    onLocationChange(null);
  }

  // Auto mode with GPS
  if (mode === "auto" && gps) {
    if (autoLoading) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">正在匹配附近景点...</p>
        </div>
      );
    }

    if (autoResult?.attraction) {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-800">
                GPS定位匹配
              </span>
              <button
                onClick={switchToManual}
                className="text-xs text-indigo-600 underline"
              >
                手动修改
              </button>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {autoResult.attraction.cityName} - {autoResult.attraction.name}
            </p>
            <p className="text-xs text-gray-500">
              距离约 {autoResult.attraction.distance}m
            </p>
          </div>

          {autoResult.spots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择机位 (可选)
              </label>
              <select
                value={selectedSpotId || ""}
                onChange={(e) =>
                  handleSpotSelect(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">不选择具体机位</option>
                {autoResult.spots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      );
    }

    // GPS found but no nearby attraction
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">
          附近未找到已收录的景点
        </p>
        <button
          onClick={switchToManual}
          className="text-sm text-indigo-600 underline"
        >
          手动选择景点
        </button>
      </div>
    );
  }

  // Manual mode (or no GPS)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">选择位置</label>
        {gps && mode === "manual" && (
          <button
            onClick={() => setMode("auto")}
            className="text-xs text-indigo-600 underline"
          >
            使用GPS自动匹配
          </button>
        )}
      </div>

      <select
        value={selectedCity}
        onChange={(e) => {
          setSelectedCity(e.target.value);
          setSelectedAttrId(null);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="">选择城市</option>
        {cities.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      {selectedCity && (
        <select
          value={selectedAttrId || ""}
          onChange={(e) => handleManualAttrSelect(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">选择景点</option>
          {manualAttractions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}

      {selectedAttrId && manualSpots.length > 0 && (
        <select
          value={selectedManualSpotId || ""}
          onChange={(e) =>
            handleManualSpotSelect(
              e.target.value ? Number(e.target.value) : null
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">不选择具体机位</option>
          {manualSpots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {location && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            已选: {location.cityName} - {location.attractionName}
            {location.spotName && ` - ${location.spotName}`}
          </p>
        </div>
      )}
    </div>
  );
}
