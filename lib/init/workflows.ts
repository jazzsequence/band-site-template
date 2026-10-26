/**
 * Turns the inactive examples in examples/workflows/ into live workflows for one site. Pure text transforms, so they
 * can be tested against the real files and applied by the init script.
 */

/** Sets the Pantheon site name wherever a workflow declares it. Throws if the file does not declare one. */
export function setPantheonSiteName(yaml: string, site: string): string {
  if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(site)) throw new Error(`Not a Pantheon site machine name: ${site}`);
  if (!/^\s*PANTHEON_SITE_NAME:/m.test(yaml)) throw new Error("workflow declares no PANTHEON_SITE_NAME");
  return yaml.replace(/^(\s*PANTHEON_SITE_NAME:\s*).*$/m, `$1${site}`);
}

/**
 * Replaces the "EXAMPLE, NOT ACTIVE" install instructions at the top of an example with a note that it is installed,
 * keeping the paragraphs after it (which explain what the workflow does). Throws if the file no longer has the shape this expects.
 */
export function activateExample(yaml: string): string {
  const lines = yaml.split("\n");
  const start = lines.findIndex((l) => l.startsWith("# EXAMPLE, NOT ACTIVE."));
  const end = lines.findIndex((l, i) => i > start && /^# (Optional:|What it does:)/.test(l));
  if (start < 0 || end < 0) throw new Error("example workflow is missing its EXAMPLE header or the paragraph after it");
  return [...lines.slice(0, start), "# Installed from examples/workflows/ by /init-band.", "#", ...lines.slice(end)].join("\n");
}
