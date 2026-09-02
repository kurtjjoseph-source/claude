import type { Metadata } from "next";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Exhorter Studie",
  description: "Tweetalige studiegids voor het Exhorter licentie-examen van de Church of God",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const lang = await resolveLang(user);
  const theme = user?.settings.theme ?? "system";
  return (
    <html lang={lang} data-theme={theme === "system" ? undefined : theme}
          style={{ ["--font-scale" as string]: String(user?.settings.fontScale ?? 1) }}>
      <body>
        <Shell user={user} lang={lang}>{children}</Shell>
      </body>
    </html>
  );
}
