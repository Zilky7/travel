"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface City {
  id: number;
  name: string;
}

interface AttractionFormData {
  cityId: number;
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  openHours: string;
  ticketInfo: string;
  tips: string;
  sortOrder: number;
  isPublished: boolean;
}

interface AttractionFormProps {
  initialData?: Partial<AttractionFormData>;
  attractionId?: number;
}

export default function AttractionForm({
  initialData,
  attractionId,
}: AttractionFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState<AttractionFormData>({
    cityId: initialData?.cityId || 0,
    name: initialData?.name || "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    openHours: initialData?.openHours || "",
    ticketInfo: initialData?.ticketInfo || "",
    tips: initialData?.tips || "",
    sortOrder: initialData?.sortOrder ?? 0,
    isPublished: initialData?.isPublished ?? true,
  });

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then(setCities);
  }, []);

  function update(
    field: keyof AttractionFormData,
    value: string | number | boolean
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = attractionId
      ? `/api/attractions/${attractionId}`
      : "/api/attractions";
    const method = attractionId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.push("/admin/attractions");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-gray-900">
            {attractionId ? "编辑景点" : "新建景点"}
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                城市
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.cityId}
                onChange={(e) => update("cityId", parseInt(e.target.value))}
                required
              >
                <option value={0}>选择城市...</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="名称"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
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
          <Input
            label="地址"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              label="开放时间"
              value={form.openHours}
              onChange={(e) => update("openHours", e.target.value)}
            />
            <Input
              label="门票信息"
              value={form.ticketInfo}
              onChange={(e) => update("ticketInfo", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              小贴士
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={form.tips}
              onChange={(e) => update("tips", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="排序"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) =>
                update("sortOrder", parseInt(e.target.value) || 0)
              }
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => update("isPublished", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-700">
                已发布
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving}>
              {attractionId ? "更新" : "创建"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/attractions")}
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
