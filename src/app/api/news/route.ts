import { NextResponse } from "next/server";
import { client } from "@sanity/lib/client";
import { NEWS_QUERY } from "@sanity/lib/queries";

export async function GET() {
  try {
    const articles = await client.fetch(NEWS_QUERY);

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Failed to fetch news:", error);

    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}