"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

interface Spot {
  id: number;
  name: string;
  attractionId: number;
  difficulty: string;
  isPublished: boolean;
}

interface Attraction {
  id: number;
  name: string;
}

export default function AdminSpots() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/spots").then((r) => r.json()),
      fetch("/api/attractions").then((r) => r.json()),
    ]).then(([s, a]) => {
      setSpots(s);
      setAttractions(a);
      setLoading(false);
    });
  }, []);

  function getAttractionName(id: number) {
    return attractions.find((a) => a.id === id)?.name || "-";
  }

  async function handleDelete(id: number) {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/spots/${id}`, { method: "DELETE" });
    setSpots((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <Loading className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">点位管理</h1>
        <Link href="/admin/spots/new">
          <Button>添加点位</Button>
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
                景点
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                难度
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
            {spots.map((spot) => (
              <tr key={spot.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {spot.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getAttractionName(spot.attractionId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {spot.difficulty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      spot.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {spot.isPublished ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/admin/spots/${spot.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(spot.id)}
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
