"use client";

import { useEffect, useRef, useState } from "react";
import { loadBaiduMapScript } from "./baidu-map";

export interface SpotMapData {
  id: number;
  name: string;
  description?: string | null;
  lat: number;
  lng: number;
  coverImage: string | null;
  attractionName: string;
  cityName: string;
}

interface PhotoMapOverlayProps {
  spots: SpotMapData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  onSpotClick?: (spotId: number) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function createPhotoOverlayClass(BMapGL: any) {
  class PhotoOverlay extends BMapGL.Overlay {
    _point: any;
    _div: HTMLDivElement | null = null;
    _data: SpotMapData;
    _map: any;
    _onClick?: (id: number) => void;

    constructor(point: any, data: SpotMapData, onClick?: (id: number) => void) {
      super();
      this._point = point;
      this._data = data;
      this._onClick = onClick;
    }

    initialize(map: any) {
      this._map = map;
      this._div = document.createElement("div");
      this._div.style.position = "absolute";
      this._div.style.cursor = "pointer";
      this._div.style.zIndex = "100";
      this._div.innerHTML = this._buildHTML();
      this._div.addEventListener("click", () => {
        this._showInfoWindow();
      });
      map.getPanes().markerPane.appendChild(this._div);
      return this._div;
    }

    draw() {
      const pixel = this._map.pointToOverlayPixel(this._point);
      if (this._div) {
        this._div.style.left = pixel.x - 40 + "px";
        this._div.style.top = pixel.y - 50 + "px";
      }
    }

    _showInfoWindow() {
      const d = this._data;
      const imgSrc = d.coverImage || "/placeholder-spot.jpg";
      const desc = (d.description || "").slice(0, 60);
      const content = `
        <div style="width:260px;padding:0;">
          <img src="${imgSrc}" alt="${d.name}"
            style="width:100%;height:160px;object-fit:cover;border-radius:8px 8px 0 0;"
            onerror="this.src='/placeholder-spot.jpg'" />
          <div style="padding:10px;">
            <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:4px;">
              ${d.name}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">
              ${d.cityName} - ${d.attractionName}
            </div>
            ${desc ? `<div style="font-size:12px;color:#374151;margin-bottom:8px;line-height:1.4;">${desc}...</div>` : ""}
            <a href="/attraction/${d.id}"
              style="display:inline-block;padding:6px 16px;background:#4f46e5;color:#fff;
                border-radius:6px;font-size:12px;text-decoration:none;">
              查看详情
            </a>
          </div>
        </div>
      `;
      const infoWindow = new BMapGL.InfoWindow(content, {
        width: 280,
        offset: new BMapGL.Size(0, -60),
      });
      this._map.openInfoWindow(infoWindow, this._point);
    }

    _buildHTML() {
      const imgSrc = this._data.coverImage || "/placeholder-spot.jpg";
      const name = this._data.name.length > 6
        ? this._data.name.slice(0, 6) + "..."
        : this._data.name;
      return `
        <div style="
          display:flex;flex-direction:column;align-items:center;
          width:80px;
        ">
          <div style="
            width:72px;height:72px;border-radius:10px;overflow:hidden;
            border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            background:#f3f4f6;
          ">
            <img src="${imgSrc}" alt="${this._data.name}"
              style="width:100%;height:100%;object-fit:cover;"
              onerror="this.src='/placeholder-spot.jpg'"
            />
          </div>
          <span style="
            margin-top:4px;font-size:12px;font-weight:500;
            color:#1f2937;text-align:center;
            max-width:80px;overflow:hidden;text-overflow:ellipsis;
            white-space:nowrap;
            text-shadow:0 0 3px #fff,0 0 3px #fff;
          ">${name}</span>
        </div>
      `;
    }
  }
  return PhotoOverlay;
}

export default function PhotoMapOverlay({
  spots,
  center,
  zoom = 12,
  height = "100%",
  className = "",
  onSpotClick,
}: PhotoMapOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
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

        const BMapGL = window.BMapGL;
        const map = new BMapGL.Map(containerRef.current);

        const c = center
          ? center
          : spots.length > 0
            ? { lat: spots[0].lat, lng: spots[0].lng }
            : { lat: 39.915, lng: 116.404 };

        const centerPoint = new BMapGL.Point(c.lng, c.lat);
        map.centerAndZoom(centerPoint, zoom);
        map.enableScrollWheelZoom();
        map.addControl(new BMapGL.ScaleControl());

        const PhotoOverlay = createPhotoOverlayClass(BMapGL);
        const PHOTO_ZOOM_THRESHOLD = 10;

        const photoOverlays: any[] = [];
        spots.forEach((spot) => {
          if (!spot.lat || !spot.lng) return;
          const point = new BMapGL.Point(spot.lng, spot.lat);
          const overlay = new PhotoOverlay(point, spot, onSpotClick);
          photoOverlays.push(overlay);
        });

        const cityGroups: Record<string, { count: number; lat: number; lng: number }> = {};
        spots.forEach((s) => {
          if (!cityGroups[s.cityName]) {
            cityGroups[s.cityName] = { count: 0, lat: 0, lng: 0 };
          }
          cityGroups[s.cityName].count++;
          cityGroups[s.cityName].lat += s.lat;
          cityGroups[s.cityName].lng += s.lng;
        });

        const cityMarkers: any[] = [];
        let activeBoundaryPolygons: any[] = [];
        const boundary = new BMapGL.Boundary();

        function clearBoundary() {
          activeBoundaryPolygons.forEach((p: any) => map.removeOverlay(p));
          activeBoundaryPolygons = [];
        }

        function showCityBoundary(cityName: string, flyToPoint: any) {
          clearBoundary();
          boundary.get(cityName, (rs: any) => {
            if (!rs || !rs.boundaries || rs.boundaries.length === 0) return;
            for (let i = 0; i < rs.boundaries.length; i++) {
              const polygon = new BMapGL.Polygon(rs.boundaries[i], {
                strokeWeight: 2,
                strokeColor: "#4f46e5",
                strokeOpacity: 0.8,
                fillColor: "#4f46e5",
                fillOpacity: 0.08,
                enableClicking: true,
              });
              polygon.addEventListener("click", () => {
                clearBoundary();
                map.flyTo(flyToPoint, 12);
              });
              map.addOverlay(polygon);
              activeBoundaryPolygons.push(polygon);
            }
          });
        }

        Object.entries(cityGroups).forEach(([name, g]) => {
          const avgLat = g.lat / g.count;
          const avgLng = g.lng / g.count;
          const point = new BMapGL.Point(avgLng, avgLat);
          const marker = new BMapGL.Marker(point);
          const label = new BMapGL.Label(`${name} (${g.count})`, {
            offset: new BMapGL.Size(20, -10),
          });
          label.setStyle({
            border: "none",
            background: "rgba(79,70,229,0.9)",
            color: "#fff",
            fontSize: "12px",
            padding: "4px 10px",
            borderRadius: "12px",
            fontWeight: "500",
          });
          marker.setLabel(label);
          marker.addEventListener("mouseover", () => {
            showCityBoundary(name, point);
          });
          marker.addEventListener("mouseout", () => {
            clearBoundary();
          });
          marker.addEventListener("click", () => {
            clearBoundary();
            map.flyTo(point, 12);
          });
          cityMarkers.push(marker);
        });

        function updateOverlays() {
          const currentZoom = map.getZoom();
          if (currentZoom >= PHOTO_ZOOM_THRESHOLD) {
            clearBoundary();
            cityMarkers.forEach((m: any) => map.removeOverlay(m));
            photoOverlays.forEach((o: any) => map.addOverlay(o));
          } else {
            photoOverlays.forEach((o: any) => map.removeOverlay(o));
            cityMarkers.forEach((m: any) => map.addOverlay(m));
          }
        }

        updateOverlays();
        map.addEventListener("zoomend", updateOverlays);

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
  }, [spots, center, zoom, onSpotClick]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-sm text-gray-500 ${className}`}
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */
