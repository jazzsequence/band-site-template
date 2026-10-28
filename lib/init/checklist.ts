/**
 * The secrets a configured band needs, as shell commands for the person to run themselves. Nothing here ever
 * holds a value: keys and tokens are read from a hidden prompt (`read -rs`) into a variable that is unset straight
 * after, so they are not typed into the chat, not written to a file and not left in shell history. Values that are
 * not secret (the P1 site id, the P1 base URL) are passed as arguments.
 *
 * --type=env --scope=web is required for a value to reach process.env at build and runtime. There is no --rebuild on any
 * step: a site-level `secret:site:set ... --rebuild` hits a PHP fatal in the current Terminus, so every value is set without
 * it and the environments are rebuilt once at the end (the checklist says so).
 *
 * Every secret is set once, on the site, never on an environment (`<site>.<env>`). A Pantheon secret has a base value (what
 * every environment gets) and optional values of an environment's own, and an environment cannot have its own until a base
 * exists. Setting the drafts key on dev and test therefore forced a base that had nothing real to hold, so a dummy went in
 * there, and every multidev, which has no value of its own, built with the dummy and could not sign in to P1. Nothing in
 * this file may ask for a value to be set that is not real: an unset secret is safe (a non-live build falls back to the
 * repo copies, live refuses to start), a stand-in is not.
 */
import type { Answers } from "./answers";

/** `source` is where the person gets the value (a dashboard path), printed under the step; steps whose value is the same for every site have none. */
export type SecretStep = { where: "Pantheon" | "GitHub"; what: string; command: string; source?: string };

const P1_BASE_URL = "https://ccr.p1.pantheon.io";

// Where each value comes from, checked against the vendors' docs (Pantheon personal access tokens, Cloudflare R2 API tokens and custom
// domains, the P1 dev guide). Tokens are shown once, so the person needs the prompt open when they create them.
const SOURCE = {
  p1SiteId: "P1 dashboard (content.pantheon.io): the site's ID, shown when the site is created and the last part of its dashboard URL.",
  p1Drafts: "P1 dashboard: generate a token for the site, scope 'All content including drafts'. It is shown once: create it with this prompt open.",
  p1Published: "P1 dashboard: generate a second token for the same site, scope published content only (no drafts). Shown once. Never reuse the drafts token here.",
  p1Registry: "P1 dashboard: a third token with the registry-sync scope (write:registry, no read access). Shown once. Never the read key.",
  audioUrl: "Cloudflare dashboard: R2 > your bucket > Settings > Custom Domains > Add. Use the custom domain, not the r2.dev URL (development only, rate-limited).",
  r2Account: "Cloudflare dashboard: press Ctrl/Cmd+K and search 'Copy account ID'.",
  r2Token: "Cloudflare dashboard: R2 object storage > Overview > Account Details > API Tokens > Manage > Create Account API token; permission 'Object Read only', scoped to this bucket. The key ID and secret are shown once.",
  r2Secret: "The secret access key shown together with the key ID when you created that token. Shown once, so copy both at the same time.",
  r2Bucket: "The bucket's name (R2 > Overview). It must be in the default location, not a jurisdiction (EU, FedRAMP): the site lists it at <account>.r2.cloudflarestorage.com, so a jurisdiction bucket would show every track as unavailable.",
  pantheonToken:
    "Pantheon dashboard > Personal Settings > Personal Access Tokens > Add token (docs.pantheon.io/personal-access-tokens). Shown once. A new token expires after 90 days, and the promote and deployed-site workflows then fail until it is replaced in both places; an older machine token does not expire.",
} as const;

// The prompt is printed on its own and then a plain `read -rs V`: `read -p` means "prompt" in bash but "coprocess" in zsh, so it would
// silently do nothing for a zsh user. This form works in both.
const prompted = (label: string, run: string) => `printf '%s' "${label}: " && read -rs V && echo && ${run.replace("VALUE", '"$V"')}; unset V`;

export function secretsChecklist(a: Answers): SecretStep[] {
  const site = a.hosting?.pantheonSite;
  const p1 = a.hosting?.p1SiteId;
  const steps: SecretStep[] = [];
  const terminus = (target: string, name: string, value: string) => `terminus secret:site:set ${target} ${name} ${value} --type=env --scope=web`;

  if (site) {
    if (p1) {
      steps.push({ where: "Pantheon", what: "P1 site id (not secret)", command: terminus(site, "NEXT_PUBLIC_CSS_SITE_ID", p1), source: SOURCE.p1SiteId });
    }
    steps.push({ where: "Pantheon", what: "P1 backend URL (not secret)", command: terminus(site, "NEXT_PUBLIC_CSS_BASE_URL", P1_BASE_URL) });
    // Live does not get the drafts key by omission: it gets it by code. lib/site/p1-key.ts reads CSS_API_KEY_LIVE on live, throws if
    // it is missing and copies it over CSS_API_KEY, so which environments hold a value does not decide which key a request uses.
    steps.push({
      where: "Pantheon",
      what: "P1 drafts key (every environment, multidevs included)",
      command: prompted("P1 drafts API key", terminus(site, "CSS_API_KEY", "VALUE")),
      source: SOURCE.p1Drafts,
    });
    steps.push({
      where: "Pantheon",
      what: "P1 published-only key (only the live environment reads it)",
      command: prompted("P1 published-only API key", terminus(site, "CSS_API_KEY_LIVE", "VALUE")),
      source: SOURCE.p1Published,
    });
    if (a.audio?.baseUrl) {
      steps.push({ where: "Pantheon", what: "Audio base URL (not secret)", command: terminus(site, "NEXT_PUBLIC_AUDIO_BASE_URL", a.audio.baseUrl), source: SOURCE.audioUrl });
      for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
        steps.push({
          where: "Pantheon",
          what: `Audio bucket: ${name} (read-only token)`,
          command: prompted(name, terminus(site, name, "VALUE")),
          source: { R2_ACCOUNT_ID: SOURCE.r2Account, R2_ACCESS_KEY_ID: SOURCE.r2Token, R2_SECRET_ACCESS_KEY: SOURCE.r2Secret, R2_BUCKET: SOURCE.r2Bucket }[name],
        });
      }
    }
    steps.push({ where: "GitHub", what: "Pantheon machine token, for Actions", command: "gh secret set PANTHEON_MACHINE_TOKEN", source: SOURCE.pantheonToken });
    steps.push({ where: "GitHub", what: "Pantheon machine token, for Dependabot runs", command: "gh secret set PANTHEON_MACHINE_TOKEN --app dependabot", source: "The same token as above: Dependabot runs see only Dependabot secrets, so it needs its own copy." });
  }

  if (p1) {
    steps.push({ where: "GitHub", what: "P1 base URL, for the registry sync (not secret)", command: `gh secret set CSS_BASE_URL --body ${P1_BASE_URL}` });
    steps.push({ where: "GitHub", what: "P1 site id, for the registry sync (not secret)", command: `gh secret set CSS_SITE_ID --body ${p1}` });
    steps.push({ where: "GitHub", what: "P1 component-registry sync token (never the read key)", command: "gh secret set CSS_REGISTRY_API_KEY", source: SOURCE.p1Registry });
  }
  return steps;
}

/** The checklist as text for the terminal. Commands only; `gh secret set NAME` prompts for the value itself. */
export function formatChecklist(steps: SecretStep[]): string {
  if (!steps.length) return "No hosting recorded yet, so there is nothing to set. Re-run the hosting questions once the Pantheon site exists.";
  const lines: string[] = [
    "Run these yourself, in your own terminal (not in the chat). Values are read from a hidden prompt and never printed.",
    "Create each token first: most are shown only once, so have the prompt open when you create it.",
    "Set every value for real or not at all. Never a stand-in to be replaced later: a dummy value gets built into every environment that has no value of its own.",
    "You need to be signed in to both CLIs: `terminus auth:login` (it prints the link to create a Pantheon token) and `gh auth login` (the token needs the `repo` scope, and you need access to this repository's secrets).",
    "",
  ];
  for (const where of ["Pantheon", "GitHub"] as const) {
    const group = steps.filter((s) => s.where === where);
    if (!group.length) continue;
    lines.push(`# ${where}`);
    for (const s of group) lines.push(`# ${s.what}`, ...(s.source ? [`#   Get it: ${s.source}`] : []), s.command, "");
  }
  lines.push("# Then rebuild every environment so the new values apply (secrets only take effect after a rebuild): the Pantheon MCP's pantheon_rebuild_site, or push a commit.");
  return lines.join("\n").trimEnd();
}
