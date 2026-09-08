"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "@/lib/content";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

type Props = {
  chapterId: string;
  blocks: Block[];
  lang: Lang;
  bilingual: boolean;
  /** One printed page at a time, rather than the whole chapter in one scroll. */
  paged: boolean;
  alreadyRead: number[];
  done: boolean;
  /** Block index to open at and highlight, e.g. the source of an exam answer. */
  highlight?: number;
};

/**
 * Renders a chapter and records what has been read.
 *
 * Pagination follows the printed pages of the study guide rather than an
 * arbitrary block count. Every block already carries the page it was set on, so
 * a "page" here is the same page a candidate would be looking at in the book —
 * which also means the page numbers cited by the answer key line up with what
 * is on screen.
 *
 * Progress is observed rather than asked for: a page counts as read once it has
 * been on screen long enough to have been read, and newly read blocks are
 * batched and flushed rather than posted one by one.
 */
export function Reader({
  chapterId, blocks, lang, bilingual, paged, alreadyRead, done, highlight,
}: Props) {
  const T = translator(lang);

  // Group blocks into the guide's own printed pages, preserving order.
  const pages = useMemo(() => {
    const out: { page: number; blocks: Block[] }[] = [];
    for (const b of blocks) {
      const last = out[out.length - 1];
      if (last && last.page === b.page) last.blocks.push(b);
      else out.push({ page: b.page, blocks: [b] });
    }
    return out;
  }, [blocks]);

  const pageOfBlock = useCallback((index: number) => {
    const at = pages.findIndex((p) => p.blocks.some((b) => b.index === index));
    return at < 0 ? 0 : at;
  }, [pages]);

  const [at, setAt] = useState(() => (highlight === undefined ? 0 : pageOfBlock(highlight)));
  const [read, setRead] = useState<Set<number>>(() => new Set(alreadyRead));
  const [complete, setComplete] = useState(done);
  const pending = useRef<Set<number>>(new Set());
  const top = useRef<HTMLDivElement>(null);

  /* ----------------------------------------------------------- persistence */
  const flush = useCallback(async () => {
    if (pending.current.size === 0) return;
    const batch = [...pending.current];
    pending.current.clear();
    await fetch("/api/progress", {
      method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
      body: JSON.stringify({ chapterId, read: batch }),
    }).catch(() => { batch.forEach((i) => pending.current.add(i)); });
  }, [chapterId]);

  useEffect(() => {
    const timer = setInterval(() => { void flush(); }, 6000);
    const onHide = () => { void flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void flush();
    };
  }, [flush]);

  /* Mark the visible page read after a dwell, so flicking through a chapter
     does not credit pages that were never actually read. */
  const current = pages[at];
  useEffect(() => {
    if (!paged || !current) return;
    const timer = setTimeout(() => {
      setRead((prev) => {
        const next = new Set(prev);
        for (const b of current.blocks) {
          if (!next.has(b.index)) { next.add(b.index); pending.current.add(b.index); }
        }
        return next;
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, [paged, current]);

  /* In continuous mode, count blocks as they scroll past instead. */
  const nodes = useRef(new Map<number, HTMLElement>());
  useEffect(() => {
    if (paged) return;
    const observer = new IntersectionObserver((entries) => {
      const seen: number[] = [];
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const idx = Number((e.target as HTMLElement).dataset.block);
        if (!Number.isNaN(idx)) { seen.push(idx); observer.unobserve(e.target); }
      }
      if (!seen.length) return;
      setRead((prev) => {
        const next = new Set(prev);
        for (const i of seen) if (!next.has(i)) { next.add(i); pending.current.add(i); }
        return next;
      });
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0.1 });
    for (const [idx, node] of nodes.current) if (!read.has(idx)) observer.observe(node);
    return () => observer.disconnect();
    // Re-observing on every read would thrash; blocks are unobserved as counted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paged]);

  /* ------------------------------------------------------------ navigation */
  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, pages.length - 1));
    setAt(clamped);
    const url = new URL(window.location.href);
    url.searchParams.set("p", String(pages[clamped]?.page ?? ""));
    url.searchParams.delete("blok");
    window.history.replaceState(null, "", url);
    top.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [pages]);

  useEffect(() => {
    if (!paged) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paged, at, go]);

  useEffect(() => {
    if (highlight === undefined) return;
    const node = nodes.current.get(highlight);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight, at]);

  async function toggleDone() {
    const next = !complete;
    setComplete(next);
    await fetch("/api/progress", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId, done: next }),
    });
  }

  const fraction = complete ? 1 : blocks.length ? read.size / blocks.length : 0;
  const visible = paged && current ? current.blocks : blocks;

  return (
    <>
      <div ref={top} className="scroll-mt-24" />

      <div className="no-print sticky top-14 z-20 -mx-4 mb-6 border-b border-[var(--color-rule)]
                      bg-[var(--color-paper)]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-rule)]">
            <div className="h-full bg-[var(--color-accent)] transition-[width] duration-300"
                 style={{ width: `${Math.round(fraction * 100)}%` }} />
          </div>
          <span className="tabular-nums text-xs text-[var(--color-muted)]">
            {Math.round(fraction * 100)}%
          </span>
          <button onClick={toggleDone}
                  className={`shrink-0 rounded border px-2 py-1 text-xs font-medium ${
                    complete
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border-[var(--color-rule)] text-[var(--color-muted)]"}`}>
            {complete ? T("chapterDone") : T("markRead")}
          </button>
        </div>
      </div>

      <article key={at} className={`prose-course max-w-[62ch] ${paged ? "page-enter" : ""}`}>
        {visible.map((b) => (
          <BlockView key={b.index} block={b} lang={lang} bilingual={bilingual}
                     highlighted={b.index === highlight} notTranslated={T("notTranslated")}
                     register={(el) => { if (el) nodes.current.set(b.index, el); }} />
        ))}
      </article>

      {paged && pages.length > 1 && (
        <PageNav pages={pages} at={at} go={go} lang={lang} />
      )}
    </>
  );
}

function PageNav({ pages, at, go, lang }: {
  pages: { page: number; blocks: Block[] }[];
  at: number; go: (n: number) => void; lang: Lang;
}) {
  const T = translator(lang);
  const current = pages[at];
  return (
    <nav className="no-print mt-10 flex flex-wrap items-center gap-3 border-t
                    border-[var(--color-rule)] pt-4 text-sm">
      <button onClick={() => go(at - 1)} disabled={at === 0}
              className="rounded border border-[var(--color-rule)] px-3 py-1.5 font-medium
                         disabled:opacity-40">
        ← {T("previous")}
      </button>

      <label className="flex items-center gap-2 text-[var(--color-muted)]">
        <span className="text-xs">{T("page")}</span>
        <select value={at} onChange={(e) => go(Number(e.target.value))}
                className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1 text-sm">
          {pages.map((p, i) => (
            <option key={p.page} value={i}>{p.page}</option>
          ))}
        </select>
        <span className="text-xs tabular-nums">
          ({at + 1} {T("of")} {pages.length})
        </span>
      </label>

      <button onClick={() => go(at + 1)} disabled={at >= pages.length - 1}
              className="ml-auto rounded bg-[var(--color-accent)] px-3 py-1.5 font-medium text-white
                         disabled:opacity-40">
        {T("next")} →
      </button>
      <span className="sr-only">{current ? `${T("page")} ${current.page}` : ""}</span>
    </nav>
  );
}

function BlockView({ block, lang, bilingual, highlighted, notTranslated, register }: {
  block: Block; lang: Lang; bilingual: boolean; highlighted: boolean;
  notTranslated: string; register: (el: HTMLElement | null) => void;
}) {
  const primary = lang === "nl" ? (block.nl ?? block.en) : block.en;
  const fellBack = lang === "nl" && !block.nl;
  const secondary = bilingual ? (lang === "nl" ? block.en : block.nl) : null;

  // Indentation carries nesting depth for body text, but a centred title in the
  // PDF also reports a large x-offset — which would indent headings for no
  // reason. Only the running text is indented.
  const indented = block.type === "p" || block.type === "quote" || block.type === "note";
  const style = indented ? { marginLeft: `${Math.min(block.indent, 4) * 0.9}rem` } : undefined;
  const attrs = {
    "data-block": block.index,
    ref: (el: HTMLElement | null) => register(el),
    style,
  } as const;
  const cls = highlighted ? "block-target" : "";

  const body = (
    <>
      {primary}
      {fellBack && (
        <span className="ml-2 align-middle text-[0.7em] uppercase tracking-wide
                         text-[var(--color-muted)]" title={notTranslated}>· EN</span>
      )}
      {secondary && (
        <span className="mt-1 block text-[0.9em] italic text-[var(--color-muted)]">{secondary}</span>
      )}
    </>
  );

  switch (block.type) {
    case "h1":
      return <h2 {...attrs} className={`${cls} mt-10 text-xl font-semibold`}>{body}</h2>;
    case "h2":
      return <h3 {...attrs} className={`${cls} mt-8 font-semibold`}>{body}</h3>;
    case "h3":
      return <h4 {...attrs} className={`${cls} mt-6 font-medium`}>{body}</h4>;
    case "quote":
      return <blockquote {...attrs} className={`${cls} quote my-4`}>{body}</blockquote>;
    case "note":
      return <p {...attrs} className={`${cls} mt-4 text-sm text-[var(--color-muted)]`}>{body}</p>;
    default:
      return <p {...attrs} className={cls}>{body}</p>;
  }
}
