/**
 * The secrets a configured band needs, as shell commands for the person to run themselves. Nothing here ever
 * holds a value: keys and tokens are read from a hidden prompt (`read -rs`) into a variable that is unset straight
 * after, so they are not typed into the chat, not written to a file and not left in shell history. Values that are
 * not secret (the P1 site id, the P1 base URL) are passed as arguments.
 *
 * --type=env --scope=web is required for a value to reach process.env at build and runtime. --rebuild is only on the
 * per-environment keys: a site-level `secret:site:set ... --rebuild` hits a PHP fatal in the current Terminus, so the
 * site-level values are set without it and the environments are rebuilt once at the end (the checklist says so).
 */
import type { Answers } from "./answers";

export type SecretStep = { where: "Pantheon" | "GitHub"; what: string; command: string };

const P1_BASE_URL = "https://ccr.p1.pantheon.io";

// The prompt is printed on its own and then a plain `read -rs V`: `read -p` means "prompt" in bash but "coprocess" in zsh, so it would
// silently do nothing for a zsh user. This form works in both.
const prompted = (label: string, run: string) => `printf '%s' "${label}: " && read -rs V && echo && ${run.replace("VALUE", '"$V"')}; unset V`;

export function secretsChecklist(a: Answers): SecretStep[] {
  const site = a.hosting?.pantheonSite;
  const p1 = a.hosting?.p1SiteId;
  const steps: SecretStep[] = [];
  const terminus = (target: string, name: string, value: string, extra = "") =>
    `terminus secret:site:set ${target} ${name} ${value} --type=env --scope=web${extra}`;

  if (site) {
    if (p1) {
      steps.push({ where: "Pantheon", what: "P1 site id (not secret)", command: terminus(site, "NEXT_PUBLIC_CSS_SITE_ID", p1) });
    }
    steps.push({ where: "Pantheon", what: "P1 backend URL (not secret)", command: terminus(site, "NEXT_PUBLIC_CSS_BASE_URL", P1_BASE_URL) });
    // The drafts key belongs on dev and test only. Live gets the published-only key, so a live request can never read drafts.
    for (const env of ["dev", "test"]) {
      steps.push({
        where: "Pantheon",
        what: `P1 drafts key on ${env}`,
        command: prompted("P1 drafts API key", terminus(`${site}.${env}`, "CSS_API_KEY", "VALUE", " --rebuild")),
      });
    }
    steps.push({
      where: "Pantheon",
      what: "P1 published-only key on live",
      command: prompted("P1 published-only API key", terminus(`${site}.live`, "CSS_API_KEY_LIVE", "VALUE", " --rebuild")),
    });
    if (a.audio?.baseUrl) {
      steps.push({ where: "Pantheon", what: "Audio base URL (not secret)", command: terminus(site, "NEXT_PUBLIC_AUDIO_BASE_URL", a.audio.baseUrl) });
      for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
        steps.push({
          where: "Pantheon",
          what: `Audio bucket: ${name} (read-only token)`,
          command: prompted(name, terminus(site, name, "VALUE")),
        });
      }
    }
    steps.push({ where: "GitHub", what: "Pantheon machine token, for Actions", command: "gh secret set PANTHEON_MACHINE_TOKEN" });
    steps.push({ where: "GitHub", what: "Pantheon machine token, for Dependabot runs", command: "gh secret set PANTHEON_MACHINE_TOKEN --app dependabot" });
  }

  if (p1) {
    steps.push({ where: "GitHub", what: "P1 base URL, for the registry sync (not secret)", command: `gh secret set CSS_BASE_URL --body ${P1_BASE_URL}` });
    steps.push({ where: "GitHub", what: "P1 site id, for the registry sync (not secret)", command: `gh secret set CSS_SITE_ID --body ${p1}` });
    steps.push({ where: "GitHub", what: "P1 component-registry sync token (never the read key)", command: "gh secret set CSS_REGISTRY_API_KEY" });
  }
  return steps;
}

/** The checklist as text for the terminal. Commands only; `gh secret set NAME` prompts for the value itself. */
export function formatChecklist(steps: SecretStep[]): string {
  if (!steps.length) return "No hosting recorded yet, so there is nothing to set. Re-run the hosting questions once the Pantheon site exists.";
  const lines: string[] = ["Run these yourself, in your own terminal (not in the chat). Values are read from a hidden prompt and never printed:", ""];
  for (const where of ["Pantheon", "GitHub"] as const) {
    const group = steps.filter((s) => s.where === where);
    if (!group.length) continue;
    lines.push(`# ${where}`);
    for (const s of group) lines.push(`# ${s.what}`, s.command, "");
  }
  lines.push("# Then rebuild every environment so the new values apply (secrets only take effect after a rebuild): the Pantheon MCP's pantheon_rebuild_site, or push a commit.");
  return lines.join("\n").trimEnd();
}
