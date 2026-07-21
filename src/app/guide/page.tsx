"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type GuideType = "travel" | "photography" | "both";

interface GuideHistory {
  id: number;
  destination: string;
  guideType: string;
  content: string;
  createdAt: string;
}

const guideTypes: { value: GuideType; label: string }[] = [
  { value: "both", label: "旅行 + 摄影" },
  { value: "travel", label: "仅旅行" },
  { value: "photography", label: "仅摄影" },
];

export default function GuidePage() {
  const [destination, setDestination] = useState("");
  const [guideType, setGuideType] = useState<GuideType>("both");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<GuideHistory[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHistory(data))
      .catch(() => {});
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim()) return;

    setContent("");
    setGenerating(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, guideType, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "生成失败");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        result += text;
        setContent(result);
      }

      fetch("/api/guides")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setHistory(data))
        .catch(() => {});
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setContent(err.message || "生成失败，请重试。");
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          AI 旅行攻略
        </h1>
        <p className="text-gray-500">
          输入目的地，获取 AI 生成的旅行与摄影攻略。
        </p>
      </div>

      <Card className="mb-8">
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4 pt-2">
            <Input
              label="目的地"
              placeholder="例如：成都、大理、东京..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                攻略类型
              </label>
              <div className="flex gap-3">
                {guideTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setGuideType(t.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      guideType === t.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" loading={generating} size="lg">
              {generating ? "生成中..." : "生成攻略"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {content && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {destination} 攻略
            </h2>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
              {content}
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            我的攻略历史
          </h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl border border-gray-200 p-4"
                onClick={() => {
                  setDestination(item.destination);
                  setContent(item.content);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.destination}
                    </span>
                    <span className="ml-3 text-xs text-gray-500">
                      {item.guideType === "both"
                        ? "旅行+摄影"
                        : item.guideType === "travel"
                        ? "旅行"
                        : "摄影"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
