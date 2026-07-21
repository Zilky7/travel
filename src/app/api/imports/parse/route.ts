import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialImports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { chatCompletion } from "@/lib/deepseek";
import { buildParsePrompt } from "@/lib/social-parser";

export async function POST(request: NextRequest) {
  try {
    const { importId } = await request.json();

    if (!importId) {
      return NextResponse.json(
        { error: "importId is required" },
        { status: 400 }
      );
    }

    const [item] = await db
      .select()
      .from(socialImports)
      .where(eq(socialImports.id, importId));

    if (!item) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    const messages = buildParsePrompt(item.rawContent);
    const content = await chatCompletion(
      messages as { role: "system" | "user" | "assistant"; content: string }[],
      false
    );

    let parsedData = null;
    try {
      parsedData = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Try again." },
        { status: 422 }
      );
    }

    const [updated] = await db
      .update(socialImports)
      .set({ parsedData, status: "parsed" })
      .where(eq(socialImports.id, importId))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Parse failed. AI service may be unavailable." },
      { status: 503 }
    );
  }
}
