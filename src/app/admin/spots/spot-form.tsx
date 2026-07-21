"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Attraction {
  id: number;
  name: string;
}

interface SpotFormData {
  attractionId: number;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  bestTime: string;
  bestSeason: string;
  lightDirection: string;
  compositionTips: string;
  outfitTips: string;
  photoTips: string;
  difficulty: string;
  sortOrder: number;
  isPublished: boolean;
}

interface SpotFormProps {
  initialData?: Partial<SpotFormData>;
  spotId?: number;
}

export default function SpotForm({ initialData, spotId }: SpotFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [form, setForm] = useState<SpotFormData>({
    attractionId: initialData?.attractionId || 0,
    name: initialData?.name || "",
    description: initialData?.description || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    bestTime: initialData?.bestTime || "",
    bestSeason: initialData?.bestSeason || "",
    lightDirection: initialData?.lightDirection || "",
    compositionTips: initialData?.compositionTips || "",
    outfitTips: initialData?.outfitTips || "",
    photoTips: initialData?.photoTips || "",
    difficulty: initialData?.difficulty || "easy",
    sortOrder: initialData?.sortOrder ?? 0,
    isPublished: initialData?.isPublished ?? true,
  });

  useEffect(() => {
    fetch("/api/attractions")
      .then((r) => r.json())
      .then(setAttractions);
  }, []);

  function update(
    field: keyof SpotFormData,
    value: string | number | boolean
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = spotId ? `/api/spots/${spotId}` : "/api/spots";
    const method = spotId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.push("/admin/spots");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-gray-900">
            {spotId ? "编辑点位" : "新建点位"}
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                景点
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.attractionId}
                onChange={(e) =>
                  update("attractionId", parseInt(e.target.value))
                }
                required
              >
                <option value={0}>选择景点...</option>
                {attractions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
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
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                难度
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="最佳时间"
              value={form.bestTime}
              onChange={(e) => update("bestTime", e.target.value)}
              placeholder="如 17:00-18:30"
            />
            <Input
              label="最佳季节"
              value={form.bestSeason}
              onChange={(e) => update("bestSeason", e.target.value)}
              placeholder="如 春季 / 秋季"
            />
          </div>
          <Input
            label="光线方向"
            value={form.lightDirection}
            onChange={(e) => update("lightDirection", e.target.value)}
            placeholder="如 下午逆光"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              构图技巧
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={form.compositionTips}
              onChange={(e) => update("compositionTips", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              穿搭建议
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={form.outfitTips}
              onChange={(e) => update("outfitTips", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              拍摄技巧
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={form.photoTips}
              onChange={(e) => update("photoTips", e.target.value)}
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
              {spotId ? "更新" : "创建"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/spots")}
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
