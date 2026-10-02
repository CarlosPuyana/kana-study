import { MokuroDocument } from '../models/manga.model';
export class MangaError extends Error { constructor(readonly code: string) { super(code); } }
export function normalizeMangaPath(path: string): string {
  const value = path.replace(/\\/g, '/');
  if (value.startsWith('/') || /^[a-z]:/i.test(value) || value.includes('\0')) throw new MangaError('invalid');
  const segments = value.split('/').filter(part => part && part !== '.');
  if (segments.includes('..')) throw new MangaError('invalid');
  return segments.join('/');
}
// Schema from upstream mokuro_generator.py and manga_page_ocr.py; no Reader code used.
export function parseMokuro(raw: string): MokuroDocument {
  try {
    const doc = JSON.parse(raw) as MokuroDocument;
    if (!doc || typeof doc.version !== 'string') throw new MangaError('invalid');
    const version = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(doc.version);
    if (!version || Number(version[1]) !== 0 || Number(version[2]) < 2) throw new MangaError('version');
    if (typeof doc.title !== 'string' || typeof doc.volume !== 'string' || !Array.isArray(doc.pages) || !doc.pages.length) throw new MangaError('invalid');
    for (const page of doc.pages) {
      if (typeof page.img_path !== 'string' || !normalizeMangaPath(page.img_path) || !Number.isFinite(page.img_width) || page.img_width <= 0 || !Number.isFinite(page.img_height) || page.img_height <= 0 || !Array.isArray(page.blocks)) throw new MangaError('invalid');
      for (const block of page.blocks) {
        if (!Array.isArray(block.box) || block.box.length !== 4 || !block.box.every(Number.isFinite) || block.box[0] < 0 || block.box[1] < 0 || block.box[2] <= block.box[0] || block.box[3] <= block.box[1] || block.box[2] > page.img_width || block.box[3] > page.img_height || typeof block.vertical !== 'boolean' || !Number.isFinite(block.font_size) || block.font_size <= 0 || !Array.isArray(block.lines) || !block.lines.every(line => typeof line === 'string') || !Array.isArray(block.lines_coords) || block.lines_coords.length !== block.lines.length || !block.lines_coords.every(polygon => Array.isArray(polygon) && polygon.length >= 4 && polygon.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)))) throw new MangaError('invalid');
      }
    }
    return doc;
  } catch (error) { if (error instanceof MangaError) throw error; throw new MangaError('invalid'); }
}
export function mapMokuroImages(doc: MokuroDocument, paths: string[], mokuroPath: string, allowBasename = false): string[] {
  const normalized = paths.map(normalizeMangaPath);
  if (new Set(normalized).size !== normalized.length) throw new MangaError('invalid');
  const available = new Set(normalized);
  const base = normalizeMangaPath(mokuroPath).split('/').slice(0, -1).join('/');
  return doc.pages.map(page => {
    const relative = normalizeMangaPath(page.img_path);
    const candidate = base ? `${base}/${relative}` : relative;
    let match = available.has(candidate) ? candidate : available.has(relative) ? relative : null;
    if (!match && allowBasename) {
      const basename = relative.split('/').at(-1);
      const matches = normalized.filter(path => path.split('/').at(-1) === basename && /\.(jpe?g|png|webp|avif)$/i.test(path));
      if (matches.length > 1) throw new MangaError('ambiguous');
      match = matches[0] ?? null;
    }
    if (!match || !/\.(jpe?g|png|webp|avif)$/i.test(match)) throw new MangaError('missing');
    return match;
  });
}
export function findMokuro(paths: string[]): string {
  const files = paths.filter(path => /\.mokuro$/i.test(path));
  if (!files.length) throw new MangaError('noMokuro');
  if (files.length !== 1) throw new MangaError('multiple');
  return files[0];
}
