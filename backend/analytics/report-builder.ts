import { CompanyReport, ChannelMetrics, FullReport } from "@/types";
import { extractTopics } from "../classification/topic-engine";
import { calculateEngagement } from "./engagement";
import { calculateFrequencyAndConsistency } from "./frequency";
import { rank, computeOverallScores } from "./scoring";
import { computeGapAnalysis } from "./gap-analysis";
import { generateRecommendations, generateExecutiveSummary } from "./recommendations";

export function computeMetrics(company: CompanyReport): ChannelMetrics | null {
  if (!company.channel || company.videos.length === 0) return null;

  const eng = calculateEngagement(company.videos);
  const freq = calculateFrequencyAndConsistency(company.videos);
  const topics = extractTopics(company.videos);

  return {
    ...eng,
    uploadFrequencyPerMonth: freq.uploadFrequencyPerMonth,
    postingConsistency: freq.postingConsistency,
    mostRecentUpload: freq.mostRecentUpload,
    topVideos: [...company.videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
    topics,
  };
}

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
