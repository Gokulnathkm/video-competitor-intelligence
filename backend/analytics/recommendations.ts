import { CompanyReport, OverallScore } from "@/types";

export function generateRecommendations(
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

export function generateExecutiveSummary(
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
