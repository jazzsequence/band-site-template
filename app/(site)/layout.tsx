import type { Metadata, Viewport } from "next";

import { Header } from "../../components/site/chrome";
import { PlayerProvider } from "../../components/site/player";
import { SiteFooter } from "../../design-system/components/SiteFooter";
import "../../design-system/fonts";
import { band } from "../../lib/band/config";
import { SITE_NAME, SITE_URL } from "../../lib/site/seo";
import { palette } from "../../lib/theme/site-palette";
import "./site.css";

export const viewport: Viewport = { themeColor: palette.void, colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: band.description,
  applicationName: SITE_NAME,
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
