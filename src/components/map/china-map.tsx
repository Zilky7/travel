"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadBaiduMapScript } from "./baidu-map";

interface CityData {
  id: number;
  name: string;
  latitude: string | null;
  longitude: string | null;
}

interface AttractionData {
  id: number;
  name: string;
  cityId: number;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
}

const CHINA_CENTER = { lng: 104.19, lat: 35.86 };
const CHINA_ZOOM = 5;
const CITY_ZOOM = 12;

export default function ChinaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"country" | "city">("country");
  const [activeCityName, setActiveCityName] = useState<string>("");
  const cityClickRef = useRef<(city: CityData) => void>(() => {});

  const handleCityClick = useCallback(async (city: CityData) => {
    const map = mapRef.current;
    if (!map || !city.latitude || !city.longitude) return;
    const BMapGL = window.BMapGL;

    const point = new BMapGL.Point(
      parseFloat(city.longitude),
      parseFloat(city.latitude)
    );
    map.flyTo(point, CITY_ZOOM);

    setViewMode("city");
    setActiveCityName(city.name);

    try {
      const res = await fetch(`/api/attractions?cityId=${city.id}`);
      if (!res.ok) return;
      const attractionList: AttractionData[] = await res.json();

      setTimeout(() => {
        map.clearOverlays();
        attractionList.forEach((attr) => {
          if (!attr.latitude || !attr.longitude) return;
          const aPoint = new BMapGL.Point(
            parseFloat(attr.longitude),
            parseFloat(attr.latitude)
          );
          const aMarker = new BMapGL.Marker(aPoint);
          map.addOverlay(aMarker);

          const content = `<div style="padding:4px 0;">
            <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;">${attr.name}</h4>
            ${attr.address ? `<p style="margin:2px 0;font-size:12px;color:#888;">${attr.address}</p>` : ""}
            <a href="/city/${attr.cityId}/attraction/${attr.id}" onclick="window.location.href='/city/${attr.cityId}/attraction/${attr.id}';return false;" style="display:inline-block;color:#fff;background:#4f46e5;text-decoration:none;font-size:12px;padding:4px 10px;border-radius:4px;margin-top:4px;">查看详情</a>
          </div>`;
          const infoWindow = new BMapGL.InfoWindow(content, {
            width: 220,
            title: "",
          });
          aMarker.addEventListener("click", () => {
            map.openInfoWindow(infoWindow, aPoint);
          });

          const label = new BMapGL.Label(attr.name, {
            offset: new BMapGL.Size(10, -10),
          });
          label.setStyle({
            color: "#059669",
            fontSize: "11px",
            border: "none",
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: "2px 6px",
            borderRadius: "4px",
          });
          aMarker.setLabel(label);
        });
      }, 800);
    } catch {
      // silently ignore network errors
    }
  }, []);

  cityClickRef.current = handleCityClick;

  const showCityMarkers = useCallback((cities: CityData[]) => {
    const map = mapRef.current;
    if (!map) return;
    const BMapGL = window.BMapGL;

    map.clearOverlays();
    cities.forEach((city) => {
      if (!city.latitude || !city.longitude) return;
      const point = new BMapGL.Point(
        parseFloat(city.longitude),
        parseFloat(city.latitude)
      );
      const marker = new BMapGL.Marker(point);
      map.addOverlay(marker);

      const label = new BMapGL.Label(city.name, {
        offset: new BMapGL.Size(10, -10),
      });
      label.setStyle({
        color: "#4f46e5",
        fontSize: "12px",
        border: "none",
        backgroundColor: "rgba(255,255,255,0.85)",
        padding: "2px 6px",
        borderRadius: "4px",
        fontWeight: "500",
      });
      marker.setLabel(label);

      marker.addEventListener("click", () => {
        cityClickRef.current(city);
      });
    });
  }, []);

  const handleBackToCountry = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const BMapGL = window.BMapGL;

    const point = new BMapGL.Point(CHINA_CENTER.lng, CHINA_CENTER.lat);
    map.flyTo(point, CHINA_ZOOM);
    setViewMode("country");
    setActiveCityName("");

    setTimeout(async () => {
      try {
        const res = await fetch("/api/cities");
        if (!res.ok) return;
        const cityList: CityData[] = await res.json();
        showCityMarkers(cityList);
      } catch {
        // ignore
      }
    }, 800);
  }, [showCityMarkers]);

  useEffect(() => {
    const ak = process.env.NEXT_PUBLIC_BAIDU_MAP_AK;
    if (!ak) {
      setError("地图 API Key 未配置");
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadBaiduMapScript(ak)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const BMapGL = window.BMapGL;

        const map = new BMapGL.Map(containerRef.current);
        const center = new BMapGL.Point(CHINA_CENTER.lng, CHINA_CENTER.lat);
        map.centerAndZoom(center, CHINA_ZOOM);
        map.enableScrollWheelZoom();
        map.addControl(new BMapGL.ScaleControl());
        map.addControl(new BMapGL.NavigationControl());
        mapRef.current = map;

        try {
          const res = await fetch("/api/cities");
          if (res.ok) {
            const cityList: CityData[] = await res.json();
            showCityMarkers(cityList);
          }
        } catch {
          // ignore
        }

        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showCityMarkers]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-500 h-[300px] sm:h-[400px] lg:h-[500px]">
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {viewMode === "city" && (
        <button
          onClick={handleBackToCountry}
          className="absolute top-3 left-3 z-20 bg-white/90 hover:bg-white text-sm text-gray-700 px-3 py-1.5 rounded-md shadow-md transition-colors"
        >
          返回全览
        </button>
      )}
      {viewMode === "city" && activeCityName && (
        <div className="absolute top-3 right-3 z-20 bg-white/90 text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-md shadow-md">
          {activeCityName}
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
