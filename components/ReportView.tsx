"use client";

import { FullReport } from "../types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Trophy, TrendingUp, Video, BarChart3, Target, Lightbulb,
  AlertTriangle, Award, Eye, ThumbsUp, MessageSquare, Calendar,
} from "lucide-react";

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function Section({ id, icon: Icon, title, badge, children }: {
  id: string;
  icon: any;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass-card p-6 md:p-8 mb-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[var(--accent-glow)]">
          <Icon size={20} className="text-[var(--accent)]" />
        </div>
        <h2 className="section-title">{title}</h2>
        {badge && (
          <span className="section-badge bg-[var(--accent-glow)] text-[var(--accent)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric-card text-center">
      <p className="text-2xl md:text-3xl font-extrabold text-[var(--accent)]">{value}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportView({ report }: { report: FullReport }) {
  const valid = report.companies.filter((c) => c.channel && c.metrics);
  const main = report.companies.find((c) => c.isMainCompany);
  const leader = report.rankings.overall[0];

  /* ─── Executive Summary ──────────────────────────── */
  const execSection = (
    <Section id="executive-summary" icon={Trophy} title="Executive Summary">
      <p className="text-[var(--text-secondary)] leading-relaxed text-base mb-6">
        {report.executiveSummary}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Companies Analysed" value={valid.length.toString()} />
        <MetricBox label="Overall Leader" value={leader?.company || "N/A"} />
        <MetricBox label="Leader Score" value={`${leader?.totalScore || 0}/100`} />
        <MetricBox
          label="Videos Reviewed"
          value={report.companies.reduce((s, c) => s + c.videos.length, 0).toString()}
        />
      </div>
    </Section>
  );

  /* ─── Channel Overview ───────────────────────────── */
  const subsData = valid.map((c, i) => ({
    name: c.companyName,
    value: c.channel!.subscriberCount,
    fill: COLORS[i % COLORS.length],
  }));

  const viewsData = valid.map((c, i) => ({
    name: c.companyName,
    value: c.channel!.totalViews,
    fill: COLORS[i % COLORS.length],
  }));

  const channelSection = (
    <Section id="channel-overview" icon={BarChart3} title="Channel Overview" badge="Comparison">
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Subscribers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subsData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {subsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Total Views</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={viewsData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {viewsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Company</th><th>Subscribers</th><th>Total Views</th><th>Total Videos</th><th>Since</th>
          </tr>
        </thead>
        <tbody>
          {valid.map((c) => (
            <tr key={c.companyName}>
              <td className="font-semibold">{c.companyName}</td>
              <td>{fmt(c.channel!.subscriberCount)}</td>
              <td>{fmt(c.channel!.totalViews)}</td>
              <td>{c.channel!.totalVideos.toLocaleString()}</td>
              <td>{new Date(c.channel!.publishedAt).getFullYear()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );

  /* ─── Content Performance ────────────────────────── */
  const perfSection = (
    <Section id="content-performance" icon={TrendingUp} title="Content Performance" badge="Top Videos">
      {valid.map((c, ci) => (
        <div key={c.companyName} className="mb-6 last:mb-0">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[ci % COLORS.length] }} />
            {c.companyName}
          </h3>
          <div className="grid gap-3">
            {c.metrics!.topVideos.slice(0, 3).map((v) => (
              <a
                key={v.videoId}
                href={`https://youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition group"
              >
                <img
                  src={v.thumbnailUrl}
                  alt={v.title}
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm line-clamp-2 group-hover:text-[var(--accent)] transition">
                    {v.title}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Eye size={12} /> {fmt(v.viewCount)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {fmt(v.likeCount)}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {fmt(v.commentCount)}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(v.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );

  /* ─── Content Topics ─────────────────────────────── */
  const allTopics = new Set<string>();
  valid.forEach((c) => c.metrics!.topics.forEach((t) => allTopics.add(t.topic)));

  const topicsSection = (
    <Section id="topics" icon={Video} title="Content Topics & Themes">
      <table className="report-table">
        <thead>
          <tr>
            <th>Topic</th>
            {valid.map((c) => <th key={c.companyName}>{c.companyName}</th>)}
          </tr>
        </thead>
        <tbody>
          {[...allTopics].map((topic) => (
            <tr key={topic}>
              <td className="font-medium">{topic}</td>
              {valid.map((c) => {
                const t = c.metrics!.topics.find((x) => x.topic === topic);
                return (
                  <td key={c.companyName} className={t ? "" : "text-[var(--text-muted)]"}>
                    {t ? `${t.count} (${t.percentage}%)` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );

  /* ─── Posting Frequency ──────────────────────────── */
  const freqData = valid.map((c, i) => ({
    name: c.companyName,
    value: c.metrics!.uploadFrequencyPerMonth,
    fill: COLORS[i % COLORS.length],
  }));

  const freqSection = (
    <Section id="posting-frequency" icon={Calendar} title="Posting Frequency & Consistency">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Videos per Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={freqData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {freqData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          {valid.map((c, ci) => (
            <div key={c.companyName} className="metric-card flex items-center gap-4">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[ci % COLORS.length] }} />
              <div className="flex-1">
                <p className="font-semibold">{c.companyName}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Last upload: {c.metrics!.mostRecentUpload
                    ? new Date(c.metrics!.mostRecentUpload).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <p className="text-xl font-bold text-[var(--accent)]">{c.metrics!.uploadFrequencyPerMonth}/mo</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ─── Engagement Analysis ────────────────────────── */
  const engData = valid.map((c, i) => ({
    name: c.companyName,
    rate: c.metrics!.engagementRate,
    avgViews: c.metrics!.avgViewsPerVideo,
    avgLikes: c.metrics!.avgLikesPerVideo,
    avgComments: c.metrics!.avgCommentsPerVideo,
    fill: COLORS[i % COLORS.length],
  }));

  const engSection = (
    <Section id="engagement" icon={ThumbsUp} title="Engagement Analysis">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {valid.map((c, ci) => (
          <div key={c.companyName} className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[ci % COLORS.length] }} />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{c.companyName}</span>
            </div>
            <p className="text-2xl font-extrabold text-[var(--accent)]">{c.metrics!.engagementRate}%</p>
            <p className="text-xs text-[var(--text-muted)]">engagement rate</p>
          </div>
        ))}
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Company</th><th>Avg Views</th><th>Avg Likes</th><th>Avg Comments</th><th>Engagement %</th>
          </tr>
        </thead>
        <tbody>
          {valid.map((c) => (
            <tr key={c.companyName}>
              <td className="font-semibold">{c.companyName}</td>
              <td>{fmt(c.metrics!.avgViewsPerVideo)}</td>
              <td>{fmt(c.metrics!.avgLikesPerVideo)}</td>
              <td>{fmt(c.metrics!.avgCommentsPerVideo)}</td>
              <td className="font-bold text-[var(--accent)]">{c.metrics!.engagementRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );

  /* ─── Gap Analysis ───────────────────────────────── */
  const gapSection = (
    <Section id="gap-analysis" icon={AlertTriangle} title="Gap Analysis">
      <div className="grid md:grid-cols-2 gap-4">
        {report.gapAnalysis.map((gap) => (
          <div key={gap.company} className="metric-card">
            <h3 className="font-bold text-lg mb-3">{gap.company}</h3>
            {gap.missingTopics.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[var(--danger)] mb-1">Missing Topics:</p>
                <div className="flex flex-wrap gap-1.5">
                  {gap.missingTopics.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--success)] mb-3">✓ Covers all identified topics</p>
            )}
            {gap.opportunities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--warning)] mb-1">Opportunities:</p>
                <ul className="space-y-1">
                  {gap.opportunities.slice(0, 3).map((o, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-1.5">
                      <Target size={12} className="text-[var(--warning)] flex-shrink-0 mt-0.5" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  /* ─── Recommendations ────────────────────────────── */
  const recsSection = (
    <Section id="recommendations" icon={Lightbulb} title="Video Marketing Recommendations">
      <div className="space-y-3">
        {report.recommendations.map((rec, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center text-sm font-bold">
              {i + 1}
            </span>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{rec}</p>
          </div>
        ))}
      </div>
    </Section>
  );

  /* ─── Overall Ranking ────────────────────────────── */
  const radarData = report.rankings.overall.map((s) => ({
    company: s.company,
    Subscribers: s.subscriberScore,
    Views: s.viewsScore,
    Engagement: s.engagementScore,
    Frequency: s.frequencyScore,
  }));

  const rankSection = (
    <Section id="ranking" icon={Award} title="Overall Ranking & Scores">
      <table className="report-table mb-6">
        <thead>
          <tr>
            <th>Rank</th><th>Company</th><th>Subscribers</th><th>Views</th><th>Engagement</th><th>Frequency</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {report.rankings.overall.map((s) => (
            <tr key={s.company}>
              <td>
                <span className={`rank-badge ${s.rank <= 3 ? `rank-${s.rank}` : "rank-other"}`}>
                  {s.rank}
                </span>
              </td>
              <td className="font-semibold">{s.company}</td>
              <td>{s.subscriberScore}</td>
              <td>{s.viewsScore}</td>
              <td>{s.engagementScore}</td>
              <td>{s.frequencyScore}</td>
              <td className="font-extrabold text-[var(--accent)] text-lg">{s.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-[var(--text-muted)] italic">
        Scoring weights: Subscribers 25% · Avg Views 25% · Engagement 30% · Upload Frequency 20%
      </p>
    </Section>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Competitor Intelligence Report
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Generated {new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          {" · "}{valid.length} companies analysed
        </p>
      </div>
      {execSection}
      {channelSection}
      {perfSection}
      {topicsSection}
      {freqSection}
      {engSection}
      {gapSection}
      {recsSection}
      {rankSection}
    </div>
  );
}
