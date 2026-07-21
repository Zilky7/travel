"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

interface Attraction {
  id: number;
  name: string;
  cityId: number;
  address: string | null;
  isPublished: boolean;
}

interface City {
  id: number;
  name: string;
}

export default function AdminAttractions() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/attractions").then((r) => r.json()),
      fetch("/api/cities").then((r) => r.json()),
    ]).then(([a, c]) => {
      setAttractions(a);
      setCities(c);
      setLoading(false);
    });
  }, []);

  function getCityName(cityId: number) {
    return cities.find((c) => c.id === cityId)?.name || "-";
  }

  async function handleDelete(id: number) {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/attractions/${id}`, { method: "DELETE" });
    setAttractions((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <Loading className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">景点管理</h1>
        <Link href="/admin/attractions/new">
          <Button>添加景点</Button>
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
                城市
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
            {attractions.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCityName(item.cityId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.isPublished ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/admin/attractions/${item.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
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
