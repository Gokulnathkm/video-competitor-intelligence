export interface CompanyInput {
  name: string;
  isMainCompany: boolean;
}

export interface ChannelInfo {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  publishedAt: string;
  customUrl?: string;
  country?: string;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

export interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
}

export interface ChannelMetrics {
  avgViewsPerVideo: number;
  avgLikesPerVideo: number;
  avgCommentsPerVideo: number;
  engagementRate: number;
  uploadFrequencyPerMonth: number;
  mostRecentUpload: string;
  topVideos: VideoInfo[];
  topics: TopicDistribution[];
}

export interface CompanyReport {
  companyName: string;
  isMainCompany: boolean;
  channel: ChannelInfo | null;
  videos: VideoInfo[];
  metrics: ChannelMetrics | null;
  error?: string;
}

export interface RankingEntry {
  company: string;
  value: number;
  rank: number;
}

export interface OverallScore {
  company: string;
  subscriberScore: number;
  viewsScore: number;
  engagementScore: number;
  frequencyScore: number;
  totalScore: number;
  rank: number;
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
