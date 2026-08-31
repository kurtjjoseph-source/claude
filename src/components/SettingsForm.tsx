"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang, Settings } from "@/lib/types";
import { translator } from "@/lib/i18n";

/** Reading preferences. Each change is saved immediately. */
export function SettingsForm({ settings, lang }: { settings: Settings; lang: Lang }) {
  const T = translator(lang);
  const router = useRouter();
  const [values, setValues] = useState(settings);
  const [saved, setSaved] = useState(false);

  async function update(patch: Partial<Settings>) {
    const next = { ...values, ...patch };
    setValues(next);
    await fetch("/api/settings", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (patch.lang) document.cookie =
      `lang=${patch.lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setSaved(true);
    router.refresh();
  }

  const row = "flex items-center justify-between gap-4 py-2";
  const select = "rounded border border-[var(--color-rule)] bg-transparent px-2 py-1 text-sm";

  return (
    <div className="divide-y divide-[var(--color-rule)] text-sm">
      <label className={row}>
        <span className="font-medium">{T("language")}</span>
        <select className={select} value={values.lang}
                onChange={(e) => update({ lang: e.target.value as Lang })}>
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
        </select>
      </label>

      <label className={row}>
        <span>
          <span className="font-medium">{T("showBothLangs")}</span>
          <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
            {lang === "nl"
              ? "Toont de andere taal cursief onder elke alinea."
              : "Shows the other language in italics under each paragraph."}
          </span>
        </span>
        <input type="checkbox" checked={values.bilingual} className="size-4"
               onChange={(e) => update({ bilingual: e.target.checked })} />
      </label>

      <label className={row}>
        <span className="font-medium">{T("theme")}</span>
        <select className={select} value={values.theme}
                onChange={(e) => update({ theme: e.target.value as Settings["theme"] })}>
          <option value="system">{lang === "nl" ? "Systeem" : "System"}</option>
          <option value="light">{lang === "nl" ? "Licht" : "Light"}</option>
          <option value="dark">{lang === "nl" ? "Donker" : "Dark"}</option>
        </select>
      </label>

      <label className={row}>
        <span className="font-medium">{T("textSize")}</span>
        <input type="range" min={0.9} max={1.4} step={0.05} value={values.fontScale}
               onChange={(e) => update({ fontScale: Number(e.target.value) })} />
      </label>

      {saved && (
        <p className="pt-2 text-xs text-[var(--color-muted)]">
          {lang === "nl" ? "Opgeslagen." : "Saved."}
        </p>
      )}
    </div>
  );
}
