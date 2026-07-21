"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface PostItem {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  attractionId: number;
  attractionName: string;
  cityName: string;
  photoCount: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/feed")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const shuffled = useMemo(() => {
    const arr = [...posts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(i + 42) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [posts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
            {shuffled.map((post, i) => (
              <div key={post.id} className="break-inside-avoid mb-2 sm:mb-3">
                <PostCard post={post} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RATIOS = ["3/4", "4/5", "3/4", "2/3", "4/5"];

function PostCard({ post, index }: { post: PostItem; index: number }) {
  const ratio = RATIOS[index % RATIOS.length];
  const title = post.name.length > 28 ? post.name.slice(0, 28) + "..." : post.name;
  const likeCount = Math.floor(seededRandom(post.id) * 800 + 50);

  return (
    <Link href={`/spot/${post.id}`} className="block">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="relative" style={{ aspectRatio: ratio }}>
          <img
            src={post.coverImage || "/placeholder-spot.jpg"}
            alt={post.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-spot.jpg";
            }}
          />
          {post.photoCount > 1 && (
            <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
              {post.photoCount}
            </div>
          )}
        </div>
        <div className="px-2.5 pt-2 pb-2.5">
          <p className="text-[13px] font-semibold text-gray-900 leading-[1.4] line-clamp-2">
            {title}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex-shrink-0" />
              <span className="text-[11px] text-gray-400 truncate">
                {post.cityName} {post.attractionName}
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-[11px] text-gray-400 flex-shrink-0 ml-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {likeCount}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
