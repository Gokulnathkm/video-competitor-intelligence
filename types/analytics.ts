import { VideoInfo } from "./video";

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
  postingConsistency: number;
  mostRecentUpload: string;
  topVideos: VideoInfo[];
  topics: TopicDistribution[];
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
