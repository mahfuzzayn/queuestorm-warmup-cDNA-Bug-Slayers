"use client";

import Link from "next/link";

interface Member {
  name: string;
  role: string;
  github: string;
}

const MEMBERS: Member[] = [
  { name: "Mushfique Raiyan", role: "Team Leader", github: "mushfiqueraiyan" },
  { name: "Mahfuz Zayn", role: "Engineer 2", github: "mahfuzzayn" },
  { name: "Fazle Rabbi", role: "Engineer 3", github: "fazlerabbi8" },
];

export default function TeamPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b-4 border-black bg-neon-yellow px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
              Team
            </h1>
            <p className="text-sm sm:text-base font-bold mt-1">
              cDNA_Bug_Slayers &mdash; bKash SUST CSE Carnival 2026
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 border-4 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1a1a1a] transition-all"
          >
            ← Back to Sorter
          </Link>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="border-4 border-black bg-card shadow-[6px_6px_0px_0px_#1a1a1a]">
            <div className="border-b-4 border-black bg-black px-4 sm:px-6 py-3">
              <h2 className="font-bold text-sm uppercase tracking-wide text-white">
                Team Members
              </h2>
            </div>

            <div className="divide-y-4 divide-black">
              {MEMBERS.map((m) => (
                <div
                  key={m.name}
                  className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-black text-base sm:text-lg">
                      {m.name}
                    </p>
                    <p className="text-xs font-bold text-black/50 uppercase tracking-wider">
                      {m.role}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/${m.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 border-4 border-black bg-black text-white px-3 py-1.5 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1a1a1a] hover:bg-neon-yellow hover:text-black transition-all"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t-4 border-black bg-black px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-white/60 font-bold">
            QueueStorm Ticket Sorter &mdash; bKash SUST CSE Carnival 2026
          </span>
          <Link href="/" className="font-mono text-white/40 hover:text-white/70 transition-colors">
            ← Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
