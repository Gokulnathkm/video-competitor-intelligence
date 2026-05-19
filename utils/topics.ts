const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Tutorial / How-to": [
    "tutorial", "how to", "guide", "learn", "tips", "step by step",
    "beginner", "explained", "walkthrough", "training", "course", "lesson",
  ],
  "Product Demo": [
    "demo", "product", "feature", "launch", "release", "update",
    "preview", "showcase", "platform", "software", "tool",
  ],
  "Testimonial / Case Study": [
    "testimonial", "case study", "customer", "success story", "review",
    "result", "client", "feedback", "experience",
  ],
  "Industry News & Trends": [
    "news", "trend", "2024", "2025", "2026", "future", "prediction",
    "industry", "report", "market", "forecast", "outlook",
  ],
  "Behind the Scenes": [
    "behind", "culture", "team", "office", "day in", "making of",
    "inside", "life at", "employees",
  ],
  "Webinar / Live": [
    "webinar", "live", "stream", "q&a", "panel", "discussion",
    "event", "conference", "summit", "talk",
  ],
  "Comparison / Review": [
    "vs", "versus", "comparison", "compare", "review", "best",
    "top", "alternative", "ranking",
  ],
  "Thought Leadership": [
    "insight", "strategy", "opinion", "perspective", "why",
    "myth", "mistake", "secret", "framework", "mindset",
  ],
  "Announcement": [
    "announce", "introducing", "new", "coming soon", "reveal",
    "big news", "exciting", "breaking",
  ],
  "Short-form / Entertainment": [
    "shorts", "fun", "challenge", "trending", "reaction",
    "meme", "quick", "minute", "second",
  ],
};

export function extractTopics(
  videos: { title: string; description: string; tags: string[] }[]
): { topic: string; count: number; percentage: number }[] {
  const topicCounts: Record<string, number> = {};

  for (const video of videos) {
    const text = `${video.title} ${video.description} ${(video.tags || []).join(" ")}`.toLowerCase();
    const matched = new Set<string>();

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matched.add(topic);
          break;
        }
      }
    }

    if (matched.size === 0) matched.add("Other");

    for (const topic of matched) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }

  const total = videos.length || 1;
  return Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTopicNames(): string[] {
  return [...Object.keys(TOPIC_KEYWORDS), "Other"];
}
