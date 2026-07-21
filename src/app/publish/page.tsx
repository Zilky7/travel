"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "./photo-uploader";
import { LocationPicker } from "./location-picker";

interface LocationInfo {
  attractionId: number;
  attractionName: string;
  cityName: string;
  spotId?: number;
  spotName?: string;
}

export default function PublishPage() {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Request browser geolocation on page load
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {} // Silently ignore if user denies
    );
  }, []);

  const handleGpsDetected = useCallback(
    (lat: number, lng: number) => {
      setGps({ lat, lng });
    },
    []
  );

  // Use photo EXIF GPS first, fallback to device GPS
  const effectiveGps = gps || deviceGps;

  async function handleSubmit() {
    if (photoUrls.length === 0) {
      setError("请至少上传一张照片");
      return;
    }
    if (!location) {
      setError("请选择景点位置");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/user-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: photoUrls,
          attractionId: location.attractionId,
          spotId: location.spotId || null,
          description: description || null,
          latitude: effectiveGps?.lat || null,
          longitude: effectiveGps?.lng || null,
          deviceLatitude: deviceGps?.lat || null,
          deviceLongitude: deviceGps?.lng || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "发布失败");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">OK</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">发布成功</h2>
        <p className="text-gray-500 mb-6">你的照片已发布到平台</p>
        <Button onClick={() => (window.location.href = "/")}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布照片</h1>

      <div className="space-y-6">
        <PhotoUploader
          photoUrls={photoUrls}
          onPhotosChange={setPhotoUrls}
          onGpsDetected={handleGpsDetected}
        />

        <LocationPicker
          gps={effectiveGps}
          location={location}
          onLocationChange={setLocation}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述 (选填)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="分享一下你的拍照心得..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          loading={submitting}
          className="w-full"
          disabled={photoUrls.length === 0 || !location}
        >
          {submitting ? "发布中..." : "发布"}
        </Button>
      </div>
    </div>
  );
}
