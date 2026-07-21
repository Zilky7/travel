"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

interface UserPost {
  id: number;
  attractionId: number;
  spotId: number | null;
  description: string | null;
  photos: string[];
  latitude: string | null;
  longitude: string | null;
  deviceLatitude: string | null;
  deviceLongitude: string | null;
  aiVerified: string;
  aiResult: { match: string; confidence: number; reason: string } | null;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  yes: "bg-green-100 text-green-800",
  no: "bg-red-100 text-red-800",
  uncertain: "bg-gray-100 text-gray-800",
  error: "bg-red-100 text-red-800",
};

export default function AdminUserPosts() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user-posts?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading className="py-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        用户发布管理 ({posts.length})
      </h1>

      {posts.length === 0 ? (
        <p className="text-gray-500">暂无用户发布</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex gap-4">
                <div className="flex gap-1 shrink-0">
                  {post.photos.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
                  {post.photos.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                      +{post.photos.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      #{post.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[post.aiVerified] || STATUS_COLORS.pending
                      }`}
                    >
                      AI: {post.aiVerified}
                    </span>
                  </div>
                  {post.description && (
                    <p className="text-sm text-gray-600 truncate">
                      {post.description}
                    </p>
                  )}
                  {post.aiResult && (
                    <p className="text-xs text-gray-400 mt-1">
                      {post.aiResult.reason} (confidence: {post.aiResult.confidence}%)
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.createdAt).toLocaleString("zh-CN")}
                  </p>
                  {(post.deviceLatitude || post.latitude) && (
                    <p className="text-xs text-gray-400">
                      {post.deviceLatitude
                        ? `[设备定位] ${post.deviceLatitude}, ${post.deviceLongitude}`
                        : `[照片GPS] ${post.latitude}, ${post.longitude}`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
