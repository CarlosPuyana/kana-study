// Read-only audit of project Markdown and the reviewed hygiene move manifest.
// Generated dependencies, browser profiles and historical build copies are not source docs.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root = process.cwd();
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = (...args) => execFileSync('git', args, {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
const files = [...new Set(git('ls-files', '-c', '--others', '--exclude-standard', '-z').split('\0'))]
  .filter(file => file.endsWith('.md') && fs.existsSync(file));
const manifest = JSON.parse(fs.readFileSync('docs/repo-path-map.json', 'utf8'));
const moved = new Map(manifest.moves.map(move => [move.from, move]));
const broken = [], oldLinkTargets = [], localLinks = [];

for (const file of files) {
  // Examples in fenced code are commands, not rendered Markdown links.
  const text = fs.readFileSync(file, 'utf8').replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '');
  const targets = [...text.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)]
    .map(match => match[1].replace(/^<|>$/g, ''));
  // Reference-style definitions are supported as well.
  targets.push(...[...text.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)]
    .map(match => match[1].replace(/^<|>$/g, '')));
  for (const target of targets) {
    if (/^(?:https?:|mailto:|data:|plugin:|app:|codex:|#)/i.test(target)) continue;
    const pathname = decodeURIComponent(target.split('#')[0]);
    if (!pathname) continue;
    const absolute = path.isAbsolute(pathname) ? pathname : path.resolve(path.dirname(file), pathname);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    localLinks.push({file, target});
    if (moved.has(relative)) oldLinkTargets.push({file, target});
    if (!fs.existsSync(absolute)) broken.push({file, target});
  }
}

const missingMoves = [], changedMoves = [];
for (const move of manifest.moves) {
  // Ignored logs exist only in the original local environment; do not require them on a fresh clone.
  if (move.kind === 'log' && !fs.existsSync(move.to)) continue;
  if (!fs.existsSync(move.to)) missingMoves.push(move.to);
  else if (hash(move.to) !== move.sha256After) changedMoves.push(move.to);
}

const baselinePath = '.cache/hygiene1/inventory-before.json';
const linksOnly = process.argv.includes('--links-only');
const baselineAvailable = !linksOnly && fs.existsSync(baselinePath);
const unexpectedChanges = [], missingOriginals = [];
let linkOnlyEditsVerified = false;
if (baselineAvailable) {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  assert.equal(git('rev-parse', 'HEAD').trim(), baseline.head, 'HEAD changed during hygiene');
  const editable = new Set(['README.md', 'SUPABASE_SETUP.md', 'experiments/manga-morphology-h2a/README.md']);
  for (const file of baseline.files.filter(file => file.scope === 'project')) {
    const destination = moved.get(file.path)?.to ?? file.path;
    if (!fs.existsSync(destination)) missingOriginals.push(file.path);
    else if (file.sha256 && !moved.has(file.path) && !editable.has(file.path) && hash(destination) !== file.sha256) {
      unexpectedChanges.push(file.path);
    }
  }
  const originalDocs = JSON.parse(fs.readFileSync('.cache/hygiene1/docs-before-content.json', 'utf8'));
  const withoutLinkTargets = text => text.replace(/(!?\[[^\]\n]*\]\()([^\s)]+)(\))/g, '$1$3');
  for (const [original, text] of Object.entries(originalDocs)) {
    if (original === 'README.md') continue; // The central index paragraph is the documented content edit.
    const destination = moved.get(original)?.to ?? original;
    assert.equal(withoutLinkTargets(fs.readFileSync(destination, 'utf8')), withoutLinkTargets(text),
      `Documentation changed beyond link destinations: ${original}`);
  }
  linkOnlyEditsVerified = true;
}

const result = {markdownFiles: files.length, localLinks: localLinks.length, broken, oldLinkTargets,
  missingMoves, changedMoves, linksOnly, baselineAvailable, linkOnlyEditsVerified, unexpectedChanges, missingOriginals};
const reachable = new Set(['README.md']);
for (let previous = -1; previous !== reachable.size;) {
  previous = reachable.size;
  for (const {file, target} of localLinks) {
    if (!reachable.has(file)) continue;
    const absolute = path.resolve(path.dirname(file), decodeURIComponent(target.split('#')[0]));
    const destination = path.relative(root, absolute).split(path.sep).join('/');
    if (files.includes(destination)) reachable.add(destination);
  }
}
result.unreachableMarkdown = files.filter(file => !reachable.has(file));
fs.mkdirSync('.cache/hygiene1', {recursive: true});
fs.writeFileSync('.cache/hygiene1/doc-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
assert.equal(broken.length, 0, 'Broken local Markdown links; see doc-audit.json');
assert.equal(oldLinkTargets.length, 0, 'Links still use old paths');
assert.equal(missingMoves.length + changedMoves.length, 0, 'Moved document missing or changed');
assert.equal(unexpectedChanges.length + missingOriginals.length, 0, 'Original work was changed or lost');
assert.equal(result.unreachableMarkdown.length, 0, 'Markdown is not reachable from README');
