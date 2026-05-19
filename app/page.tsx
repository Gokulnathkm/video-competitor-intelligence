"use client";

import { useState } from "react";
import { FullReport } from "../types";
import { buildFullReport } from "../utils/analysis";
import { generatePPTX } from "../utils/pptx-generator";
import ReportView from "../components/ReportView";
import {
  Search,
  Plus,
  X,
  Loader2,
  FileDown,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

type AppState = "input" | "loading" | "report";

export default function Home() {
  const [state, setState] = useState<AppState>("input");
  const [mainCompany, setMainCompany] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<FullReport | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const addCompetitor = () => {
    if (competitors.length < 4) setCompetitors([...competitors, ""]);
  };

  const removeCompetitor = (i: number) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const updateCompetitor = (i: number, val: string) => {
    const copy = [...competitors];
    copy[i] = val;
    setCompetitors(copy);
  };

  const handleAnalyze = async () => {
    if (!mainCompany.trim()) return;
    const validComps = competitors.filter((c) => c.trim());
    if (validComps.length === 0) {
      setError("Add at least one competitor");
      return;
    }

    setError("");
    setState("loading");
    setProgress(10);
    setLoadingMsg("Searching YouTube channels...");

    try {
      const companies = [
        { name: mainCompany.trim(), isMainCompany: true },
        ...validComps.map((c) => ({ name: c.trim(), isMainCompany: false })),
      ];

      setProgress(30);
      setLoadingMsg("Fetching channel & video data...");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "API request failed");
      }

      setProgress(60);
      setLoadingMsg("Analysing competitor data...");

      const data = await res.json();

      setProgress(80);
      setLoadingMsg("Building report...");

      await new Promise((r) => setTimeout(r, 500));
      const fullReport = buildFullReport(data.companies);

      setProgress(100);
      setLoadingMsg("Done!");

      await new Promise((r) => setTimeout(r, 300));
      setReport(fullReport);
      setState("report");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setState("input");
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await generatePPTX(report);
    } catch (err) {
      console.error("PPTX generation failed:", err);
      alert("Failed to generate PowerPoint. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const resetToInput = () => {
    setState("input");
    setReport(null);
    setError("");
  };

  /* ── INPUT STATE ─────────────────────────────────── */
  if (state === "input") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 section-badge bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
              <Sparkles size={14} /> AI-Powered Analysis
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Video Competitor
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Intelligence Tool
              </span>
            </h1>
            <p className="mt-4 text-[var(--text-secondary)] text-lg max-w-md mx-auto">
              Analyse YouTube channels, compare performance, and download a
              professional PowerPoint report.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            {/* Main Company */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Your Company
              </label>
              <input
                id="main-company"
                type="text"
                placeholder="e.g. HubSpot"
                value={mainCompany}
                onChange={(e) => setMainCompany(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Competitors */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Competitors (up to 4)
              </label>
              <div className="space-y-3">
                {competitors.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      id={`competitor-${i}`}
                      type="text"
                      placeholder={`Competitor ${i + 1}`}
                      value={c}
                      onChange={(e) => updateCompetitor(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAnalyze();
                      }}
                      className="input-field"
                    />
                    {competitors.length > 1 && (
                      <button
                        onClick={() => removeCompetitor(i)}
                        className="p-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {competitors.length < 4 && (
                <button
                  onClick={addCompetitor}
                  className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition font-semibold"
                >
                  <Plus size={16} /> Add Competitor
                </button>
              )}
            </div>

            {error && (
              <p className="text-[var(--danger)] text-sm font-medium">{error}</p>
            )}

            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={!mainCompany.trim()}
              className="btn-accent w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              <Search size={20} /> Generate Report
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            Uses the YouTube Data API to fetch publicly available data
          </p>
        </div>
      </main>
    );
  }

  /* ── LOADING STATE ───────────────────────────────── */
  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="spinner mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Analysing Competitors</h2>
          <p className="text-[var(--text-secondary)] mb-6">{loadingMsg}</p>
          <div className="w-64 mx-auto progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-3">{progress}%</p>
        </div>
      </main>
    );
  }

  /* ── REPORT STATE ────────────────────────────────── */
  return (
    <main className="min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <button
            onClick={resetToInput}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition font-medium"
          >
            <ArrowLeft size={18} /> New Analysis
          </button>

          <button
            id="download-btn"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-accent flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileDown size={18} />
            )}
            {downloading ? "Generating..." : "Download PowerPoint"}
          </button>
        </div>

        {report && <ReportView report={report} />}

        {/* Bottom download */}
        <div className="text-center mt-12 mb-8">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-accent flex items-center gap-2 mx-auto"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileDown size={18} />
            )}
            {downloading ? "Generating..." : "Download PowerPoint Report"}
          </button>
        </div>
      </div>
    </main>
  );
}
