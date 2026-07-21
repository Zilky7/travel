"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ParsedData {
  spotName?: string;
  attractionName?: string;
  cityName?: string;
  description?: string;
  bestTime?: string;
  compositionTips?: string;
  outfitTips?: string;
  photoTips?: string;
  difficulty?: string;
}

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importId, setImportId] = useState<number | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url && !content) return;

    setSubmitting(true);
    setError("");
    setParsed(null);

    try {
      const res = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url || undefined, content: content || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setImportId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleParse() {
    if (!importId) return;
    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/imports/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setParsed(data.parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          从社交媒体导入
        </h1>
        <p className="text-gray-500">
          粘贴小红书/抖音链接或文案，AI 将自动提取拍照点位信息。
        </p>
      </div>

      <Card className="mb-8">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input
              label="链接（选填）"
              placeholder="粘贴小红书或抖音链接..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文案内容（直接粘贴）
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此粘贴帖子内容..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" loading={submitting}>
              {submitting ? "提交中..." : "提交导入"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {importId && !parsed && (
        <Card className="mb-8">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              内容已提交（ID: {importId}），点击下方按钮进行 AI 解析。
            </p>
            <Button onClick={handleParse} loading={parsing}>
              {parsing ? "AI 解析中..." : "AI 解析"}
            </Button>
          </CardContent>
        </Card>
      )}

      {parsed && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              解析结果
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsed.spotName && (
                <Field label="点位名称" value={parsed.spotName} />
              )}
              {parsed.attractionName && (
                <Field label="景点" value={parsed.attractionName} />
              )}
              {parsed.cityName && (
                <Field label="城市" value={parsed.cityName} />
              )}
              {parsed.description && (
                <Field label="描述" value={parsed.description} />
              )}
              {parsed.bestTime && (
                <Field label="最佳时间" value={parsed.bestTime} />
              )}
              {parsed.compositionTips && (
                <Field label="构图" value={parsed.compositionTips} />
              )}
              {parsed.outfitTips && (
                <Field label="穿搭建议" value={parsed.outfitTips} />
              )}
              {parsed.photoTips && (
                <Field label="拍摄建议" value={parsed.photoTips} />
              )}
              {parsed.difficulty && (
                <Field label="难度" value={parsed.difficulty} />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              已保存，等待管理员审核。管理员可基于此数据创建点位。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
