import dynamic from "next/dynamic";

export type { MapMarker } from "./baidu-map";
export type { SpotMapData } from "./photo-map-overlay";

export const BaiduMapDynamic = dynamic(() => import("./baidu-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-[400px]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export const ChinaMapDynamic = dynamic(() => import("./china-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-[300px] sm:h-[400px] lg:h-[500px]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export const PhotoMapOverlayDynamic = dynamic(
  () => import("./photo-map-overlay"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);
