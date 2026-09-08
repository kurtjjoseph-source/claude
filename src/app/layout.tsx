import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { Shell } from "@/components/Shell";

/**
 * Two typefaces chosen for long-form reading on screen rather than left to
 * whatever serif the reader's machine happens to have: Literata was drawn for
 * screen reading and holds up at small sizes, Inter is a humanist sans for
 * readers who find serifs tiring. The student picks between them in Profiel.
 */
const literata = Literata({
  subsets: ["latin"], display: "swap", variable: "--font-reading-serif",
});
const inter = Inter({
  subsets: ["latin"], display: "swap", variable: "--font-reading-sans",
});

export const metadata: Metadata = {
  title: "Exhorter Studie",
  description: "Tweetalige studiegids voor het Exhorter licentie-examen van de Church of God",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const lang = await resolveLang(user);
  const theme = user?.settings.theme ?? "system";
  const typeface = user?.settings.typeface ?? "serif";
  return (
    <html lang={lang}
          className={`${literata.variable} ${inter.variable}`}
          data-theme={theme === "system" ? undefined : theme}
          data-typeface={typeface}
          style={{ ["--font-scale" as string]: String(user?.settings.fontScale ?? 1) }}>
      <body>
        <Shell user={user} lang={lang}>{children}</Shell>
      </body>
    </html>
  );
}
