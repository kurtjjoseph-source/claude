import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Headgate — water rights diligence for land buyers",
    template: "%s · Headgate",
  },
  description:
    "Screen land with water rights before you spend money on it. State-by-state doctrine, a deterministic risk engine, and an AI-authored acquisition plan.",
};

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 6v12M20 6v12M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 10.5c1.4 0 1.4 1.2 2.7 1.2s1.3-1.2 2.7-1.2 1.4 1.2 2.7 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 14c1.4 0 1.4 1.2 2.7 1.2s1.3-1.2 2.7-1.2 1.4 1.2 2.7 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="no-print sticky top-0 z-40 backdrop-blur" style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", borderBottom: "1px solid var(--line)" }}>
            <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span style={{ color: "var(--accent)" }}>
                  <Mark />
                </span>
                Headgate
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link href="/start" className="px-3 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]">
                  First purchase
                </Link>
                <Link href="/wizard" className="px-3 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]">
                  Screen a parcel
                </Link>
                <Link href="/opportunities" className="px-3 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]">
                  Where to buy
                </Link>
                <Link href="/doctrine" className="px-3 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]">
                  Jurisdictions
                </Link>
                <Link href="/portfolio" className="px-3 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]">
                  Portfolio
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="no-print mt-16" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="mx-auto max-w-6xl px-5 py-8 text-sm" style={{ color: "var(--fg-muted)" }}>
              <p className="max-w-3xl">
                <strong style={{ color: "var(--fg)" }}>Not legal advice.</strong> Headgate is a diligence-routing tool. Water
                law is state-specific, statutory periods change, and the facts that decide a deal live in agency records and
                the chain of title — not in a questionnaire. Every output here is a starting point for work done by water
                counsel and a licensed engineer in the state where the land sits.
              </p>
              <p className="mt-3">Verify everything against the agency of record before you spend money.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
