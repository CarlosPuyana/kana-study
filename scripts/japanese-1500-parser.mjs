const RECOGNIZED_ENTITIES = new Map([
  ['&nbsp;', ' '],
  ['&amp;', '&'],
  ['&quot;', '"'],
  ['&#39;', "'"],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
]);

export function parseWordFurigana(source) {
  return parseFurigana(source, false).map(({ highlighted: _highlighted, ...segment }) => segment);
}

export function parseSentenceFurigana(source) {
  return parseFurigana(source, true);
}

export function sourceMarkupToPlainText(source) {
  const withLineBreaks = String(source ?? '').replace(/<br\s*\/?>/gi, '\n');
  const withoutTags = withLineBreaks.replace(/<\/?b>/gi, '');
  if (/<[^>]*>/.test(withoutTags)) throw new Error(`Unsupported markup: ${source}`);
  return decodeEntities(withoutTags).replace(/[ \t]+/g, ' ').trim();
}

function parseFurigana(source, allowMarkup) {
  const segments = [];
  let buffer = '';
  let highlighted = false;
  let index = 0;

  const append = segment => {
    if (!segment.lineBreak && !segment.text) return;
    const previous = segments.at(-1);
    if (
      previous
      && !previous.reading
      && !previous.lineBreak
      && !segment.reading
      && !segment.lineBreak
      && previous.highlighted === segment.highlighted
    ) {
      previous.text += segment.text;
      return;
    }
    segments.push(segment);
  };
  const flush = () => {
    const text = decodeEntities(buffer).replace(/[ \t\r\n]+/g, '');
    if (text) append({ text, highlighted });
    buffer = '';
  };

  while (index < source.length) {
    const rest = source.slice(index);
    const tag = rest.match(/^<\s*(\/?)\s*(b|br)\s*\/?\s*>/i);
    if (tag) {
      if (!allowMarkup) throw new Error(`Markup is not allowed in word furigana: ${source}`);
      flush();
      const closing = tag[1] === '/';
      const name = tag[2].toLowerCase();
      if (name === 'br') append({ text: '', highlighted, lineBreak: true });
      else highlighted = !closing;
      index += tag[0].length;
      continue;
    }
    if (rest[0] === '<') throw new Error(`Unsupported markup in furigana: ${source}`);
    if (rest[0] === '[') {
      const end = source.indexOf(']', index + 1);
      if (end < 0 || !buffer.trim()) throw new Error(`Invalid furigana notation: ${source}`);
      const text = decodeEntities(buffer).replace(/[ \t\r\n]+/g, '');
      const reading = decodeEntities(source.slice(index + 1, end)).trim();
      if (!text || !reading) throw new Error(`Invalid furigana group: ${source}`);
      append({ text, reading, highlighted });
      buffer = '';
      index = end + 1;
      continue;
    }
    if (/\s/.test(rest[0])) {
      flush();
      index += 1;
      continue;
    }
    buffer += rest[0];
    index += 1;
  }
  flush();
  return segments;
}

function decodeEntities(value) {
  return value.replace(/&(?:nbsp|amp|quot|apos|lt|gt|#39);/gi, entity =>
    RECOGNIZED_ENTITIES.get(entity.toLowerCase()) ?? entity,
  );
}
