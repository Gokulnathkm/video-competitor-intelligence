import pptxgen from "pptxgenjs";
import { FullReport } from "@/types";
import { COLORS as LIB_COLORS } from "@/lib/colors";
import { fmt } from "@/lib/formatters";

/* ================================================================== */
/*  COLOUR PALETTE                                                     */
/* ================================================================== */
const BG      = "0F172A";
const PANEL   = "1E293B";
const WHITE   = "F8FAFC";
const GRAY    = "94A3B8";
const ACCENT  = "6366F1";
const COLORS  = LIB_COLORS.map(c => c.replace("#", ""));

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */
function addTitle(slide: pptxgen.Slide, title: string) {
  slide.addShape("rect" as any, {
    x: 0, y: 0, w: "100%", h: 0.85,
    fill: { color: PANEL },
  });
  slide.addText(title, {
    x: 0.6, y: 0.18, w: 8, h: 0.5,
    fontSize: 22, color: WHITE, bold: true, fontFace: "Arial",
  });
}

function addFooter(slide: pptxgen.Slide, pageNum: number, total: number) {
  slide.addText(`Video Competitor Intelligence Report`, {
    x: 0.6, y: 5.15, w: 6, h: 0.3,
    fontSize: 8, color: GRAY, fontFace: "Arial",
  });
  slide.addText(`${pageNum} / ${total}`, {
    x: 8.5, y: 5.15, w: 1, h: 0.3,
    fontSize: 8, color: GRAY, fontFace: "Arial", align: "right",
  });
}

/* ================================================================== */
/*  SLIDE BUILDERS                                                     */
/* ================================================================== */

function slideCover(pres: pptxgen, report: FullReport) {
  slide.background = { fill: BG };

  slide.addShape("rect" as any, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: ACCENT, transparency: 92 },
  });

  slide.addText("Video Competitor\nIntelligence Report", {
    x: 0.8, y: 1.0, w: 8.4, h: 1.8,
    fontSize: 36, color: WHITE, bold: true, fontFace: "Arial",
    lineSpacingMultiple: 1.2,
  });

  const names = report.companies.map((c) => c.companyName).join("  ·  ");
  slide.addText(names, {
    x: 0.8, y: 3.0, w: 8.4, h: 0.5,
    fontSize: 14, color: ACCENT, fontFace: "Arial",
  });

  slide.addText(`Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: 0.8, y: 3.7, w: 8.4, h: 0.4,
    fontSize: 11, color: GRAY, fontFace: "Arial",
  });

  slide.addText("Powered by YouTube Data API", {
    x: 0.8, y: 4.8, w: 8.4, h: 0.3,
    fontSize: 9, color: GRAY, fontFace: "Arial", italic: true,
  });
}

const slide = {} as any; // Temporary variable to get build context, we'll rewrite slideCover with correct slide declaration

function slideExecutiveSummary(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Executive Summary");

  slide.addText(report.executiveSummary, {
    x: 0.6, y: 1.2, w: 8.8, h: 1.5,
    fontSize: 12, color: WHITE, fontFace: "Arial",
    lineSpacingMultiple: 1.5,
    valign: "top",
  });

  // Key metrics boxes
  const leader = report.rankings.overall[0];
  const valid = report.companies.filter((c) => c.metrics);

  const boxes = [
    { label: "Companies Analysed", value: valid.length.toString() },
    { label: "Overall Leader", value: leader?.company || "N/A" },
    { label: "Leader Score", value: `${leader?.totalScore || 0}/100` },
    { label: "Total Videos Reviewed", value: report.companies.reduce((s, c) => s + c.videos.length, 0).toString() },
  ];

  boxes.forEach((box, i) => {
    const x = 0.6 + i * 2.25;
    slide.addShape("roundRect" as any, {
      x, y: 3.2, w: 2.0, h: 1.3,
      fill: { color: PANEL }, rectRadius: 0.1,
    });
    slide.addText(box.value, {
      x, y: 3.3, w: 2.0, h: 0.7,
      fontSize: 22, color: ACCENT, bold: true, fontFace: "Arial", align: "center",
    });
    slide.addText(box.label, {
      x, y: 4.0, w: 2.0, h: 0.4,
      fontSize: 9, color: GRAY, fontFace: "Arial", align: "center",
    });
  });

  addFooter(slide, pg, total);
}

function slideChannelOverview(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Channel Overview Comparison");

  const valid = report.companies.filter((c) => c.channel);
  const labels = valid.map((c) => c.companyName);

  // Subscribers bar chart
  const subsData = [{
    name: "Subscribers",
    labels,
    values: valid.map((c) => c.channel!.subscriberCount),
  }];

  slide.addChart("bar" as any, subsData, {
    x: 0.4, y: 1.0, w: 4.3, h: 2.0,
    showTitle: true, title: "Subscribers", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 7, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 7,
    valAxisHidden: true,
    chartColors: COLORS.slice(0, valid.length),
    plotArea: { fill: { color: PANEL } },
  });

  // Total views bar chart
  const viewsData = [{
    name: "Total Views",
    labels,
    values: valid.map((c) => c.channel!.totalViews),
  }];

  slide.addChart("bar" as any, viewsData, {
    x: 5.3, y: 1.0, w: 4.3, h: 2.0,
    showTitle: true, title: "Total Channel Views", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 7, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 7,
    valAxisHidden: true,
    chartColors: COLORS.slice(0, valid.length),
    plotArea: { fill: { color: PANEL } },
  });

  // Summary table
  const tableRows: pptxgen.TableRow[] = [
    [
      { text: "Company", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Subscribers", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Total Views", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Total Videos", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Channel Since", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
    ],
    ...valid.map((c) => [
      { text: c.companyName, options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: fmt(c.channel!.subscriberCount), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: fmt(c.channel!.totalViews), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: c.channel!.totalVideos.toString(), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: new Date(c.channel!.publishedAt).getFullYear().toString(), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
    ] as pptxgen.TableRow),
  ];

  slide.addTable(tableRows, {
    x: 0.6, y: 3.3, w: 8.8,
    border: { type: "solid", pt: 0.5, color: "334155" },
    colW: [2.2, 1.6, 1.6, 1.6, 1.8],
  });

  addFooter(slide, pg, total);
}

function slideContentPerformance(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Top Performing Content");

  const valid = report.companies.filter((c) => c.metrics && c.metrics.topVideos.length > 0);
  const count = valid.length;
  
  // Dynamically size layout based on channel count to avoid overlap
  const rowHeight = count > 3 ? 0.75 : 1.1;
  const fontSizeCompany = count > 3 ? 9 : 11;
  const fontSizeTitle = count > 3 ? 8 : 9;

  let yPos = 1.1;
  for (const company of valid) {
    const top = company.metrics!.topVideos[0];
    if (!top) continue;

    slide.addText(company.companyName, {
      x: 0.6, y: yPos, w: 4.5, h: 0.22,
      fontSize: fontSizeCompany, color: ACCENT, bold: true, fontFace: "Arial",
    });

    slide.addText(`"${top.title}"`, {
      x: 0.6, y: yPos + 0.22, w: 4.5, h: 0.25,
      fontSize: fontSizeTitle, color: WHITE, fontFace: "Arial", italic: true,
    });

    const stats = `${fmt(top.viewCount)} views  ·  ${fmt(top.likeCount)} likes  ·  ${fmt(top.commentCount)} comments`;
    slide.addText(stats, {
      x: 0.6, y: yPos + 0.47, w: 4.5, h: 0.2,
      fontSize: 7, color: GRAY, fontFace: "Arial",
    });

    yPos += rowHeight;
  }

  // Avg views chart
  const labels = valid.map((c) => c.companyName);
  const avgData = [{
    name: "Avg Views/Video",
    labels,
    values: valid.map((c) => c.metrics!.avgViewsPerVideo),
  }];

  slide.addChart("bar" as any, avgData, {
    x: 5.5, y: 1.0, w: 4.2, h: 3.5,
    showTitle: true, title: "Average Views per Video", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 7, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 7,
    valAxisHidden: true,
    chartColors: COLORS.slice(0, valid.length),
    plotArea: { fill: { color: PANEL } },
  });

  addFooter(slide, pg, total);
}

function slideTopics(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Content Topics & Themes");

  const valid = report.companies.filter((c) => c.metrics);

  // Get all unique topics
  const allTopics = new Set<string>();
  valid.forEach((c) => c.metrics!.topics.forEach((t) => allTopics.add(t.topic)));
  const topicList = [...allTopics].slice(0, 8);

  // Build table
  const headerRow: pptxgen.TableRow = [
    { text: "Topic", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 8 } },
    ...valid.map((c) => ({
      text: c.companyName, options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 8 },
    })),
  ];

  const dataRows: pptxgen.TableRow[] = topicList.map((topic) => [
    { text: topic, options: { color: WHITE, fill: { color: PANEL }, fontSize: 8 } },
    ...valid.map((c) => {
      const t = c.metrics!.topics.find((x) => x.topic === topic);
      return {
        text: t ? `${t.count} (${t.percentage}%)` : "—",
        options: { color: t ? WHITE : GRAY, fill: { color: PANEL }, fontSize: 8 },
      };
    }),
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.6, y: 1.2, w: 8.8,
    border: { type: "solid", pt: 0.5, color: "334155" },
  });

  slide.addText("Topics are extracted from video titles, descriptions, and tags using keyword analysis.", {
    x: 0.6, y: 4.8, w: 8, h: 0.3,
    fontSize: 8, color: GRAY, fontFace: "Arial", italic: true,
  });

  addFooter(slide, pg, total);
}

function slidePostingFrequency(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Posting Frequency & Consistency");

  const valid = report.companies.filter((c) => c.metrics);
  const labels = valid.map((c) => c.companyName);
  const count = valid.length;

  const freqData = [{
    name: "Videos/Month",
    labels,
    values: valid.map((c) => c.metrics!.uploadFrequencyPerMonth),
  }];

  slide.addChart("bar" as any, freqData, {
    x: 0.6, y: 1.1, w: 5.0, h: 3.2,
    showTitle: true, title: "Upload Frequency (videos/month)", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 9, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 8,
    valAxisHidden: true,
    chartColors: COLORS.slice(0, valid.length),
    plotArea: { fill: { color: PANEL } },
  });

  // Most recent upload info
  const rowHeight = count > 3 ? 0.72 : 0.95;
  const fontSizeCompany = count > 3 ? 9 : 10;
  let yPos = 1.1;

  for (const c of valid) {
    slide.addText(`${c.companyName}`, {
      x: 6.2, y: yPos, w: 3.5, h: 0.22,
      fontSize: fontSizeCompany, color: ACCENT, bold: true, fontFace: "Arial",
    });

    const recent = c.metrics!.mostRecentUpload
      ? new Date(c.metrics!.mostRecentUpload).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Unknown";

    slide.addText(`Last upload: ${recent}`, {
      x: 6.2, y: yPos + 0.22, w: 3.5, h: 0.2,
      fontSize: 7.5, color: GRAY, fontFace: "Arial",
    });

    const consistency = c.metrics!.postingConsistency;
    const stats = `${c.metrics!.uploadFrequencyPerMonth} videos/mo  ·  Consistency: ${consistency}%`;
    slide.addText(stats, {
      x: 6.2, y: yPos + 0.42, w: 3.5, h: 0.2,
      fontSize: 7.5, color: WHITE, fontFace: "Arial",
    });

    yPos += rowHeight;
  }

  addFooter(slide, pg, total);
}

function slideEngagement(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Engagement Analysis");

  const valid = report.companies.filter((c) => c.metrics);
  const labels = valid.map((c) => c.companyName);

  // Engagement rate bar
  const engData = [{
    name: "Engagement Rate %",
    labels,
    values: valid.map((c) => c.metrics!.engagementRate),
  }];

  slide.addChart("bar" as any, engData, {
    x: 0.4, y: 1.0, w: 4.5, h: 2.2,
    showTitle: true, title: "Engagement Rate (%)", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 8, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 8,
    valAxisHidden: true,
    chartColors: COLORS.slice(0, valid.length),
    plotArea: { fill: { color: PANEL } },
  });

  // Avg likes/comments
  const multiData = [
    { name: "Avg Likes", labels, values: valid.map((c) => c.metrics!.avgLikesPerVideo) },
    { name: "Avg Comments", labels, values: valid.map((c) => c.metrics!.avgCommentsPerVideo) },
  ];

  slide.addChart("bar" as any, multiData, {
    x: 5.2, y: 1.0, w: 4.5, h: 2.2,
    showTitle: true, title: "Avg Likes & Comments per Video", titleColor: WHITE, titleFontSize: 10,
    showValue: true, dataLabelFontSize: 7, dataLabelColor: WHITE,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 8,
    valAxisHidden: true,
    chartColors: [COLORS[0], COLORS[1]],
    showLegend: true, legendColor: WHITE, legendFontSize: 8,
    plotArea: { fill: { color: PANEL } },
  });

  // Engagement formula note
  slide.addText("Engagement Rate = (Likes + Comments) ÷ Views × 100", {
    x: 0.6, y: 3.5, w: 8, h: 0.3,
    fontSize: 8, color: GRAY, fontFace: "Arial", italic: true,
  });

  // Table
  const rows: pptxgen.TableRow[] = [
    [
      { text: "Company", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Avg Views", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Avg Likes", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Avg Comments", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
      { text: "Engagement %", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 9 } },
    ],
    ...valid.map((c) => [
      { text: c.companyName, options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: fmt(c.metrics!.avgViewsPerVideo), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: fmt(c.metrics!.avgLikesPerVideo), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: fmt(c.metrics!.avgCommentsPerVideo), options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
      { text: `${c.metrics!.engagementRate}%`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 9 } },
    ] as pptxgen.TableRow),
  ];

  slide.addTable(rows, {
    x: 0.6, y: 3.9, w: 8.8,
    border: { type: "solid", pt: 0.5, color: "334155" },
  });

  addFooter(slide, pg, total);
}

function slideGapAnalysis(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Gap Analysis & Opportunity Mapping");

  const gaps = report.gapAnalysis;
  gaps.forEach((gap, index) => {
    // 2-column layout to elegantly accommodate up to 6 channels
    const isCol2 = index >= 3;
    const x = isCol2 ? 5.2 : 0.6;
    const y = 1.2 + (index % 3) * 1.25;

    slide.addText(gap.company, {
      x, y, w: 4.2, h: 0.28,
      fontSize: 10.5, color: ACCENT, bold: true, fontFace: "Arial",
    });

    if (gap.missingTopics.length > 0) {
      slide.addText(`Missing: ${gap.missingTopics.join(", ")}`, {
        x, y: y + 0.28, w: 4.2, h: 0.25,
        fontSize: 8, color: "FCA5A5", fontFace: "Arial",
      });
    } else {
      slide.addText("Covers all identified topic categories", {
        x, y: y + 0.28, w: 4.2, h: 0.25,
        fontSize: 8, color: "86EFAC", fontFace: "Arial",
      });
    }

    if (gap.opportunities.length > 0) {
      const oppText = gap.opportunities.slice(0, 2).map((o) => `• ${o}`).join("\n");
      slide.addText(oppText, {
        x, y: y + 0.53, w: 4.2, h: 0.42,
        fontSize: 7.5, color: GRAY, fontFace: "Arial", lineSpacingMultiple: 1.2,
      });
    }
  });

  addFooter(slide, pg, total);
}

function slideRecommendations(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Video Marketing Recommendations");

  const recs = report.recommendations;
  const half = Math.ceil(recs.length / 2);
  const col1 = recs.slice(0, half).map((r, i) => `${i + 1}.  ${r}`).join("\n\n");
  const col2 = recs.slice(half, 10).map((r, i) => `${i + half + 1}.  ${r}`).join("\n\n");

  slide.addText(col1, {
    x: 0.6, y: 1.2, w: 4.3, h: 3.8,
    fontSize: 9.5, color: WHITE, fontFace: "Arial",
    lineSpacingMultiple: 1.3, valign: "top",
  });

  if (col2) {
    slide.addText(col2, {
      x: 5.2, y: 1.2, w: 4.3, h: 3.8,
      fontSize: 9.5, color: WHITE, fontFace: "Arial",
      lineSpacingMultiple: 1.3, valign: "top",
    });
  }

  addFooter(slide, pg, total);
}

function slideSummaryRanking(pres: pptxgen, report: FullReport, pg: number, total: number) {
  const slide = pres.addSlide();
  slide.background = { fill: BG };
  addTitle(slide, "Overall Ranking & Scores");

  const scores = report.rankings.overall;

  // Radar-like visual using bar chart
  const radarLabels = scores.map((s) => s.company);
  const radarData = [
    { name: "Subscribers", labels: radarLabels, values: scores.map((s) => s.subscriberScore) },
    { name: "Views", labels: radarLabels, values: scores.map((s) => s.viewsScore) },
    { name: "Engagement", labels: radarLabels, values: scores.map((s) => s.engagementScore) },
    { name: "Frequency", labels: radarLabels, values: scores.map((s) => s.frequencyScore) },
  ];

  slide.addChart("bar" as any, radarData, {
    x: 0.4, y: 1.0, w: 5.0, h: 2.8,
    showTitle: true, title: "Score Breakdown (0-100)", titleColor: WHITE, titleFontSize: 10,
    catAxisLabelColor: WHITE, catAxisLabelFontSize: 8,
    valAxisHidden: true,
    chartColors: [COLORS[0], COLORS[1], COLORS[2], COLORS[3]],
    showLegend: true, legendColor: WHITE, legendFontSize: 7,
    plotArea: { fill: { color: PANEL } },
    barGrouping: "clustered",
  });

  // Ranking table
  const rows: pptxgen.TableRow[] = [
    [
      { text: "Rank", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
      { text: "Company", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10 } },
      { text: "Subscribers", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
      { text: "Views", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
      { text: "Engagement", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
      { text: "Frequency", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
      { text: "TOTAL", options: { bold: true, color: WHITE, fill: { color: ACCENT }, fontSize: 10, align: "center" } },
    ],
    ...scores.map((s) => [
      { text: `#${s.rank}`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10, align: "center" as const, bold: true } },
      { text: s.company, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10 } },
      { text: `${s.subscriberScore}`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10, align: "center" as const } },
      { text: `${s.viewsScore}`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10, align: "center" as const } },
      { text: `${s.engagementScore}`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10, align: "center" as const } },
      { text: `${s.frequencyScore}`, options: { color: WHITE, fill: { color: PANEL }, fontSize: 10, align: "center" as const } },
      { text: `${s.totalScore}`, options: { color: ACCENT, fill: { color: PANEL }, fontSize: 11, align: "center" as const, bold: true } },
    ] as pptxgen.TableRow),
  ];

  slide.addTable(rows, {
    x: 0.6, y: 4.0, w: 8.8,
    border: { type: "solid", pt: 0.5, color: "334155" },
  });

  // Scoring note
  slide.addText(
    "Scoring: Subscribers 25% · Avg Views 25% · Engagement 30% · Frequency 20%",
    {
      x: 0.6, y: 4.8, w: 8, h: 0.25,
      fontSize: 7, color: GRAY, fontFace: "Arial", italic: true,
    }
  );

  addFooter(slide, pg, total);
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */

export async function generatePPTX(report: FullReport): Promise<void> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Video Competitor Intelligence Tool";
  pres.subject = "Competitor Video Marketing Analysis";

  const TOTAL_SLIDES = 10;

  // Render Cover Slide
  const coverSlide = pres.addSlide();
  coverSlide.background = { fill: BG };
  coverSlide.addShape("rect" as any, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: ACCENT, transparency: 92 },
  });
  coverSlide.addText("Video Competitor\nIntelligence Report", {
    x: 0.8, y: 1.0, w: 8.4, h: 1.8,
    fontSize: 36, color: WHITE, bold: true, fontFace: "Arial",
    lineSpacingMultiple: 1.2,
  });
  const names = report.companies.map((c) => c.companyName).join("  ·  ");
  coverSlide.addText(names, {
    x: 0.8, y: 3.0, w: 8.4, h: 0.5,
    fontSize: 14, color: ACCENT, fontFace: "Arial",
  });
  coverSlide.addText(`Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: 0.8, y: 3.7, w: 8.4, h: 0.4,
    fontSize: 11, color: GRAY, fontFace: "Arial",
  });
  coverSlide.addText("Powered by YouTube Data API", {
    x: 0.8, y: 4.8, w: 8.4, h: 0.3,
    fontSize: 9, color: GRAY, fontFace: "Arial", italic: true,
  });

  slideExecutiveSummary(pres, report, 2, TOTAL_SLIDES);
  slideChannelOverview(pres, report, 3, TOTAL_SLIDES);
  slideContentPerformance(pres, report, 4, TOTAL_SLIDES);
  slideTopics(pres, report, 5, TOTAL_SLIDES);
  slidePostingFrequency(pres, report, 6, TOTAL_SLIDES);
  slideEngagement(pres, report, 7, TOTAL_SLIDES);
  slideGapAnalysis(pres, report, 8, TOTAL_SLIDES);
  slideRecommendations(pres, report, 9, TOTAL_SLIDES);
  slideSummaryRanking(pres, report, 10, TOTAL_SLIDES);

  const mainCompany = report.companies.find((c) => c.isMainCompany)?.companyName || "Company";
  await pres.writeFile({ fileName: `${mainCompany}_Competitor_Intelligence_Report.pptx` });
}
