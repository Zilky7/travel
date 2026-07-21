export interface ParsedSpotData {
  spotName: string;
  attractionName?: string;
  cityName?: string;
  description?: string;
  bestTime?: string;
  bestSeason?: string;
  lightDirection?: string;
  compositionTips?: string;
  outfitTips?: string;
  photoTips?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface ImportResult {
  platform: "xiaohongshu" | "douyin" | "manual";
  sourceUrl?: string;
  rawContent: string;
}

export function detectPlatform(
  input: string
): "xiaohongshu" | "douyin" | "manual" {
  if (
    input.includes("xiaohongshu.com") ||
    input.includes("xhslink.com") ||
    input.includes("小红书")
  ) {
    return "xiaohongshu";
  }
  if (
    input.includes("douyin.com") ||
    input.includes("抖音")
  ) {
    return "douyin";
  }
  return "manual";
}

export function extractUrl(text: string): string | undefined {
  const urlMatch = text.match(
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/
  );
  return urlMatch?.[0];
}

export function buildParsePrompt(rawContent: string): {
  role: string;
  content: string;
}[] {
  return [
    {
      role: "system",
      content: `You are a travel photography content parser. Given raw social media content (from Xiaohongshu, Douyin, or manual paste), extract structured photography spot information.

Return a JSON object with these fields (omit any that cannot be determined):
{
  "spotName": "name of the photo spot",
  "attractionName": "name of the parent attraction/area",
  "cityName": "city name",
  "description": "brief description of the spot",
  "bestTime": "best time of day to shoot",
  "bestSeason": "best season",
  "lightDirection": "lighting conditions/direction",
  "compositionTips": "composition suggestions",
  "outfitTips": "outfit/styling suggestions",
  "photoTips": "camera/phone shooting tips",
  "difficulty": "easy/medium/hard based on accessibility"
}

Only return valid JSON, no additional text.`,
    },
    {
      role: "user",
      content: `Parse the following content and extract photo spot information:\n\n${rawContent}`,
    },
  ];
}
