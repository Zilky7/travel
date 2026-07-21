"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Guide {
  id: number;
  destination: string;
  guideType: string;
  content: string;
  createdAt: string;
}

export default function AdminGuidesPage() {
  const [guideList, setGuideList] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/guides")
      .then((res) => res.json())
      .then((data) => {
        setGuideList(data);
        setLoading(false);
      });
  }, []);

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
        AI 攻略 ({guideList.length})
      </h1>

      <div className="space-y-4">
        {guideList.map((guide) => (
          <div
            key={guide.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {guide.destination}
                </h3>
                <div className="flex gap-3 text-sm text-gray-500 mt-1">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {guide.guideType}
                  </span>
                  <span>
                    {new Date(guide.createdAt).toLocaleString("zh-CN")}
                  </span>
                  <span>{guide.content.length} 字</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedId(expandedId === guide.id ? null : guide.id)
                }
              >
                {expandedId === guide.id ? "收起" : "查看"}
              </Button>
            </div>
            {expandedId === guide.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 mt-3">
                  {guide.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {guideList.length === 0 && (
        <p className="text-center text-gray-500 mt-12">
          暂无攻略。
        </p>
      )}
    </div>
  );
}
