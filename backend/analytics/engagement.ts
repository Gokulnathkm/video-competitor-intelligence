import { VideoInfo } from "@/types";

export function calculateEngagement(videos: VideoInfo[]) {
  const n = videos.length;
  if (n === 0) {
    return {
      avgViewsPerVideo: 0,
      avgLikesPerVideo: 0,
      avgCommentsPerVideo: 0,
      engagementRate: 0,
    };
  }

  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const totalComments = videos.reduce((s, v) => s + v.commentCount, 0);

  const avgViewsPerVideo = Math.round(totalViews / n);
  const avgLikesPerVideo = Math.round(totalLikes / n);
  const avgCommentsPerVideo = Math.round(totalComments / n);

  const engagementRate =
    totalViews > 0
      ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
      : 0;

  return {
    avgViewsPerVideo,
    avgLikesPerVideo,
    avgCommentsPerVideo,
    engagementRate,
  };
}
