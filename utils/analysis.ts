import {
  CompanyReport,
  ChannelMetrics,
  FullReport,
  RankingEntry,
  OverallScore,
  GapInsight,
} from "../types";
import { extractTopics, getAllTopicNames } from "./topics";

/* ------------------------------------------------------------------ */
/*  Compute metrics for a single company                               */
/* ------------------------------------------------------------------ */

export function computeMetrics(company: CompanyReport): ChannelMetrics | null {
  if (!company.channel || company.videos.length === 0) return null;

  const videos = company.videos;
  const n = videos.length;

  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const totalComments = videos.reduce((s, v) => s + v.commentCount, 0);

  const avgViews = Math.round(totalViews / n);
  const avgLikes = Math.round(totalLikes / n);
  const avgComments = Math.round(totalComments / n);

  const engagementRate =
    totalViews > 0
      ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
      : 0;

  // Upload consistency: Coefficient of variation of posting intervals
  const dates = videos.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => a - b);
  
  let postingConsistency = 70; // Baseline default
  if (n > 2) {
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgInterval > 0 ? stdDev / avgInterval : 0;
    // Standardize: low variation = near 100%, high variation = drops down to 10% min
    postingConsistency = Math.max(10, Math.min(100, Math.round(100 - cv * 35)));
  }

  // Upload frequency: videos per month based on span, incorporating latency to current date
  const now = Date.now();
  const oldestTime = dates[0];
  const spanMs = Math.max(now - oldestTime, 1000 * 60 * 60 * 24 * 15); // Min span 15 days
  const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30);
  const uploadFrequencyPerMonth = parseFloat((n / spanMonths).toFixed(1));

  const sortedByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const topVideos = sortedByViews.slice(0, 5);

  const mostRecentUpload = [...videos].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )[0]?.publishedAt || "";

  const topics = extractTopics(videos);

  return {
    avgViewsPerVideo: avgViews,
    avgLikesPerVideo: avgLikes,
    avgCommentsPerVideo: avgComments,
    engagementRate,
    uploadFrequencyPerMonth,
    postingConsistency,
    mostRecentUpload,
    topVideos,
    topics,
  };
}

/* ------------------------------------------------------------------ */
/*  Rankings                                                           */
/* ------------------------------------------------------------------ */

function rank(
  companies: CompanyReport[],
  valueFn: (c: CompanyReport) => number
): RankingEntry[] {
  return companies
    .filter((c) => c.channel)
    .map((c) => ({ company: c.companyName, value: valueFn(c) }))
    .sort((a, b) => b.value - a.value)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/* ------------------------------------------------------------------ */
/*  Overall scores (normalised 0-100)                                  */
/* ------------------------------------------------------------------ */

function normalise(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

function computeOverallScores(companies: CompanyReport[]): OverallScore[] {
  const valid = companies.filter((c) => c.channel && c.metrics);

  const subs = valid.map((c) => c.channel!.subscriberCount);
  const views = valid.map((c) => c.metrics!.avgViewsPerVideo);
  const eng = valid.map((c) => c.metrics!.engagementRate);
  const freq = valid.map((c) => c.metrics!.uploadFrequencyPerMonth);

  const nSubs = normalise(subs);
  const nViews = normalise(views);
  const nEng = normalise(eng);
  const nFreq = normalise(freq);

  const scores: OverallScore[] = valid.map((c, i) => ({
    company: c.companyName,
    subscriberScore: nSubs[i],
    viewsScore: nViews[i],
    engagementScore: nEng[i],
    frequencyScore: nFreq[i],
    totalScore: Math.round(
      nSubs[i] * 0.25 + nViews[i] * 0.25 + nEng[i] * 0.3 + nFreq[i] * 0.2
    ),
    rank: 0,
  }));

  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((s, i) => (s.rank = i + 1));
  return scores;
}

/* ------------------------------------------------------------------ */
/*  Gap analysis                                                       */
/* ------------------------------------------------------------------ */

function computeGapAnalysis(companies: CompanyReport[]): GapInsight[] {
  const allTopicNames = getAllTopicNames();

  // Collect each company's covered topics
  const companyTopics: Record<string, Set<string>> = {};
  for (const c of companies) {
    if (!c.metrics) continue;
    companyTopics[c.companyName] = new Set(c.metrics.topics.map((t) => t.topic));
  }

  // Union of all topics covered by any company
  const allCovered = new Set<string>();
  for (const topics of Object.values(companyTopics)) {
    for (const t of topics) allCovered.add(t);
  }

  return companies
    .filter((c) => c.metrics)
    .map((c) => {
      const covered = companyTopics[c.companyName] || new Set();
      const missingTopics = [...allCovered].filter((t) => !covered.has(t) && t !== "Other");

      const opportunities: string[] = [];
      if (missingTopics.includes("Tutorial / How-to"))
        opportunities.push("Create educational how-to videos to drive organic discovery");
      if (missingTopics.includes("Testimonial / Case Study"))
        opportunities.push("Produce customer testimonials to build social proof");
      if (missingTopics.includes("Comparison / Review"))
        opportunities.push("Publish comparison videos to capture high-intent search traffic");
      if (missingTopics.includes("Short-form / Entertainment"))
        opportunities.push("Experiment with YouTube Shorts for broader reach");
      if (missingTopics.includes("Webinar / Live"))
        opportunities.push("Host live sessions or webinars to increase community engagement");
      if (missingTopics.includes("Thought Leadership"))
        opportunities.push("Produce thought-leadership content to position as an industry authority");
      if (c.metrics!.uploadFrequencyPerMonth < 2)
        opportunities.push("Increase posting frequency — aim for at least 2-4 videos per month");
      if (c.metrics!.engagementRate < 2)
        opportunities.push("Improve engagement by adding clear CTAs and asking questions in videos");

      return { company: c.companyName, missingTopics, opportunities };
    });
}

/* ------------------------------------------------------------------ */
/*  Recommendations                                                    */
/* ------------------------------------------------------------------ */

function generateRecommendations(
  companies: CompanyReport[],
  scores: OverallScore[]
): string[] {
  const main = companies.find((c) => c.isMainCompany);
  const competitors = companies.filter((c) => !c.isMainCompany && c.metrics);
  const recs: string[] = [];

  if (!main?.metrics) {
    recs.push("Establish a YouTube channel and begin publishing content immediately — competitors already have a presence.");
    return recs;
  }

  const mainScore = scores.find((s) => s.company === main.companyName);
  const leader = scores[0];

  if (mainScore && mainScore.rank > 1) {
    recs.push(
      `${main.companyName} currently ranks #${mainScore.rank} overall. Focus on closing the gap with ${leader.company} which leads with a score of ${leader.totalScore}/100.`
    );
  }

  // Frequency advice
  const maxFreq = Math.max(...competitors.map((c) => c.metrics!.uploadFrequencyPerMonth), 0);
  if (main.metrics.uploadFrequencyPerMonth < maxFreq) {
    recs.push(
      `Increase upload frequency from ${main.metrics.uploadFrequencyPerMonth} to at least ${Math.ceil(maxFreq)} videos/month to match the most active competitor.`
    );
  }

  // Engagement advice
  const maxEng = Math.max(...competitors.map((c) => c.metrics!.engagementRate), 0);
  if (main.metrics.engagementRate < maxEng) {
    recs.push(
      `Boost engagement rate (currently ${main.metrics.engagementRate}%) by adding calls-to-action, pinned comments, and responding to viewer comments.`
    );
  }

  // Content diversity
  if (main.metrics.topics.length < 3) {
    recs.push("Diversify content types — currently covering fewer than 3 topic categories. Add tutorials, case studies, and comparison videos.");
  }

  // Top performing content replication
  const bestCompetitorVideo = competitors
    .flatMap((c) => c.metrics?.topVideos || [])
    .sort((a, b) => b.viewCount - a.viewCount)[0];
  if (bestCompetitorVideo) {
    recs.push(
      `Study top-performing competitor content like "${bestCompetitorVideo.title}" (${bestCompetitorVideo.viewCount.toLocaleString()} views) for content inspiration.`
    );
  }

  // Shorts
  const anyShorts = competitors.some((c) =>
    c.videos.some((v) => v.title.toLowerCase().includes("short"))
  );
  const mainHasShorts = main.videos.some((v) => v.title.toLowerCase().includes("short"));
  if (anyShorts && !mainHasShorts) {
    recs.push("Competitors are using YouTube Shorts — consider adding short-form content for reach.");
  }

  // SEO
  recs.push("Optimise video titles and descriptions with target keywords to improve YouTube search rankings.");
  recs.push("Create playlist series around key topics to increase watch time and subscriber retention.");

  return recs;
}

/* ------------------------------------------------------------------ */
/*  Executive summary                                                  */
/* ------------------------------------------------------------------ */

function generateExecutiveSummary(
  companies: CompanyReport[],
  scores: OverallScore[]
): string {
  const valid = companies.filter((c) => c.metrics);
  if (valid.length === 0) return "No channel data available for analysis.";

  const leader = scores[0];
  const main = companies.find((c) => c.isMainCompany);
  const mainScore = scores.find((s) => s.company === main?.companyName);

  let summary = `This report analyses ${valid.length} companies across key video marketing metrics. `;
  summary += `${leader.company} leads overall with a composite score of ${leader.totalScore}/100, driven by `;

  const strengths: string[] = [];
  if (leader.subscriberScore >= 80) strengths.push("a strong subscriber base");
  if (leader.viewsScore >= 80) strengths.push("high average video views");
  if (leader.engagementScore >= 80) strengths.push("excellent audience engagement");
  if (leader.frequencyScore >= 80) strengths.push("consistent upload schedule");
  summary += strengths.length > 0 ? strengths.join(", ") + ". " : "balanced performance across all metrics. ";

  if (main && mainScore && mainScore.rank > 1) {
    summary += `${main.companyName} ranks #${mainScore.rank} with a score of ${mainScore.totalScore}/100. `;
    summary += "Key areas for improvement include ";
    const weak: string[] = [];
    if (mainScore.engagementScore < 50) weak.push("engagement");
    if (mainScore.frequencyScore < 50) weak.push("upload frequency");
    if (mainScore.viewsScore < 50) weak.push("video views");
    if (mainScore.subscriberScore < 50) weak.push("subscriber growth");
    summary += weak.length > 0 ? weak.join(" and ") + "." : "maintaining consistency across all metrics.";
  } else if (main && mainScore) {
    summary += `${main.companyName} is the current leader — the focus should be on maintaining this position and expanding content reach.`;
  }

  return summary;
}

/* ------------------------------------------------------------------ */
/*  Build full report                                                  */
/* ------------------------------------------------------------------ */

export function buildFullReport(rawCompanies: CompanyReport[]): FullReport {
  // Compute metrics for each company
  const companies = rawCompanies.map((c) => ({
    ...c,
    metrics: computeMetrics(c),
  }));

  const subRank = rank(companies, (c) => c.channel?.subscriberCount || 0);
  const viewRank = rank(companies, (c) => c.metrics?.avgViewsPerVideo || 0);
  const engRank = rank(companies, (c) => c.metrics?.engagementRate || 0);
  const freqRank = rank(companies, (c) => c.metrics?.uploadFrequencyPerMonth || 0);
  const overall = computeOverallScores(companies);

  const gapAnalysis = computeGapAnalysis(companies);
  const recommendations = generateRecommendations(companies, overall);
  const executiveSummary = generateExecutiveSummary(companies, overall);

  return {
    generatedAt: new Date().toISOString(),
    companies,
    rankings: {
      subscribers: subRank,
      views: viewRank,
      engagement: engRank,
      frequency: freqRank,
      overall,
    },
    gapAnalysis,
    recommendations,
    executiveSummary,
  };
}
