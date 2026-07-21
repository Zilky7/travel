const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  stream: false
): Promise<string>;
export async function chatCompletion(
  messages: ChatMessage[],
  stream: true
): Promise<ReadableStream<Uint8Array>>;
export async function chatCompletion(
  messages: ChatMessage[],
  stream: boolean
): Promise<string | ReadableStream<Uint8Array>> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      stream,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  if (!stream) {
    const data = await response.json();
    return data.choices[0].message.content;
  }

  return response.body!;
}

export function buildGuidePrompt(
  destination: string,
  guideType: "travel" | "photography" | "both"
): ChatMessage[] {
  const typeDesc =
    guideType === "travel"
      ? "travel guide"
      : guideType === "photography"
      ? "photography shooting guide"
      : "combined travel and photography guide";

  return [
    {
      role: "system",
      content: `You are a professional travel and photography expert.
You write practical, vivid guides in Chinese, targeting young women who love photography.
Your style is similar to Xiaohongshu (Little Red Book) - practical, aesthetic, easy to follow.
Always include specific actionable tips.`,
    },
    {
      role: "user",
      content: `Please write a detailed ${typeDesc} for "${destination}".

Include:
- Best photography spots with specific locations
- Best time of day and season for each spot
- Outfit and color coordination suggestions
- Camera/phone shooting tips (angles, settings)
- Composition suggestions
- Transportation and practical tips

Format the response in well-structured Markdown with clear headings.
Write entirely in Chinese.`,
    },
  ];
}
