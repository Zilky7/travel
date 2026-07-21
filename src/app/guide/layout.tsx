import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 旅行攻略 | TravelShots",
  description: "AI 驱动的旅行与摄影攻略生成，输入目的地即可获取定制化的出行拍摄指南。",
  openGraph: {
    title: "AI 旅行攻略 - TravelShots",
    description: "让AI为你定制旅行摄影攻略",
    type: "website",
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
