"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

interface Stats {
  cities: number;
  attractions: number;
  spots: number;
  users: number;
}

const statLabels: { key: keyof Stats; label: string; color: string }[] = [
  { key: "cities", label: "城市", color: "text-blue-600 bg-blue-50" },
  {
    key: "attractions",
    label: "景点",
    color: "text-green-600 bg-green-50",
  },
  { key: "spots", label: "点位", color: "text-purple-600 bg-purple-50" },
  { key: "users", label: "用户", color: "text-orange-600 bg-orange-50" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <Loading className="py-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statLabels.map(({ key, label, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${color}`}>
                <span className="text-2xl font-bold">{stats[key]}</span>
              </div>
              <span className="text-sm font-medium text-gray-600">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
