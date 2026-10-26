/**
 * A path under someone's home directory is wrong in every other checkout, and in a template it ends up in every repo made from
 * it. The reviewer files once named the owner's checkout as the place to write the approval flag, so each commit in a derived repo
 * would have been blocked. Tracked files name paths relative to the repository root instead.
 */
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// /Users/<name>/ and /home/<name>/. `/home/runner/` is the GitHub Actions runner's home, which workflows may legitimately name.
const HOME_PATH = /\/(?:Users|home)\/(?!runner\/)[A-Za-z0-9._-]+\//;

// Files allowed to hold one, and why. This list should stay empty or shrink.
const ALLOWED: Record<string, string> = {
  ".claude/settings.json": "a permission rule naming the owner's checkout; waiting on the owner's decision (make it relative, or drop it)",
};

const SELF = "__tests__/no-absolute-paths.test.ts";
const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf-8" })
  .split("\0")
  .filter((f) => f && f !== SELF && f !== "pnpm-lock.yaml" && !/\.(png|jpe?g|webp|woff2?|ico|m4a|gif)$/i.test(f));

const read = (f: string) => {
  try {
    return readFileSync(resolve(root, f), "utf-8");
  } catch {
    return "";
  }
};

describe("the guard pattern", () => {
  it.each(["/Users/someone/projects/band/x", "/home/someone/project/y", "cd /Users/a/b"])("flags %s", (s) => {
    expect(s).toMatch(HOME_PATH);
  });

  it.each(["/home/runner/.cache/ms-playwright", "src/Users/list.ts", "https://example.com/users/profile/", "/usr/local/bin/terminus"])("leaves %s alone", (s) => {
    expect(s).not.toMatch(HOME_PATH);
  });
});

describe("tracked files", () => {
  it("scans something", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("name no path under a home directory, outside the justified allowlist", () => {
    const offenders = files.filter((f) => !(f in ALLOWED) && HOME_PATH.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("keep the allowlist honest: each entry exists and still needs it", () => {
    for (const f of Object.keys(ALLOWED)) {
      expect(files, `${f} is allowlisted but not tracked`).toContain(f);
      expect(read(f), `${f} no longer holds a home path: remove it from ALLOWED`).toMatch(HOME_PATH);
    }
  });
});
