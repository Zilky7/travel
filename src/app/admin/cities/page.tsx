"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

interface City {
  id: number;
  name: string;
  nameEn: string | null;
  province: string | null;
  isPublished: boolean;
}

export default function AdminCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => {
        setCities(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/cities/${id}`, { method: "DELETE" });
    setCities((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleTogglePublish(id: number, current: boolean) {
    const res = await fetch(`/api/cities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    if (res.ok) {
      setCities((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isPublished: !current } : c
        )
      );
    }
  }

  if (loading) return <Loading className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">城市管理</h1>
        <Link href="/admin/cities/new">
          <Button>添加城市</Button>
        </Link>
      </div>
      <Card>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                省份
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {city.name}
                  </div>
                  {city.nameEn && (
                    <div className="text-sm text-gray-500">{city.nameEn}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {city.province}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() =>
                      handleTogglePublish(city.id, city.isPublished)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      city.isPublished ? "bg-green-500" : "bg-gray-300"
                    }`}
                    title={city.isPublished ? "点击下线" : "点击上线"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        city.isPublished ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="ml-2 text-xs text-gray-500">
                    {city.isPublished ? "已上线" : "已下线"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/admin/cities/${city.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(city.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
