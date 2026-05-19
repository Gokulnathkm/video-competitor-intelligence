import { VideoInfo } from "@/types";

export function calculateFrequencyAndConsistency(videos: VideoInfo[]) {
  const n = videos.length;
  if (n === 0) {
    return {
      uploadFrequencyPerMonth: 0,
      postingConsistency: 50,
      mostRecentUpload: "",
      dates: [],
    };
  }

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
    postingConsistency = Math.max(10, Math.min(100, Math.round(100 - cv * 35)));
  }

  const now = Date.now();
  const oldestTime = dates[0];
  const spanMs = Math.max(now - oldestTime, 1000 * 60 * 60 * 24 * 15); // Min span 15 days
  const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30);
  const uploadFrequencyPerMonth = parseFloat((n / spanMonths).toFixed(1));

  const mostRecentUpload = [...videos].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )[0]?.publishedAt || "";

  return {
    uploadFrequencyPerMonth,
    postingConsistency,
    mostRecentUpload,
    dates,
  };
}
