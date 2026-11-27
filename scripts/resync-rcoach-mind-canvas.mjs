#!/usr/bin/env node
/**
 * Regenère le snapshot SPECS du canvas backlog mind (pas de LLM).
 *
 * Usage:
 *   node scripts/resync-rcoach-mind-canvas.mjs
 *   MIND_ROOT=... CANVAS_PATH=... node scripts/resync-rcoach-mind-canvas.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const MIND_ROOT = path.resolve(
  process.env.MIND_ROOT ?? path.join(REPO_ROOT, "..", "rcoach-mind"),
);
const CANVAS_PATH = path.resolve(
  process.env.CANVAS_PATH ??
    path.join(
      process.env.USERPROFILE ?? process.env.HOME ?? "",
      ".cursor",
      "projects",
      "c-Users-leobr-Documents-dev-rcoach-v2",
      "canvases",
      "rcoach-mind-backlog.canvas.tsx",
    ),
);

const INDEX_PATH = path.join(MIND_ROOT, "INDEX.md");

/** @typedef {"draft"|"accepted"|"done"|"deprecated"} MindStatus */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   status: MindStatus,
 *   domain: string,
 *   nhost: boolean,
 *   designSystem: boolean,
 *   offline: boolean,
 *   updated: string,
 * }} Spec
 */

function fail(message) {
  console.error(`resync-rcoach-mind-canvas: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    fail(`impossible de lire ${filePath}: ${err instanceof Error ? err.message : err}`);
  }
}

/** Extrait le bloc YAML `specs:` de INDEX.md (avant `decisions:`). */
function extractIndexSpecsYaml(indexMd) {
  const fence = indexMd.match(/```ya?ml\s*\n([\s\S]*?)```/);
  if (!fence) fail(`pas de fence yaml dans ${INDEX_PATH}`);
  const yaml = fence[1];
  const specsStart = yaml.indexOf("\nspecs:");
  const start = specsStart >= 0 ? specsStart + 1 : yaml.startsWith("specs:") ? 0 : -1;
  if (start < 0) fail("clé specs: introuvable dans INDEX.yaml");
  const fromSpecs = yaml.slice(start);
  const decisionsAt = fromSpecs.search(/\ndecisions:\s*\n/);
  return decisionsAt >= 0 ? fromSpecs.slice(0, decisionsAt) : fromSpecs;
}

/**
 * Parse minimal des entrées `- id:` sous specs (champs plats seulement).
 * @returns {Array<Record<string, string>>}
 */
function parseIndexSpecEntries(specsYaml) {
  const lines = specsYaml.split(/\r?\n/);
  /** @type {Array<Record<string, string>>} */
  const entries = [];
  /** @type {Record<string, string>|null} */
  let current = null;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");
    const idMatch = line.match(/^\s*-\s+id:\s*(.+)\s*$/);
    if (idMatch) {
      if (current?.id) entries.push(current);
      current = { id: stripScalar(idMatch[1]) };
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^\s{2,}([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2];
    if (value.startsWith("[") || value === "" || value === "|" || value === ">") continue;
    current[key] = stripScalar(value);
  }
  if (current?.id) entries.push(current);
  return entries.filter((e) => Boolean(e.id) && Boolean(e.path?.startsWith("specs/")));
}

function stripScalar(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/** @returns {Record<string, string|boolean>|null} */
function parseFrontmatter(specMd) {
  if (!specMd.startsWith("---\n") && !specMd.startsWith("---\r\n")) return null;
  const end = specMd.indexOf("\n---", 3);
  if (end < 0) return null;
  const body = specMd.slice(4, end);
  /** @type {Record<string, string|boolean>} */
  const out = {};
  for (const raw of body.split(/\r?\n/)) {
    const m = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2].trim();
    if (value.startsWith("[") || value === "" || value === "|" || value === ">") continue;
    if (value === "true" || value === "false") {
      out[key] = value === "true";
      continue;
    }
    out[key] = stripScalar(value);
  }
  return out;
}

/** @param {unknown} status @returns {MindStatus} */
function normalizeStatus(status) {
  if (status === "draft" || status === "accepted" || status === "done" || status === "deprecated") {
    return status;
  }
  return "draft";
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {Record<string, string>} indexEntry
 * @returns {Spec}
 */
function buildSpec(indexEntry) {
  const id = indexEntry.id;
  const specPath = path.join(MIND_ROOT, indexEntry.path);
  let fm = null;
  if (fs.existsSync(specPath)) {
    fm = parseFrontmatter(readText(specPath));
  }

  const title =
    (typeof fm?.title === "string" && fm.title) ||
    indexEntry.title ||
    id;
  const status = normalizeStatus(
    (typeof fm?.status === "string" && fm.status) || indexEntry.status,
  );
  const domain =
    (typeof fm?.domain === "string" && fm.domain) ||
    indexEntry.domain ||
    "cross";
  const nhost = typeof fm?.nhost === "boolean" ? fm.nhost : false;
  const designSystem =
    typeof fm?.design_system === "boolean" ? fm.design_system : false;
  const offline = typeof fm?.offline === "boolean" ? fm.offline : false;
  const updated =
    (typeof fm?.updated === "string" && fm.updated) || todayStamp();

  return {
    id,
    title,
    status,
    domain,
    nhost,
    designSystem,
    offline,
    updated,
  };
}

/** @param {Spec[]} specs */
function formatSpecsArray(specs) {
  const stamp = todayStamp();
  const lines = [
    `/** Snapshot INDEX.md + frontmatter SPEC — ${stamp}. */`,
    "const SPECS: Spec[] = [",
  ];
  for (const spec of specs) {
    lines.push("  {");
    lines.push(`    id: ${JSON.stringify(spec.id)},`);
    lines.push(`    title: ${JSON.stringify(spec.title)},`);
    lines.push(`    status: ${JSON.stringify(spec.status)},`);
    lines.push(`    domain: ${JSON.stringify(spec.domain)},`);
    lines.push(`    nhost: ${spec.nhost},`);
    lines.push(`    designSystem: ${spec.designSystem},`);
    lines.push(`    offline: ${spec.offline},`);
    lines.push(`    updated: ${JSON.stringify(spec.updated)},`);
    lines.push("  },");
  }
  lines.push("];");
  return lines.join("\n");
}

function replaceSpecsBlock(canvasSource, nextBlock) {
  const re =
    /\/\*\* Snapshot INDEX\.md \+ frontmatter SPEC[^*]*\*\/\s*\nconst SPECS: Spec\[] = \[[\s\S]*?\n\];/;
  if (!re.test(canvasSource)) {
    fail("bloc SPECS introuvable dans le canvas (commentaire Snapshot + const SPECS)");
  }
  return canvasSource.replace(re, nextBlock);
}

function replaceSnapshotCaption(canvasSource, stamp) {
  return canvasSource.replace(
    /Snapshot mind du \d{4}-\d{2}-\d{2}/,
    `Snapshot mind du ${stamp}`,
  );
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) fail(`INDEX introuvable: ${INDEX_PATH}`);
  if (!fs.existsSync(CANVAS_PATH)) fail(`canvas introuvable: ${CANVAS_PATH}`);

  const indexMd = readText(INDEX_PATH);
  const entries = parseIndexSpecEntries(extractIndexSpecsYaml(indexMd));
  if (entries.length === 0) fail("aucune entrée specs/ dans INDEX");

  const specs = entries.map(buildSpec);
  const missingFm = entries.filter((e) => {
    const p = path.join(MIND_ROOT, e.path);
    return !fs.existsSync(p);
  });

  const canvas = readText(CANVAS_PATH);
  const stamp = todayStamp();
  let next = replaceSpecsBlock(canvas, formatSpecsArray(specs));
  next = replaceSnapshotCaption(next, stamp);

  if (next === canvas) {
    console.log(`OK — déjà à jour (${specs.length} specs) → ${CANVAS_PATH}`);
  } else {
    fs.writeFileSync(CANVAS_PATH, next, "utf8");
    console.log(`OK — ${specs.length} specs écrites → ${CANVAS_PATH}`);
  }

  if (missingFm.length) {
    console.log(
      `note: ${missingFm.length} SPEC.md manquant(s), champs INDEX + flags par défaut:`,
    );
    for (const e of missingFm) console.log(`  - ${e.id}`);
  }
}

main();
