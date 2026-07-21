"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SocialImport {
  id: number;
  platform: string;
  sourceUrl: string | null;
  rawContent: string;
  parsedData: Record<string, string> | null;
  status: string;
  linkedSpotId: number | null;
  createdAt: string;
}

interface Attraction {
  id: number;
  name: string;
  cityId: number;
}

export default function AdminImportsPage() {
  const [imports, setImports] = useState<SocialImport[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSpot, setCreatingSpot] = useState<number | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    Promise.all([
      fetch("/api/imports").then((r) => r.json()),
      fetch("/api/attractions").then((r) => r.json()),
    ]).then(([importsData, attractionsData]) => {
      setImports(importsData);
      setAttractions(attractionsData);
      setLoading(false);
    });
  }, []);

  async function handleParse(id: number) {
    const res = await fetch("/api/imports/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importId: id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setImports((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    }
  }

  async function handleStatusChange(id: number, status: string) {
    const res = await fetch(`/api/imports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setImports((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    }
  }

  async function handleCreateSpot(id: number) {
    const attractionId = selectedAttraction[id];
    if (!attractionId) return;
    setCreatingSpot(id);
    try {
      const res = await fetch(`/api/imports/${id}/create-spot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attractionId }),
      });
      if (res.ok) {
        const spot = await res.json();
        setImports((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, linkedSpotId: spot.id } : item
          )
        );
      }
    } finally {
      setCreatingSpot(null);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        社交导入 ({imports.length})
      </h1>

      <div className="space-y-4">
        {imports.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                    {item.platform}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex gap-2">
                {item.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleParse(item.id)}
                  >
                    解析
                  </Button>
                )}
                {item.status === "parsed" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleStatusChange(item.id, "approved")
                      }
                    >
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        handleStatusChange(item.id, "rejected")
                      }
                    >
                      拒绝
                    </Button>
                  </>
                )}
                {item.status === "approved" && !item.linkedSpotId && (
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      value={selectedAttraction[item.id] || ""}
                      onChange={(e) =>
                        setSelectedAttraction((prev) => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value),
                        }))
                      }
                    >
                      <option value="">选择景点</option>
                      {attractions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={
                        !selectedAttraction[item.id] ||
                        creatingSpot === item.id
                      }
                      onClick={() => handleCreateSpot(item.id)}
                    >
                      {creatingSpot === item.id
                        ? "创建中..."
                        : "创建点位"}
                    </Button>
                  </div>
                )}
                {item.linkedSpotId && (
                  <span className="text-xs text-green-600">
                    已关联点位 #{item.linkedSpotId}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
              {item.rawContent}
            </p>

            {item.parsedData && (
              <div className="bg-gray-50 rounded p-3 text-xs space-y-1">
                {Object.entries(item.parsedData).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-gray-400 w-32 shrink-0">{key}</span>
                    <span className="text-gray-700">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {imports.length === 0 && (
        <p className="text-center text-gray-500 mt-12">暂无导入记录。</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    parsed: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "待处理",
    parsed: "已解析",
    approved: "已通过",
    rejected: "已拒绝",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] || status}
    </span>
  );
}
