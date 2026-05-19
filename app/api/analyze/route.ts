import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";

export async function POST(req: NextRequest) {
  try {
    const { companies } = await req.json();

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: "No companies provided" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const results = [];

    for (const company of companies) {
      try {
        /* 1 ── Search for the YouTube channel ─────────────────────── */
        const searchRes = await axios.get(`${BASE}/search`, {
          params: {
            part: "snippet",
            q: company.name,
            type: "channel",
            maxResults: 1,
            key: API_KEY,
          },
        });

        const channelItem = searchRes.data.items?.[0];
        if (!channelItem) {
          results.push({
            companyName: company.name,
            isMainCompany: company.isMainCompany,
            channel: null,
            videos: [],
            error: "No YouTube channel found",
          });
          continue;
        }

        const channelId = channelItem.id.channelId;

        /* 2 ── Get channel details & statistics ───────────────────── */
        const channelRes = await axios.get(`${BASE}/channels`, {
          params: {
            part: "statistics,snippet,contentDetails,brandingSettings",
            id: channelId,
            key: API_KEY,
          },
        });

        const ch = channelRes.data.items?.[0];
        if (!ch) {
          results.push({
            companyName: company.name,
            isMainCompany: company.isMainCompany,
            channel: null,
            videos: [],
            error: "Channel details not available",
          });
          continue;
        }

        /* 3 ── Get recent videos via uploads playlist ─────────────── */
        const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
        let videoItems: any[] = [];

        if (uploadsId) {
          const plRes = await axios.get(`${BASE}/playlistItems`, {
            params: {
              part: "snippet",
              playlistId: uploadsId,
              maxResults: 15,
              key: API_KEY,
            },
          });
          videoItems = plRes.data.items || [];
        }

        /* 4 ── Get video-level statistics ─────────────────────────── */
        const videoIds = videoItems
          .map((v: any) => v.snippet?.resourceId?.videoId)
          .filter(Boolean)
          .join(",");

        let videoStats: any[] = [];
        if (videoIds) {
          const vRes = await axios.get(`${BASE}/videos`, {
            params: {
              part: "statistics,snippet,contentDetails",
              id: videoIds,
              key: API_KEY,
            },
          });
          videoStats = vRes.data.items || [];
        }

        /* 5 ── Assemble result ────────────────────────────────────── */
        results.push({
          companyName: company.name,
          isMainCompany: company.isMainCompany,
          channel: {
            channelId,
            title: ch.snippet.title,
            description: ch.snippet.description || "",
            thumbnailUrl:
              ch.snippet.thumbnails?.high?.url ||
              ch.snippet.thumbnails?.medium?.url ||
              ch.snippet.thumbnails?.default?.url ||
              "",
            subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
            totalViews: parseInt(ch.statistics.viewCount || "0"),
            totalVideos: parseInt(ch.statistics.videoCount || "0"),
            publishedAt: ch.snippet.publishedAt,
            customUrl: ch.snippet.customUrl || "",
            country: ch.snippet.country || "",
          },
          videos: videoStats.map((v: any) => ({
            videoId: v.id,
            title: v.snippet.title,
            description: v.snippet.description || "",
            thumbnailUrl:
              v.snippet.thumbnails?.high?.url ||
              v.snippet.thumbnails?.medium?.url ||
              v.snippet.thumbnails?.default?.url ||
              "",
            publishedAt: v.snippet.publishedAt,
            viewCount: parseInt(v.statistics?.viewCount || "0"),
            likeCount: parseInt(v.statistics?.likeCount || "0"),
            commentCount: parseInt(v.statistics?.commentCount || "0"),
            tags: v.snippet.tags || [],
          })),
        });
      } catch (err: any) {
        console.error(`Error fetching data for ${company.name}:`, err?.response?.data || err.message);
        results.push({
          companyName: company.name,
          isMainCompany: company.isMainCompany,
          channel: null,
          videos: [],
          error: err?.response?.data?.error?.message || err.message || "API error",
        });
      }
    }

    return NextResponse.json({ companies: results });
  } catch (error: any) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
