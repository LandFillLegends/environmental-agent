#!/usr/bin/env node
/**
 * SAFE cleanup script for Landfill Legends (Expo Router + TS)
 *
 * What it does:
 * - Keeps: /app, /components, /constants, /store, package.json, tsconfig.json
 * - Optionally removes template leftovers: /hooks, /scripts/reset-project.js, /app-example, themed/template components you aren't using
 *
 * Usage:
 *   node scripts/cleanup-template.js        (dry run)
 *   node scripts/cleanup-template.js --yes  (execute)
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const args = process.argv.slice(2);
const YES = args.includes("--yes") || args.includes("-y");
const DRY_RUN = !YES;

const safeKeep = new Set([
  "app",
  "components",
  "constants",
  "store",
  "assets",
  "node_modules",
  ".expo",
  ".git",
]);

// Things we typically want gone after migrating off the template:
const removeTargets = [
  "app-example", // if it exists
  "hooks",       // template theme hooks
  path.join("scripts", "reset-project.js"), // the dangerous one
];

// Optional: remove template components (only if you are NOT using them)
const optionalComponentTargets = [
  path.join("components", "external-link.tsx"),
  path.join("components", "parallax-scroll-view.tsx"),
  path.join("components", "themed-text.tsx"),
  path.join("components", "themed-view.tsx"),
  path.join("components", "ui", "collapsible.tsx"),
];

// --- helpers
function exists(p) {
  return fs.existsSync(path.join(root, p));
}

async function rm(target) {
  const full = path.join(root, target);
  if (!fs.existsSync(full)) {
    console.log(`↷ skip (missing): ${target}`);
    return;
  }
  if (DRY_RUN) {
    console.log(`🧪 would remove: ${target}`);
    return;
  }
  await fs.promises.rm(full, { recursive: true, force: true });
  console.log(`✅ removed: ${target}`);
}

async function main() {
  console.log(`\nLandfill Legends cleanup (${DRY_RUN ? "DRY RUN" : "EXECUTE"})\n`);

  // Sanity check: ensure we are in a project root that has package.json
  if (!exists("package.json")) {
    console.error("❌ package.json not found. Run this from your project root.");
    process.exit(1);
  }

  console.log("Will NOT touch these core folders if present:");
  for (const k of safeKeep) {
    if (exists(k)) console.log(`  ✅ keep: ${k}`);
  }

  console.log("\nRemoving template leftovers:");
  for (const t of removeTargets) {
    await rm(t);
  }

  console.log("\nOptional template components (remove if unused):");
  for (const t of optionalComponentTargets) {
    await rm(t);
  }

  console.log("\nNext steps:");
  console.log("1) Ensure your imports use '@/...' (tsconfig paths).");
  console.log("2) Run: npx expo start -c");
  console.log(
    DRY_RUN
      ? "\nRun again with --yes to actually delete files:\n  node scripts/cleanup-template.js --yes\n"
      : ""
  );
}

main().catch((err) => {
  console.error(`❌ Error: ${err?.message ?? err}`);
  process.exit(1);
});