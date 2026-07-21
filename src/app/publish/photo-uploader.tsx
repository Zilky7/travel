"use client";

import { useRef, useState } from "react";
import ExifReader from "exifreader";

interface Props {
  photoUrls: string[];
  onPhotosChange: (urls: string[]) => void;
  onGpsDetected: (lat: number, lng: number) => void;
}

export function PhotoUploader({ photoUrls, onPhotosChange, onGpsDetected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [gpsRead, setGpsRead] = useState(false);

  async function extractGps(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const tags = ExifReader.load(buffer, { expanded: true });
      const gps = tags.gps;
      if (gps && gps.Latitude && gps.Longitude) {
        onGpsDetected(gps.Latitude, gps.Longitude);
        setGpsRead(true);
        return true;
      }
    } catch {
      // EXIF read failed, not a problem
    }
    return false;
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 9 - photoUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);

    // Extract GPS from first photo if not already done
    if (!gpsRead && toUpload[0]) {
      await extractGps(toUpload[0]);
    }

    const newUrls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadFile(file);
      if (url) newUrls.push(url);
    }

    onPhotosChange([...photoUrls, ...newUrls]);
    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    const updated = photoUrls.filter((_, i) => i !== index);
    onPhotosChange(updated);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        照片 ({photoUrls.length}/9)
      </label>
      <div className="grid grid-cols-3 gap-2">
        {photoUrls.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
            >
              x
            </button>
          </div>
        ))}
        {photoUrls.length < 9 && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
          >
            {uploading ? (
              <span className="text-xs">上传中...</span>
            ) : (
              <>
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs mt-1">添加照片</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      {gpsRead && (
        <p className="text-xs text-green-600 mt-1">已从照片中读取GPS位置信息</p>
      )}
    </div>
  );
}
