"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">500</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        出错了
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        发生了意外错误，请重试。
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
