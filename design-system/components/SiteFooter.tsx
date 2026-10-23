import { band, features } from "../../lib/band/config";
import { AppLink } from "./AppLink";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="space-y-3 border-t border-line px-6 py-10 text-sm text-muted">
      <Wordmark />
      {band.imprint && <p>{band.imprint}</p>}
      <p className="text-dim">
        © {band.copyrightYear} {band.name}. All rights reserved.
      </p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6">
        {features.press && (
          <AppLink href="/press/kit" className="inline-block py-2 underline underline-offset-4 hover:text-text">
            Press kit
          </AppLink>
        )}
        {band.social.map((s) => (
          <a key={s.url} href={s.url} rel="noopener" className="inline-block py-2 underline underline-offset-4 hover:text-text">
            {s.label}
          </a>
        ))}
        <AppLink href="/privacy" className="inline-block py-2 underline underline-offset-4 hover:text-text">
          Privacy
        </AppLink>
      </nav>
    </footer>
  );
}
