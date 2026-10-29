#!/usr/bin/env node
// Checks the manifests against what each directory enforces at submission, so a
// limit is caught here instead of in a review round. No dependencies.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const errors = [];
const fail = (message) => errors.push(message);
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const SERVER_URL = 'https://api.bluulabs.com/api/v1/mcp';

const portable = read('plugin.json');
const claude = read('.claude-plugin/plugin.json');
const cursor = read('.cursor-plugin/plugin.json');
const marketplace = read('.claude-plugin/marketplace.json');
const mcp = read('mcp.json');
const claudeMcp = read('.mcp.json');

// ── identity ────────────────────────────────────────────────────────────────
for (const [file, manifest] of [
  ['plugin.json', portable],
  ['.claude-plugin/plugin.json', claude],
  ['.cursor-plugin/plugin.json', cursor],
]) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name) || manifest.name.length > 64) {
    fail(`${file}: name must be kebab-case, at most 64 characters`);
  }
  if (manifest.version !== portable.version) fail(`${file}: version differs from plugin.json`);
  if (manifest.name !== portable.name) fail(`${file}: name differs from plugin.json`);
}
if (!marketplace.plugins?.some((p) => p.name === portable.name)) {
  fail('.claude-plugin/marketplace.json: does not list the plugin');
}

// ── one server, the same URL everywhere ─────────────────────────────────────
const urls = [
  ['mcp.json', Object.values(mcp.mcpServers ?? {})],
  ['.mcp.json', Object.values(claudeMcp.mcpServers ?? {})],
  ['.cursor-plugin/plugin.json', Object.values(cursor.mcpServers ?? {})],
];
for (const [file, servers] of urls) {
  if (servers.length !== 1) fail(`${file}: exactly one MCP server expected`);
  if (servers[0]?.url !== SERVER_URL) fail(`${file}: server URL must be ${SERVER_URL}`);
}
if (mcp.mcpServers?.bluu?.type !== 'streamable-http') fail('mcp.json: type must be streamable-http');

// ── OpenAI listing (developers.openai.com/plugins/deploy/submission) ────────
const openai = portable.extensions?.['com.openai'] ?? {};
const ui = openai.interface ?? {};
const max = (field, value, limit) => {
  if (typeof value !== 'string' || !value.trim()) fail(`interface.${field}: required`);
  else if (value.length > limit) fail(`interface.${field}: ${value.length} > ${limit} characters`);
};
max('displayName', ui.displayName, 30);
max('shortDescription', ui.shortDescription, 30);
max('longDescription', ui.longDescription, 4000);
max('developerName', ui.developerName, 80);
max('category', ui.category, 80);
for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
  if (!/^https:\/\/[^\s@]+$/.test(ui[field] ?? '')) fail(`interface.${field}: an https URL is required`);
}
const prompts = [].concat(ui.defaultPrompt ?? []);
if (prompts.length > 3) fail('interface.defaultPrompt: at most 3');
for (const p of prompts) if (p.length > 128 || p.includes('@')) fail(`defaultPrompt "${p}": at most 128 characters, no @mentions`);
if ((ui.capabilities ?? []).length > 20) fail('interface.capabilities: at most 20');
for (const c of ui.capabilities ?? []) if (c.length > 120) fail(`capability "${c}": at most 120 characters`);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
if (ui.brandColor) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(ui.brandColor)) fail('interface.brandColor: #RRGGBB');
  else if (contrast(ui.brandColor, '#FFFFFF') < 2) fail('interface.brandColor: under 2:1 against white');
}

// Icons: square PNGs, at least 48 px.
const pngSize = (path) => {
  const bytes = readFileSync(join(root, path));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
for (const field of ['logo', 'composerIcon']) {
  const path = ui[field];
  if (!path) {
    fail(`interface.${field}: required for submission`);
    continue;
  }
  if (!path.startsWith('./') || !existsSync(join(root, path))) {
    fail(`interface.${field}: ${path} must be ./-relative and exist`);
    continue;
  }
  const [w, h] = pngSize(path);
  if (w !== h || w < 48 || w > 4096) fail(`interface.${field}: ${w}x${h} must be square, 48 to 4096 px`);
}
if (cursor.logo && !existsSync(join(root, cursor.logo))) fail(`.cursor-plugin logo ${cursor.logo} is missing`);

// Review: exactly five positive and three negative cases for the initial review.
const cases = openai.review?.test_cases ?? {};
if ((cases.positive ?? []).length !== 5) fail('review.test_cases.positive: exactly 5');
if ((cases.negative ?? []).length !== 3) fail('review.test_cases.negative: exactly 3');
for (const c of cases.positive ?? []) {
  for (const field of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
    if (!c[field]) fail(`positive case "${c.description}": ${field} is required`);
  }
}
for (const c of cases.negative ?? []) {
  for (const field of ['description', 'prompt']) {
    if (!c[field]) fail(`negative case "${c.description}": ${field} is required`);
  }
}
for (const forbidden of ['test_credentials', 'reviewer_instructions']) {
  if (openai.review && forbidden in openai.review) fail(`review.${forbidden}: never in the package`);
}

const publication = openai.publication ?? {};
for (const code of publication.countries ?? []) {
  if (!/^[A-Z]{2}$/.test(code)) fail(`publication.countries: "${code}" is not an uppercase country code`);
}
for (const [locale, text] of Object.entries(publication.translations ?? {})) {
  if (text.subtitle && (text.subtitle.length > 30 || text.subtitle.includes('\n'))) {
    fail(`translations.${locale}.subtitle: one line, at most 30 characters`);
  }
  if (text.description && text.description.length > 4000) fail(`translations.${locale}.description: at most 4000`);
}

// ── skills ──────────────────────────────────────────────────────────────────
for (const dir of readdirSync(join(root, 'skills'))) {
  const path = join(root, 'skills', dir, 'SKILL.md');
  if (!existsSync(path)) {
    fail(`skills/${dir}: SKILL.md is missing`);
    continue;
  }
  const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, 'utf8'))?.[1] ?? '';
  const name = /^name:\s*(.+)$/m.exec(front)?.[1]?.trim();
  const description = /^description:\s*(.+)$/m.exec(front)?.[1]?.trim();
  if (name !== dir) fail(`skills/${dir}: frontmatter name must be "${dir}"`);
  if (!description) fail(`skills/${dir}: frontmatter description is required`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ manifests, listing, review cases and skills are within the directories\' limits');
