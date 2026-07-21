"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  const user = session?.user;
  const isAdminRole = (user as { role?: string } | undefined)?.role === "admin";

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path
        ? "text-indigo-600"
        : "text-gray-600 hover:text-gray-900"
    }`;

  const mobileNavClass = (path: string) =>
    `flex flex-col items-center gap-0.5 text-[11px] transition-colors ${
      pathname === path
        ? "text-indigo-600"
        : "text-gray-400"
    }`;

  return (
    <>
      {/* Desktop + top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              <span className="text-indigo-600">Travel</span>
              <span className="text-pink-500">Shots</span>
            </Link>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-6">
              <Link href="/community" className={navLinkClass("/community")}>社区</Link>
              <Link href="/" className={navLinkClass("/")}>机位</Link>
              <Link href="/explore" className={navLinkClass("/explore")}>出片地图</Link>
              <Link href="/guide" className={navLinkClass("/guide")}>AI攻略</Link>
              <Link href="/publish" className={navLinkClass("/publish")}>发布</Link>
              {isAdminRole && (
                <Link href="/admin" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                  管理后台
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{user.name || user.email}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  登录
                </Link>
              )}
            </nav>
            {/* Mobile: login/user on top right */}
            <div className="sm:hidden flex items-center gap-2">
              {isAdminRole && (
                <Link href="/admin" className="text-xs text-gray-400">管理</Link>
              )}
              {user ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-gray-400"
                >
                  退出
                </button>
              ) : (
                <Link href="/login" className="text-xs font-medium text-indigo-600">登录</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-1 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-12">
          <Link href="/community" className={mobileNavClass("/community")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>社区</span>
          </Link>
          <Link href="/" className={mobileNavClass("/")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span>机位</span>
          </Link>
          <Link href="/publish" className={mobileNavClass("/publish")}>
            <div className="w-8 h-8 -mt-3 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="-mt-0.5">发布</span>
          </Link>
          <Link href="/explore" className={mobileNavClass("/explore")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>地图</span>
          </Link>
          <Link href="/guide" className={mobileNavClass("/guide")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>攻略</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
