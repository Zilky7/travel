"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import PhotoUploader from "./photo-uploader";

interface Photo {
  id: number;
  url: string;
  alt: string | null;
  spotId: number | null;
  attractionId: number | null;
  cityId: number | null;
  createdAt: string;
}

interface SelectOption {
  id: number;
  name: string;
}

export default function AdminPhotosPage() {
  const [photoList, setPhotoList] = useState<Photo[]>([]);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [attractionOptions, setAttractionOptions] = useState<SelectOption[]>([]);
  const [spotOptions, setSpotOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    const res = await fetch("/api/photos");
    if (res.ok) setPhotoList(await res.json());
  }, []);

  useEffect(() => {
    async function init() {
      const [photosRes, citiesRes, attractionsRes, spotsRes] =
        await Promise.all([
          fetch("/api/photos"),
          fetch("/api/cities"),
          fetch("/api/attractions"),
          fetch("/api/spots"),
        ]);

      if (photosRes.ok) setPhotoList(await photosRes.json());
      if (citiesRes.ok) setCityOptions(await citiesRes.json());
      if (attractionsRes.ok) setAttractionOptions(await attractionsRes.json());
      if (spotsRes.ok) setSpotOptions(await spotsRes.json());
      setLoading(false);
    }
    init();
  }, []);

  async function handleUploaded(file: { url: string }) {
    const res = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: file.url }),
    });
    if (res.ok) loadPhotos();
  }

  async function handleAssign(
    photoId: number,
    field: string,
    value: string
  ) {
    const numValue = value ? parseInt(value) : null;
    await fetch(`/api/photos/${photoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: numValue }),
    });
    loadPhotos();
  }

  async function handleDelete(id: number) {
    if (!confirm("确认删除这张照片？")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    loadPhotos();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">照片管理</h1>
        <PhotoUploader onUploaded={handleUploaded} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photoList.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            cities={cityOptions}
            attractions={attractionOptions}
            spots={spotOptions}
            onAssign={handleAssign}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {photoList.length === 0 && (
        <p className="text-center text-gray-500 mt-12">
          暂无照片，请在上方上传。
        </p>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  cities,
  attractions,
  spots,
  onAssign,
  onDelete,
}: {
  photo: Photo;
  cities: SelectOption[];
  attractions: SelectOption[];
  spots: SelectOption[];
  onAssign: (id: number, field: string, value: string) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={photo.url}
          alt={photo.alt || "照片"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <AssignSelect
          label="城市"
          value={photo.cityId}
          options={cities}
          onChange={(v) => onAssign(photo.id, "cityId", v)}
        />
        <AssignSelect
          label="景点"
          value={photo.attractionId}
          options={attractions}
          onChange={(v) => onAssign(photo.id, "attractionId", v)}
        />
        <AssignSelect
          label="点位"
          value={photo.spotId}
          options={spots}
          onChange={(v) => onAssign(photo.id, "spotId", v)}
        />
        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(photo.id)}
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssignSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
      >
        <option value="">-- 无 --</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
