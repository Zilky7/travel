"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  url: string;
  filename: string;
}

interface PhotoUploaderProps {
  onUploaded: (file: UploadedFile) => void;
}

export default function PhotoUploader({ onUploaded }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "上传失败");
        return;
      }

      const data = await res.json();
      onUploaded(data);
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        loading={uploading}
      >
        {uploading ? "上传中..." : "上传照片"}
      </Button>
      {preview && (
        <img
          src={preview}
          alt="预览"
          className="w-16 h-16 object-cover rounded"
        />
      )}
    </div>
  );
}
