const XIAOMI_BASE_URL =
  process.env.XIAOMI_BASE_URL || "https://token-plan-cn.xiaomimimo.com/v1";
const XIAOMI_API_KEY = process.env.XIAOMI_API_KEY || "";
const XIAOMI_VISION_MODEL = "mimo-v2.5";

interface Message {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export async function xiaomiChatCompletion(
  messages: Message[],
  maxTokens = 512
): Promise<string> {
  const response = await fetch(`${XIAOMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XIAOMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XIAOMI_VISION_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Xiaomi API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function fetchImageAsBase64(photoUrl: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", photoUrl);
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

export async function verifyPhotoLocation(
  photoUrl: string,
  attractionName: string,
  spotName?: string
): Promise<{ match: string; confidence: number; reason: string }> {
  const locationDesc = spotName
    ? `${attractionName} - ${spotName}`
    : attractionName;

  const base64Url = await fetchImageAsBase64(photoUrl);

  const messages: Message[] = [
    {
      role: "system",
      content:
        "你是旅行照片审核助手。判断照片是否匹配声称的景点。" +
        '回复JSON: {"match":"yes/no/uncertain","confidence":0-100,"reason":"简短理由"}',
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `这张照片声称拍摄于: ${locationDesc}\n请判断照片内容是否与该景点匹配。`,
        },
        {
          type: "image_url",
          image_url: { url: base64Url },
        },
      ],
    },
  ];

  try {
    const content = await xiaomiChatCompletion(messages, 512);
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    return JSON.parse(cleaned);
  } catch {
    return { match: "uncertain", confidence: 0, reason: "AI verification failed" };
  }
}
