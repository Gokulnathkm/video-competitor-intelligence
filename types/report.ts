import { ChannelInfo } from "./channel";
import { VideoInfo } from "./video";
import { ChannelMetrics, RankingEntry, OverallScore } from "./analytics";

export interface CompanyInput {
  name: string;
  isMainCompany: boolean;
}

export interface CompanyReport {
  companyName: string;
  isMainCompany: boolean;
  channel: ChannelInfo | null;
  videos: VideoInfo[];
  metrics: ChannelMetrics | null;
  error?: string;
}

export interface GapInsight {
  company: string;
  missingTopics: string[];
  opportunities: string[];
}

export interface FullReport {
  generatedAt: string;
  companies: CompanyReport[];
  rankings: {
    subscribers: RankingEntry[];
    views: RankingEntry[];
    engagement: RankingEntry[];
    frequency: RankingEntry[];
    overall: OverallScore[];
  };
  gapAnalysis: GapInsight[];
  recommendations: string[];
  executiveSummary: string;
}
