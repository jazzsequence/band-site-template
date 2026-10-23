import type { Metadata, Viewport } from "next";

import { Header } from "../../components/site/chrome";
import { PlayerProvider } from "../../components/site/player";
import { SiteFooter } from "../../design-system/components/SiteFooter";
import "../../design-system/fonts";
import { SITE_URL } from "../../lib/site/seo";
import "./site.css";

export const viewport: Viewport = { themeColor: "#07050d", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PARIS", template: "%s · PARIS" },
  description: "PARIS: tour dates, music, lyrics and the new album Well Enough.",
  applicationName: "PARIS",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-void font-body text-text">
      <PlayerProvider>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </PlayerProvider>
    </div>
  );
}
