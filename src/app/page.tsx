"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────

interface SortResult {
  ticket_id: string;
  case_type: string;
  severity: string;
  department: string;
  agent_summary: string;
  human_review_required: boolean;
  confidence: number;
}

interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ── Sample cases ──────────────────────────────────────────────────

const SAMPLES = [
  {
    label: "Phishing Attempt",
    desc: "OTP / PIN request",
    ticket_id: "TKT-PHISH-01",
    message: "Someone called asking for my OTP and PIN code",
    channel: "call_center",
    locale: "en",
  },
  {
    label: "Wrong Transfer",
    desc: "Sent to wrong number",
    ticket_id: "TKT-WRNG-01",
    message: "I sent money to the wrong recipient please help",
    channel: "app",
    locale: "en",
  },
  {
    label: "Payment Failed",
    desc: "Deducted but not received",
    ticket_id: "TKT-PAY-01",
    message: "My payment failed but the balance was deducted",
    channel: "app",
    locale: "en",
  },
  {
    label: "Refund Request",
    desc: "Want money back",
    ticket_id: "TKT-REF-01",
    message: "I want a refund for my last transaction",
    channel: "sms",
    locale: "en",
  },
  {
    label: "Bangla Message",
    desc: "ভুল নম্বরে টাকা পাঠিয়েছি",
    ticket_id: "TKT-BN-01",
    message: "আমি ভুল নম্বরে টাকা পাঠিয়েছি",
    channel: "app",
    locale: "bn",
  },
];

// ── Helpers ───────────────────────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-neon-red text-white border-black";
    case "high":
      return "bg-neon-orange text-white border-black";
    case "medium":
      return "bg-neon-yellow text-black border-black";
    case "low":
      return "bg-neon-green text-black border-black";
    default:
      return "bg-muted text-black border-black";
  }
}

function caseTypeBadge(caseType: string): string {
  switch (caseType) {
    case "phishing_or_social_engineering":
      return "bg-neon-pink text-white border-black";
    case "wrong_transfer":
      return "bg-neon-blue text-black border-black";
    case "payment_failed":
      return "bg-neon-orange text-white border-black";
    case "refund_request":
      return "bg-neon-yellow text-black border-black";
    default:
      return "bg-muted text-black border-black";
  }
}

function formatCaseType(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\bor\b/g, "/")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────

export default function Home() {
  const [ticketId, setTicketId] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("");
  const [locale, setLocale] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SortResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLiveElapsed(performance.now() - startTime.current);
    }, 50);
    return () => clearInterval(id);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketId.trim() || !message.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setResponseTime(null);
    startTime.current = performance.now();

    const body: Record<string, string> = {
      ticket_id: ticketId.trim(),
      message: message.trim(),
    };
    if (channel) body.channel = channel;
    if (locale) body.locale = locale;

    try {
      const res = await fetch("/sort-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((data as ApiError).error || "Something went wrong");
        return;
      }

      setResult(data as SortResult);
      setResponseTime(performance.now() - startTime.current);
    } catch {
      setError("Failed to connect to the server. Is it running?");
      setResponseTime(performance.now() - startTime.current);
    } finally {
      setLoading(false);
    }
  }

  function loadSample(s: (typeof SAMPLES)[number]) {
    setTicketId(s.ticket_id);
    setMessage(s.message);
    setChannel(s.channel);
    setLocale(s.locale);
    setResult(null);
    setError(null);
    setResponseTime(null);
  }

  function resetForm() {
    setTicketId("");
    setMessage("");
    setChannel("");
    setLocale("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b-4 border-black bg-neon-yellow px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
              QueueStorm
            </h1>
            <p className="text-sm sm:text-base font-bold mt-1">
              Ticket Sorter &mdash; bKash SUST CSE Carnival 2026
            </p>
          </div>
          <a
            href="/health"
            target="_blank"
            className="inline-flex items-center gap-1.5 border-4 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1a1a1a] transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-neon-green border border-black" />
            Health Check
          </a>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10">
        <div className="mx-auto max-w-4xl grid gap-8 lg:grid-cols-5">
          {/* ── Samples Column ─────────────────────────────── */}
          <aside className="lg:col-span-2 order-2 lg:order-1">
            <div className="border-4 border-black bg-card shadow-[6px_6px_0px_0px_#1a1a1a]">
              <div className="border-b-4 border-black bg-black px-4 py-2">
                <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                  Quick Samples
                </h2>
              </div>
              <div className="p-3 space-y-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.ticket_id}
                    onClick={() => loadSample(s)}
                    className="w-full text-left border-3 border-black bg-muted px-3 py-2 text-sm font-semibold shadow-[3px_3px_0px_0px_#1a1a1a] hover:bg-neon-yellow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1a1a1a] transition-all cursor-pointer"
                  >
                    <span className="block text-xs text-black/60 font-mono">
                      {s.ticket_id}
                    </span>
                    <span className="block font-bold">{s.label}</span>
                    <span className="block text-xs text-black/70">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Endpoints Reference */}
            <div className="mt-6 border-4 border-black bg-card shadow-[6px_6px_0px_0px_#1a1a1a]">
              <div className="border-b-4 border-black bg-black px-4 py-2">
                <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                  API
                </h2>
              </div>
              <div className="p-3 font-mono text-xs space-y-2">
                <div>
                  <span className="inline-block border-3 border-black bg-neon-green text-black px-1.5 py-0.5 font-bold text-[10px] mr-1">
                    GET
                  </span>
                  <code className="font-bold">/health</code>
                </div>
                <div>
                  <span className="inline-block border-3 border-black bg-neon-blue text-black px-1.5 py-0.5 font-bold text-[10px] mr-1">
                    POST
                  </span>
                  <code className="font-bold">/sort-ticket</code>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Form Column ────────────────────────────────── */}
          <section className="lg:col-span-3 order-1 lg:order-2">
            <form
              onSubmit={handleSubmit}
              className="border-4 border-black bg-card shadow-[6px_6px_0px_0px_#1a1a1a]"
            >
              <div className="border-b-4 border-black bg-black px-4 sm:px-6 py-3">
                <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                  Submit a Ticket
                </h2>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* ticket_id */}
                <div>
                  <label className="block font-bold text-xs uppercase mb-1.5">
                    Ticket ID <span className="text-neon-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    placeholder="e.g. TKT-001"
                    required
                    className="w-full border-4 border-black bg-white px-3 py-2.5 text-sm font-semibold shadow-[4px_4px_0px_0px_#1a1a1a] outline-none focus:shadow-[2px_2px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                  />
                </div>

                {/* message */}
                <div>
                  <label className="block font-bold text-xs uppercase mb-1.5">
                    Message <span className="text-neon-red">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type the customer support message here..."
                    rows={4}
                    required
                    className="w-full border-4 border-black bg-white px-3 py-2.5 text-sm font-semibold shadow-[4px_4px_0px_0px_#1a1a1a] outline-none focus:shadow-[2px_2px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-y"
                  />
                </div>

                {/* channel + locale row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-xs uppercase mb-1.5">
                      Channel
                    </label>
                    <div className="relative">
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="w-full appearance-none border-4 border-black bg-muted px-3 py-2.5 pr-8 text-sm font-bold shadow-[4px_4px_0px_0px_#1a1a1a] outline-none focus:shadow-[2px_2px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                      >
                        <option value="">Any</option>
                        <option value="app">App</option>
                        <option value="sms">SMS</option>
                        <option value="call_center">Call Center</option>
                        <option value="merchant_portal">Merchant Portal</option>
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-black pointer-events-none">
                        ⌵
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-xs uppercase mb-1.5">
                      Locale
                    </label>
                    <div className="relative">
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        className="w-full appearance-none border-4 border-black bg-muted px-3 py-2.5 pr-8 text-sm font-bold shadow-[4px_4px_0px_0px_#1a1a1a] outline-none focus:shadow-[2px_2px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                      >
                        <option value="">Auto</option>
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                        <option value="mixed">Mixed</option>
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-black pointer-events-none">
                        ⌵
                      </span>
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading || !ticketId.trim() || !message.trim()}
                    className="flex-1 border-4 border-black bg-neon-yellow px-6 py-3.5 font-black text-sm uppercase tracking-wider shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[1px_1px_0px_0px_#1a1a1a] transition-all disabled:bg-muted disabled:text-black/40 disabled:shadow-[5px_5px_0px_0px_#1a1a1a] disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0px_0px_#1a1a1a] cursor-pointer"
                  >
                    {loading
                      ? `SORTING... ${(liveElapsed / 1000).toFixed(1)}s`
                      : "Sort Ticket"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border-4 border-black bg-neon-pink text-white px-5 py-3.5 font-black text-xs uppercase tracking-wider shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[1px_1px_0px_0px_#1a1a1a] transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>

            {/* ── Error ─────────────────────────────────────── */}
            {error && (
              <div className="mt-6 border-4 border-black bg-neon-red shadow-[6px_6px_0px_0px_#1a1a1a]">
                <div className="border-b-4 border-black bg-black px-4 py-2">
                  <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                    Error
                  </h2>
                </div>
                <div className="px-4 py-3 text-white font-bold text-sm">
                  {error}
                </div>
                {responseTime !== null && (
                  <div className="border-t-4 border-black bg-black px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/50">
                      Response Time
                    </span>
                    <span className="font-mono text-sm font-black text-neon-yellow tabular-nums">
                      {(responseTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Result ────────────────────────────────────── */}
            {result && (
              <div className="mt-6 border-4 border-black bg-card shadow-[6px_6px_0px_0px_#1a1a1a] animate-[fadeIn_0.2s_ease-out]">
                <div className="border-b-4 border-black bg-black px-4 sm:px-6 py-3 flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                    Classification Result
                  </h2>
                  <span className="font-mono text-[10px] text-white/60">
                    {result.ticket_id}
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {/* Badge row */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-block border-4 border-black px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#1a1a1a] ${caseTypeBadge(result.case_type)}`}
                    >
                      {formatCaseType(result.case_type)}
                    </span>
                    <span
                      className={`inline-block border-4 border-black px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#1a1a1a] ${severityColor(result.severity)}`}
                    >
                      {result.severity.toUpperCase()}
                    </span>
                    <span className="inline-block border-4 border-black bg-black text-white px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#1a1a1a]">
                      {result.department.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="border-4 border-black bg-muted px-4 py-3">
                    <span className="text-[10px] font-bold uppercase text-black/50 block mb-1">
                      Agent Summary
                    </span>
                    <p className="text-sm font-semibold leading-relaxed">
                      {result.agent_summary}
                    </p>
                  </div>

                  {/* Confidence + Review */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-4 border-black bg-muted px-4 py-3">
                      <span className="text-[10px] font-bold uppercase text-black/50 block mb-1.5">
                        Confidence
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 border-3 border-black bg-white">
                          <div
                            className="h-full bg-neon-yellow border-r-3 border-black transition-all"
                            style={{ width: `${Math.round(result.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="font-black text-sm min-w-[3ch] text-right">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="border-4 border-black bg-muted px-4 py-3">
                      <span className="text-[10px] font-bold uppercase text-black/50 block mb-1.5">
                        Human Review
                      </span>
                      <div className="flex items-center gap-2 h-full">
                        <span
                          className={`inline-block w-4 h-4 border-3 border-black ${result.human_review_required ? "bg-neon-red" : "bg-neon-green"}`}
                        />
                        <span className="font-black text-sm">
                          {result.human_review_required ? "REQUIRED" : "NOT REQUIRED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="border-4 border-black bg-black px-4 py-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                      Response Time
                    </span>
                    <span className="font-mono text-sm font-black text-neon-yellow tabular-nums">
                      {responseTime !== null
                        ? `${(responseTime / 1000).toFixed(2)}s`
                        : "—"}
                    </span>
                  </div>

                  {/* Raw response toggle */}
                  <details className="border-4 border-black">
                    <summary className="bg-muted px-4 py-2.5 font-bold text-xs uppercase cursor-pointer select-none">
                      Raw JSON Response
                    </summary>
                    <pre className="px-4 py-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap border-t-4 border-black">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t-4 border-black bg-black px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-white/60 font-bold">
            QueueStorm Ticket Sorter &mdash; bKash SUST CSE Carnival 2026
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <Link
              href="/team"
              className="font-mono text-white/60 hover:text-neon-yellow transition-colors font-bold"
            >
              cDNA_Bug_Slayers
            </Link>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/mushfiqueraiyan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white transition-colors"
                title="Mushfique Raiyan (Team Leader)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://github.com/mahfuzzayn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white transition-colors"
                title="Mahfuz Zayn (Engineer 2)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://github.com/fazlerabbi8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white transition-colors"
                title="Fazle Rabbi (Engineer 3)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
