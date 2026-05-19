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
  matchConfidence?: number;
  confidenceReason?: string;
}
