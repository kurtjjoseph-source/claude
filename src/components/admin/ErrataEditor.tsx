"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Erratum, Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";
import { Badge } from "@/components/ui";

type EditableBlock = {
  index: number; type: string; page: number; en: string; nl: string | null;
};

/**
 * Block-level editor over the built course. An edit is stored as an erratum
 * keyed by chapter, block and language, so the underlying content files stay
 * the record of the source and corrections stay reviewable and reversible.
 */
export function ErrataEditor({ lang, chapters, chapter, errata, query }: {
  lang: Lang;
  chapters: { id: string; title: string; translated: number }[];
  chapter: { id: string; blocks: EditableBlock[] };
  errata: Erratum[];
  query: string;
}) {
  const T = translator(lang);
  const router = useRouter();
  const [filter, setFilter] = useState(query);
  const [editing, setEditing] = useState<{ index: number; lang: Lang } | null>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const edited = useMemo(() => {
    const map = new Map<string, Erratum>();
    for (const e of errata) map.set(`${e.lang}:${e.blockIndex}`, e);
    return map;
  }, [errata]);

  const blocks = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return chapter.blocks;
    return chapter.blocks.filter(
      (b) => b.en.toLowerCase().includes(q) || (b.nl ?? "").toLowerCase().includes(q));
  }, [chapter.blocks, filter]);

  function open(block: EditableBlock, which: Lang) {
    setEditing({ index: block.index, lang: which });
    setDraft(which === "en" ? block.en : (block.nl ?? ""));
    setNote(edited.get(`${which}:${block.index}`)?.note ?? "");
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    await fetch("/api/admin/errata", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId: chapter.id, blockIndex: editing.index,
                             lang: editing.lang, text: draft, note }),
    });
    setBusy(false); setEditing(null); router.refresh();
  }

  async function revert(id: string) {
    await fetch(`/api/admin/errata?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={chapter.id}
                onChange={(e) => router.push(`/beheer/errata?h=${e.target.value}`)}
                className="rounded border border-[var(--color-rule)] bg-transparent px-3 py-2 text-sm">
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — {Math.round(c.translated * 100)}% {T("translated")}
            </option>
          ))}
        </select>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={T("search")}
               className="min-w-48 flex-1 rounded border border-[var(--color-rule)] bg-transparent
                          px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]" />
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        {blocks.length} {lang === "nl" ? "alinea's" : "blocks"} · {errata.length} {T("errata").toLowerCase()}
      </p>

      <ul className="space-y-2">
        {blocks.map((b) => {
          const enEdit = edited.get(`en:${b.index}`);
          const nlEdit = edited.get(`nl:${b.index}`);
          const isEditing = editing?.index === b.index;
          return (
            <li key={b.index} className="rounded border border-[var(--color-rule)] p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                <span className="font-mono">#{b.index}</span>
                <span>{b.type}</span>
                <span>p{b.page}</span>
                {enEdit && <Badge tone="warn">EN {lang === "nl" ? "aangepast" : "edited"}</Badge>}
                {nlEdit && <Badge tone="warn">NL {lang === "nl" ? "aangepast" : "edited"}</Badge>}
                {!b.nl && <Badge>{lang === "nl" ? "niet vertaald" : "untranslated"}</Badge>}
                <span className="ml-auto flex gap-2">
                  <button onClick={() => open(b, "nl")}
                          className="rounded border border-[var(--color-rule)] px-2 py-0.5">
                    NL
                  </button>
                  <button onClick={() => open(b, "en")}
                          className="rounded border border-[var(--color-rule)] px-2 py-0.5">
                    EN
                  </button>
                  {(enEdit || nlEdit) && (
                    <button onClick={() => revert((enEdit ?? nlEdit)!.id)}
                            className="rounded border border-red-600/50 px-2 py-0.5 text-red-700
                                       dark:text-red-400">
                      {lang === "nl" ? "Herstel" : "Revert"}
                    </button>
                  )}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-accent)]">
                    {editing.lang === "nl" ? "Nederlands" : "English"}
                  </p>
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6}
                            className="w-full rounded border border-[var(--color-rule)] bg-transparent
                                       p-2 font-serif text-sm outline-none
                                       focus:border-[var(--color-accent)]" />
                  <input value={note} onChange={(e) => setNote(e.target.value)}
                         placeholder={lang === "nl" ? "Notitie (waarom deze correctie?)" : "Note (why this correction?)"}
                         className="w-full rounded border border-[var(--color-rule)] bg-transparent
                                    px-2 py-1 text-xs outline-none" />
                  <div className="flex gap-2">
                    <button onClick={save} disabled={busy}
                            className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium
                                       text-white disabled:opacity-60">{T("save")}</button>
                    <button onClick={() => setEditing(null)}
                            className="rounded border border-[var(--color-rule)] px-3 py-1.5 text-xs">
                      {T("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-serif">{b.nl ?? <span className="text-[var(--color-muted)]">—</span>}</p>
                  <p className="font-serif text-xs text-[var(--color-muted)]">{b.en}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
