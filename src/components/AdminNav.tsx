import Link from "next/link";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

export function AdminNav({ lang, active }: { lang: Lang; active: string }) {
  const T = translator(lang);
  const tabs: [string, string][] = [
    ["/beheer", T("overview")],
    ["/beheer/gebruikers", T("users")],
    ["/beheer/uitnodigingen", T("invitations")],
    ["/beheer/errata", T("errata")],
  ];
  return (
    <nav className="no-print flex flex-wrap gap-2 border-b border-[var(--color-rule)] pb-3 text-sm">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href}
              className={`rounded px-3 py-1 ${
                href === active
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-accent)]"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
