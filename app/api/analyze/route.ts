import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";

// Simple in-memory cache to avoid duplicate API requests and conserve quota
const apiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCachedData(key: string) {
  const cached = apiCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  apiCache[key] = { data, timestamp: Date.now() };
}

// Parse input to identify direct IDs, handles, or generic query strings
function parseYoutubeInput(input: string): { type: "id" | "handle" | "query"; value: string } {
  const trimmed = input.trim();

  // 1. YouTube Channel ID (e.g., UC1234567890abcdefghij12)
  const channelIdMatch = trimmed.match(/(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch) {
    return { type: "id", value: channelIdMatch[0] };
  }

  // 2. YouTube Custom Handle (e.g., @HubSpot or youtube.com/@HubSpot)
  const handleMatch = trimmed.match(/(?:youtube\.com\/@|youtube\.com\/c\/|youtube\.com\/user\/|^@)([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) {
    const cleanHandle = handleMatch[1].startsWith("@") ? handleMatch[1] : `@${handleMatch[1]}`;
    return { type: "handle", value: cleanHandle };
  }

  // 3. Fallback to search query
  return { type: "query", value: trimmed };
}

// Heuristics scoring to identify the best match out of candidate channels
interface ScoreResult {
  score: number;
  reason: string;
}

function calculateMatchScore(query: string, channelTitle: string, customUrl?: string): ScoreResult {
  const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanTitle = channelTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanHandle = customUrl ? customUrl.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^@/, "") : "";

  if (!cleanQ) {
    return { score: 10, reason: "Empty match query" };
  }

  if (cleanQ === cleanTitle) {
    return { score: 95, reason: "Exact channel name match" };
  }

  if (cleanHandle && cleanQ === cleanHandle) {
    return { score: 90, reason: "Exact custom handle match" };
  }

  if (cleanTitle.includes(cleanQ) || cleanQ.includes(cleanTitle)) {
    return { score: 70, reason: "Partial channel name match" };
  }

  if (cleanHandle && (cleanHandle.includes(cleanQ) || cleanQ.includes(cleanHandle))) {
    return { score: 65, reason: "Partial handle match" };
  }

  return { score: 30, reason: "Fuzzy keyword match" };
}

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
    const processedChannelIds = new Set<string>();

    for (const company of companies) {
      const cacheKey = `company-${company.name.toLowerCase()}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        // Prevent duplicate channels in the same run even if from cache
        if (cached.channel && processedChannelIds.has(cached.channel.channelId)) {
          results.push({
            companyName: company.name,
            isMainCompany: company.isMainCompany,
            error: "Duplicate channel detected in matching results",
            channel: null,
            videos: [],
          });
        } else {
          if (cached.channel) processedChannelIds.add(cached.channel.channelId);
          results.push({ ...cached, isMainCompany: company.isMainCompany });
        }
        continue;
      }

      try {
        const parsed = parseYoutubeInput(company.name);
        let channelId = "";
        let directChInfo: any = null;
        let matchConfidence = 100;
        let confidenceReason = "Direct identifier provided";

        // Setup axios client with 12s timeout for defensive networking
        const api = axios.create({
          baseURL: BASE,
          timeout: 12000,
          params: { key: API_KEY },
        });

        if (parsed.type === "id") {
          // Direct ID Lookup (costs 1 unit)
          const chRes = await api.get("/channels", {
            params: { part: "statistics,snippet,contentDetails", id: parsed.value },
          });
          directChInfo = chRes.data.items?.[0];
          if (directChInfo) {
            channelId = directChInfo.id;
          }
        } else if (parsed.type === "handle") {
          // Direct Handle Lookup (costs 1 unit)
          const chRes = await api.get("/channels", {
            params: { part: "statistics,snippet,contentDetails", forHandle: parsed.value },
          });
          directChInfo = chRes.data.items?.[0];
          if (directChInfo) {
            channelId = directChInfo.id;
          } else {
            // Fallback: try username query (older channels)
            const fallbackRes = await api.get("/channels", {
              params: { part: "statistics,snippet,contentDetails", forUsername: parsed.value.replace(/^@/, "") },
            });
            directChInfo = fallbackRes.data.items?.[0];
            if (directChInfo) {
              channelId = directChInfo.id;
            }
          }
        }

        // Fallback or Query search (costs 100 units)
        if (!channelId) {
          const searchQuery = parsed.type === "query" ? parsed.value : company.name;
          const searchRes = await api.get("/search", {
            params: {
              part: "snippet",
              q: searchQuery,
              type: "channel",
              maxResults: 5,
            },
          });

          const candidates = searchRes.data.items || [];
          if (candidates.length === 0) {
            const entry = {
              companyName: company.name,
              isMainCompany: company.isMainCompany,
              channel: null,
              videos: [],
              error: "No YouTube channel found matching the name",
            };
            results.push(entry);
            continue;
          }

          const candidateIds = candidates.map((item: any) => item.id.channelId).filter(Boolean);

          // Batch fetch candidate channel details in a single query (costs 1 unit)
          const channelsRes = await api.get("/channels", {
            params: {
              part: "statistics,snippet,contentDetails",
              id: candidateIds.join(","),
            },
          });

          const chItems = channelsRes.data.items || [];
          let bestCandidate: any = null;
          let highestScore = -1;
          let bestReason = "No matching candidates found";

          for (const ch of chItems) {
            // Skip duplicate channels already assigned to another company
            if (processedChannelIds.has(ch.id)) continue;

            const baseScoreObj = calculateMatchScore(searchQuery, ch.snippet.title, ch.snippet.customUrl);
            let finalScore = baseScoreObj.score;

            // Logarithmic subscriber count boost (large official channels rank higher)
            const subs = parseInt(ch.statistics?.subscriberCount || "0");
            const subBoost = subs > 0 ? Math.min(Math.log10(subs) * 1.5, 10) : 0;
            finalScore = Math.min(Math.round(finalScore + subBoost), 100);

            if (finalScore > highestScore) {
              highestScore = finalScore;
              bestCandidate = ch;
              bestReason = `${baseScoreObj.reason} (${Math.round(highestScore)}% confidence)`;
            }
          }

          if (!bestCandidate && chItems.length > 0) {
            // If all were duplicates but we have candidates, default to first item but flag duplication
            bestCandidate = chItems[0];
            highestScore = 30;
            bestReason = "Defaulting to match (duplicates filtered)";
          }

          if (bestCandidate) {
            directChInfo = bestCandidate;
            channelId = bestCandidate.id;
            matchConfidence = highestScore;
            confidenceReason = bestReason;
          }
        }

        if (!channelId || !directChInfo) {
          const entry = {
            companyName: company.name,
            isMainCompany: company.isMainCompany,
            channel: null,
            videos: [],
            error: "Could not resolve an active YouTube channel",
          };
          results.push(entry);
          continue;
        }

        // Mark channel ID processed to prevent duplicate matches
        processedChannelIds.add(channelId);

        /* Get recent videos via uploads playlist */
        const uploadsId = directChInfo.contentDetails?.relatedPlaylists?.uploads;
        let videoItems: any[] = [];

        if (uploadsId) {
          const plRes = await api.get("/playlistItems", {
            params: {
              part: "snippet",
              playlistId: uploadsId,
              maxResults: 15,
            },
          });
          videoItems = plRes.data.items || [];
        }

        /* Get video-level statistics */
        const videoIds = videoItems
          .map((v: any) => v.snippet?.resourceId?.videoId)
          .filter(Boolean)
          .join(",");

        let videoStats: any[] = [];
        if (videoIds) {
          const vRes = await api.get("/videos", {
            params: {
              part: "statistics,snippet,contentDetails",
              id: videoIds,
            },
          });
          videoStats = vRes.data.items || [];
        }

        const reportEntry = {
          companyName: company.name,
          isMainCompany: company.isMainCompany,
          channel: {
            channelId,
            title: directChInfo.snippet.title,
            description: directChInfo.snippet.description || "",
            thumbnailUrl:
              directChInfo.snippet.thumbnails?.high?.url ||
              directChInfo.snippet.thumbnails?.medium?.url ||
              directChInfo.snippet.thumbnails?.default?.url ||
              "",
            subscriberCount: parseInt(directChInfo.statistics?.subscriberCount || "0"),
            totalViews: parseInt(directChInfo.statistics?.viewCount || "0"),
            totalVideos: parseInt(directChInfo.statistics?.videoCount || "0"),
            publishedAt: directChInfo.snippet.publishedAt,
            customUrl: directChInfo.snippet.customUrl || "",
            country: directChInfo.snippet.country || "",
            matchConfidence,
            confidenceReason,
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
        };

        // Cache the processed company result
        setCachedData(cacheKey, reportEntry);
        results.push(reportEntry);

      } catch (err: any) {
        console.error(`Error processing ${company.name}:`, err?.response?.data || err.message);
        results.push({
          companyName: company.name,
          isMainCompany: company.isMainCompany,
          channel: null,
          videos: [],
          error: err?.response?.data?.error?.message || err.message || "Timeout or API network failure",
        });
      }
    }

    return NextResponse.json({ companies: results });
  } catch (error: any) {
    console.error("General Analyze API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
