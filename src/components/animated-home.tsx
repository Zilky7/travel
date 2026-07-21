"use client";

import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { FadeInUp } from "@/components/ui/motion";
import Link from "next/link";
import { ReactNode } from "react";

interface City {
  id: number;
  name: string;
  nameEn: string | null;
  province: string | null;
  description: string | null;
}

export function AnimatedHero({ children }: { children: ReactNode }) {
  return <FadeInUp>{children}</FadeInUp>;
}

export function AnimatedCityGrid({ cities }: { cities: City[] }) {
  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cities.map((city) => (
        <StaggerItem key={city.id}>
          <Link href={`/city/${city.id}`}>
            <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                <span className="text-5xl font-bold text-indigo-300/60">
                  {city.name.charAt(0)}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {city.name}
                  </h2>
                  {city.nameEn && (
                    <span className="text-sm text-gray-400">
                      {city.nameEn}
                    </span>
                  )}
                </div>
                {city.province && (
                  <p className="text-sm text-gray-400 mb-2">{city.province}</p>
                )}
                {city.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {city.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
