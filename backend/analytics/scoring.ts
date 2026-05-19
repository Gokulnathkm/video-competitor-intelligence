import { CompanyReport, RankingEntry, OverallScore } from "@/types";

export function normalise(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

export function rank(
  companies: CompanyReport[],
  valueFn: (c: CompanyReport) => number
): RankingEntry[] {
  return companies
    .filter((c) => c.channel)
    .map((c) => ({ company: c.companyName, value: valueFn(c) }))
    .sort((a, b) => b.value - a.value)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export function computeOverallScores(companies: CompanyReport[]): OverallScore[] {
  const valid = companies.filter((c) => c.channel && c.metrics);

  const subs = valid.map((c) => c.channel!.subscriberCount);
  const views = valid.map((c) => c.metrics!.avgViewsPerVideo);
  const eng = valid.map((c) => c.metrics!.engagementRate);
  const freq = valid.map((c) => c.metrics!.uploadFrequencyPerMonth);

  const nSubs = normalise(subs);
  const nViews = normalise(views);
  const nEng = normalise(eng);
  const nFreq = normalise(freq);

  const scores: OverallScore[] = valid.map((c, i) => ({
    company: c.companyName,
    subscriberScore: nSubs[i],
    viewsScore: nViews[i],
    engagementScore: nEng[i],
    frequencyScore: nFreq[i],
    totalScore: Math.round(
      nSubs[i] * 0.25 + nViews[i] * 0.25 + nEng[i] * 0.3 + nFreq[i] * 0.2
    ),
    rank: 0,
  }));

  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((s, i) => (s.rank = i + 1));
  return scores;
}
