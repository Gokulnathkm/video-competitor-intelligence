import { CompanyReport, GapInsight } from "@/types";
import { getAllTopicNames } from "../classification/topic-engine";

export function computeGapAnalysis(companies: CompanyReport[]): GapInsight[] {
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
