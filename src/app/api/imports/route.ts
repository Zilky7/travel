import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialImports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { detectPlatform, extractUrl } from "@/lib/social-parser";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await db
    .select()
    .from(socialImports)
    .orderBy(desc(socialImports.createdAt))
    .limit(50);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const { content, url } = await request.json();

    if (!content && !url) {
      return NextResponse.json(
        { error: "Content or URL is required" },
        { status: 400 }
      );
    }

    const rawContent = content || url;
    const platform = detectPlatform(rawContent);
    const sourceUrl = url || extractUrl(rawContent);

    const [imported] = await db
      .insert(socialImports)
      .values({
        platform,
        sourceUrl: sourceUrl || null,
        rawContent,
        status: "pending",
      })
      .returning();

    return NextResponse.json(imported, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create import" },
      { status: 500 }
    );
  }
}
