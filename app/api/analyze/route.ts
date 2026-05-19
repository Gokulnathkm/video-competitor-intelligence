import { NextRequest, NextResponse } from "next/server";
import { fetchChannelsAndVideos } from "@/backend/youtube/youtube-service";

const API_KEY = process.env.YOUTUBE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { companies } = await req.json();

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: "No companies provided" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    // Call modular youtube ingestion service
    const results = await fetchChannelsAndVideos(companies, API_KEY);

    return NextResponse.json({ companies: results });
  } catch (error: any) {
    console.error("General Analyze API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
