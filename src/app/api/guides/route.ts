import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guides } from "@/db/schema";
import { chatCompletion, buildGuidePrompt } from "@/lib/deepseek";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (session?.user?.id) {
    const result = await db
      .select()
      .from(guides)
      .where(eq(guides.userId, session.user.id))
      .orderBy(desc(guides.createdAt))
      .limit(50);
    return NextResponse.json(result);
  }
  const result = await db.select().from(guides).orderBy(desc(guides.createdAt)).limit(50);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const { destination, guideType = "both", stream: useStream = true } =
    await request.json();

  if (!destination) {
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 }
    );
  }

  const messages = buildGuidePrompt(destination, guideType);

  if (useStream) {
    let body: ReadableStream<Uint8Array>;
    try {
      body = await chatCompletion(messages, true);
    } catch {
      return NextResponse.json(
        { error: "AI service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      let fullContent = "";
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                await writer.write(encoder.encode(content));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch {
        await writer.write(
          encoder.encode("\n\n[Generation interrupted. Please try again.]")
        );
      } finally {
        reader.releaseLock();
      }

      if (fullContent) {
        await db.insert(guides).values({
          userId: session.user?.id,
          destination,
          guideType,
          prompt: messages[1].content,
          content: fullContent,
        });
      }

      await writer.close();
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  }

  const content = await chatCompletion(messages, false);
  const [guide] = await db
    .insert(guides)
    .values({
      userId: session.user?.id,
      destination,
      guideType,
      prompt: messages[1].content,
      content,
    })
    .returning();

  return NextResponse.json(guide, { status: 201 });
}
