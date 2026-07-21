"use client";

import { useEffect, useRef, useState } from "react";

interface BMapPoint {
  lng: number;
  lat: number;
}

interface BMapOverlay {
  addEventListener(event: string, handler: () => void): void;
}

interface BMapInfoWindow {
  _brand?: string;
}

interface BMapInstance {
  centerAndZoom(center: BMapPoint, zoom: number): void;
  enableScrollWheelZoom(): void;
  addOverlay(overlay: BMapOverlay): void;
  addControl(control: object): void;
  openInfoWindow(infoWindow: BMapInfoWindow, point: BMapPoint): void;
  addEventListener(event: string, handler: (e: { point: BMapPoint }) => void): void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    BMapGL: any;
    _baiduMapCallback?: () => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  href?: string;
}

interface BaiduMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  className?: string;
}

let loadPromise: Promise<void> | null = null;

export function loadBaiduMapScript(ak: string): Promise<void> {
  if (loadPromise) return loadPromise;
  if (window.BMapGL) return Promise.resolve();

  loadPromise = new Promise((resolve, reject) => {
    window._baiduMapCallback = () => {
      resolve();
      delete window._baiduMapCallback;
    };
    const script = document.createElement("script");
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=_baiduMapCallback`;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Baidu Map SDK"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function BaiduMap({
  center,
  zoom = 15,
  markers = [],
  height = "400px",
  className = "",
}: BaiduMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<BMapInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ak = process.env.NEXT_PUBLIC_BAIDU_MAP_AK;
    if (!ak) {
      setError("Map API key not configured");
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadBaiduMapScript(ak)
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const map = new window.BMapGL.Map(containerRef.current);
        const centerPoint = new window.BMapGL.Point(center.lng, center.lat);
        map.centerAndZoom(centerPoint, zoom);
        map.enableScrollWheelZoom();
        map.addControl(new window.BMapGL.ScaleControl());
        map.addControl(new window.BMapGL.NavigationControl());

        markers.forEach((m) => {
          const point = new window.BMapGL.Point(m.lng, m.lat);
          const marker = new window.BMapGL.Marker(point);
          map.addOverlay(marker);

          if (m.title || m.description) {
            const linkHtml = m.href
              ? `<a href="${m.href}" onclick="window.location.href='${m.href}';return false;" style="display:inline-block;color:#fff;background:#4f46e5;text-decoration:none;font-size:12px;padding:4px 10px;border-radius:4px;margin-top:4px;">查看详情</a>`
              : "";
            const descHtml = m.description
              ? `<p style="margin:4px 0;font-size:13px;color:#666;">${m.description}</p>`
              : "";
            const content = `<div style="padding:4px 0;"><h4 style="margin:0 0 4px;font-size:14px;font-weight:600;">${m.title}</h4>${descHtml}${linkHtml}</div>`;
            const infoWindow = new window.BMapGL.InfoWindow(content, {
              width: 220,
              title: "",
            });
            marker.addEventListener("click", () => {
              map.openInfoWindow(infoWindow, point);
            });
          }
        });

        mapRef.current = map;
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
  }, [center.lat, center.lng, zoom, markers]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-500 ${className}`}
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
