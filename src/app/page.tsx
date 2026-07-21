"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SORT_TABS = [
  { key: "hot", label: "综合" },
  { key: "near", label: "附近" },
  { key: "new", label: "热门" },
];

interface CityOption {
  id: number;
  name: string;
}

interface AttractionItem {
  id: number;
  name: string;
  coverImage: string | null;
  spotsCount: number;
  hotScore: number;
  cityName: string;
  description: string | null;
  photos: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [cityList, setCityList] = useState<CityOption[]>([]);
  const [activeCity, setActiveCity] = useState("");
  const [activeSort, setActiveSort] = useState("hot");
  const [attractions, setAttractions] = useState<AttractionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch published cities on mount
  useEffect(() => {
    fetch("/api/cities?published=true")
      .then((r) => r.json())
      .then((data: CityOption[]) => {
        setCityList(data);
        if (data.length > 0) {
          setActiveCity(data[0].name);
        }
      });
  }, []);

  const fetchData = useCallback(async (city: string, sort: string) => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attractions/feed?city=${encodeURIComponent(city)}&sort=${sort}`
      );
      const data = await res.json();
      setAttractions(data.attractions || []);
    } catch {
      setAttractions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeCity) {
      fetchData(activeCity, activeSort);
    }
  }, [activeCity, activeSort, fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar: city + search + map */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-2">
          <select
            value={activeCity}
            onChange={(e) => setActiveCity(e.target.value)}
            className="text-sm font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
          >
            {cityList.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索景点..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-full border-none outline-none focus:ring-2 focus:ring-indigo-500"
              readOnly
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center gap-1 text-xs text-indigo-600 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            地图
          </button>
        </div>

        {/* Sort tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-4">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSort(tab.key)}
              className={`text-sm pb-1 border-b-2 transition-colors ${
                activeSort === tab.key
                  ? "text-gray-900 font-bold border-gray-900"
                  : "text-gray-400 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attraction list */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : attractions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无景点数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {attractions.map((a) => (
              <AttractionListCard key={a.id} item={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AttractionListCard({ item }: { item: AttractionItem }) {
  const viewCount = item.hotScore > 10000
    ? `${(item.hotScore / 10000).toFixed(1)}万人浏览`
    : `${item.hotScore}人浏览`;

  return (
    <div className="bg-white rounded-xl p-3">
      {/* Header: name + info */}
      <Link href={`/attraction/${item.id}`} className="block">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {item.name}
            <span className="text-gray-300 ml-1">&gt;</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <span>{item.cityName}</span>
          <span>-</span>
          <span>{viewCount}</span>
          <span>-</span>
          <span>{item.spotsCount}个机位</span>
        </div>
      </Link>

      {/* Horizontal photo strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(item.photos.length > 0 ? item.photos : [item.coverImage]).filter(Boolean).map((url, i) => (
          <Link
            key={i}
            href={`/attraction/${item.id}`}
            className="flex-shrink-0"
          >
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={url || "/placeholder-spot.jpg"}
                alt={`${item.name} ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-spot.jpg";
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
