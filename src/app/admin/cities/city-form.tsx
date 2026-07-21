"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CityFormData {
  name: string;
  nameEn: string;
  description: string;
  province: string;
  latitude: string;
  longitude: string;
  sortOrder: number;
  isPublished: boolean;
}

interface CityFormProps {
  initialData?: Partial<CityFormData>;
  cityId?: number;
}

export default function CityForm({ initialData, cityId }: CityFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CityFormData>({
    name: initialData?.name || "",
    nameEn: initialData?.nameEn || "",
    description: initialData?.description || "",
    province: initialData?.province || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    sortOrder: initialData?.sortOrder ?? 0,
    isPublished: initialData?.isPublished ?? true,
  });

  function update(field: keyof CityFormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = cityId ? `/api/cities/${cityId}` : "/api/cities";
    const method = cityId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.push("/admin/cities");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-gray-900">
            {cityId ? "编辑城市" : "新建城市"}
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="名称"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
            <Input
              label="英文名"
              value={form.nameEn}
              onChange={(e) => update("nameEn", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="省份"
              value={form.province}
              onChange={(e) => update("province", e.target.value)}
            />
            <Input
              label="纬度"
              value={form.latitude}
              onChange={(e) => update("latitude", e.target.value)}
            />
            <Input
              label="经度"
              value={form.longitude}
              onChange={(e) => update("longitude", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="排序"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) => update("sortOrder", parseInt(e.target.value) || 0)}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => update("isPublished", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-700">
                已发布
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving}>
              {cityId ? "更新" : "创建"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/cities")}
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
