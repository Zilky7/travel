import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        页面未找到
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        您查找的页面不存在或已被移动。
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
