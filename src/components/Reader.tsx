"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "@/lib/content";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

type Props = {
  chapterId: string;
  blocks: Block[];
  lang: Lang;
  bilingual: boolean;
  alreadyRead: number[];
  done: boolean;
  /** Block index to highlight, e.g. the source of an exam answer. */
  highlight?: number;
};

/**
 * Renders a chapter and records what has been read.
 *
 * Progress is observed rather than asked for: a paragraph counts as read once
 * it has been on screen. Newly read indices are batched and flushed rather than
 * posted one by one, so scrolling a long chapter costs a couple of requests.
 */
export function Reader({ chapterId, blocks, lang, bilingual, alreadyRead, done, highlight }: Props) {
  const T = translator(lang);
  const [read, setRead] = useState<Set<number>>(() => new Set(alreadyRead));
  const [complete, setComplete] = useState(done);
  const pending = useRef<Set<number>>(new Set());
  const nodes = useRef(new Map<number, HTMLElement>());

  // Flush newly read blocks on a timer and when the page is being left.
  useEffect(() => {
    async function flush() {
      if (pending.current.size === 0) return;
      const batch = [...pending.current];
      pending.current.clear();
      await fetch("/api/progress", {
        method: "POST", headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ chapterId, read: batch }),
      }).catch(() => { batch.forEach((i) => pending.current.add(i)); });
    }
    const timer = setInterval(flush, 6000);
    const onHide = () => { void flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void flush();
    };
  }, [chapterId]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      let changed = false;
      const next = new Set(read);
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = Number((entry.target as HTMLElement).dataset.block);
        if (Number.isNaN(idx) || next.has(idx)) continue;
        next.add(idx);
        pending.current.add(idx);
        changed = true;
        observer.unobserve(entry.target);
      }
      if (changed) setRead(next);
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0.1 });

    for (const [idx, node] of nodes.current) {
      if (!read.has(idx)) observer.observe(node);
    }
    return () => observer.disconnect();
    // `read` is intentionally excluded: re-observing on every scroll would
    // thrash. Blocks are unobserved individually as they are counted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bring the highlighted block into view once rendered.
  useEffect(() => {
    if (highlight === undefined) return;
    nodes.current.get(highlight)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  async function toggleDone() {
    const next = !complete;
    setComplete(next);
    await fetch("/api/progress", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId, done: next }),
    });
  }

  const fraction = useMemo(
    () => (complete ? 1 : blocks.length ? read.size / blocks.length : 0),
    [complete, read.size, blocks.length]);

  return (
    <>
      <div className="no-print sticky top-14 z-20 -mx-4 mb-6 border-b border-[var(--color-rule)]
                      bg-[var(--color-paper)]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-rule)]">
            <div className="h-full bg-[var(--color-accent)] transition-[width] duration-300"
                 style={{ width: `${Math.round(fraction * 100)}%` }} />
          </div>
          <span className="tabular-nums text-xs text-[var(--color-muted)]">
            {Math.round(fraction * 100)}%
          </span>
          <button onClick={toggleDone}
                  className={`rounded border px-2 py-1 text-xs font-medium ${
                    complete
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border-[var(--color-rule)] text-[var(--color-muted)]"}`}>
            {complete ? T("chapterDone") : T("markRead")}
          </button>
        </div>
      </div>

      <article className="prose-course max-w-[68ch]">
        {blocks.map((b) => (
          <BlockView key={b.index} block={b} lang={lang} bilingual={bilingual}
                     highlighted={b.index === highlight} notTranslated={T("notTranslated")}
                     register={(el) => { if (el) nodes.current.set(b.index, el); }} />
        ))}
      </article>
    </>
  );
}

function BlockView({ block, lang, bilingual, highlighted, notTranslated, register }: {
  block: Block; lang: Lang; bilingual: boolean; highlighted: boolean;
  notTranslated: string; register: (el: HTMLElement | null) => void;
}) {
  const primary = lang === "nl" ? (block.nl ?? block.en) : block.en;
  const fellBack = lang === "nl" && !block.nl;
  const secondary = bilingual
    ? (lang === "nl" ? block.en : block.nl)
    : null;

  const common = `${highlighted ? "block-target" : ""}`;
  const style = { marginLeft: `${Math.min(block.indent, 4) * 0.9}rem` };
  const ref = (el: HTMLElement | null) => register(el);
  const attrs = { "data-block": block.index, ref, style, className: common } as const;

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
      return <h2 {...attrs} className={`${common} mt-10 text-xl font-semibold`}>{body}</h2>;
    case "h2":
      return <h3 {...attrs} className={`${common} mt-8 font-semibold`}>{body}</h3>;
    case "h3":
      return <h4 {...attrs} className={`${common} mt-6 font-medium`}>{body}</h4>;
    case "quote":
      return <blockquote {...attrs} className={`${common} quote my-4`}>{body}</blockquote>;
    case "note":
      return <p {...attrs} className={`${common} mt-4 text-sm text-[var(--color-muted)]`}>{body}</p>;
    default:
      return <p {...attrs} className={common}>{body}</p>;
  }
}
