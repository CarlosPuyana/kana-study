import fs from 'node:fs/promises';
import ts from '../../node_modules/typescript/lib/typescript.js';
import { createHash } from 'node:crypto';

const url = new URL('../../src/app/core/services/custom-deck-validation.ts', import.meta.url);
const source = await fs.readFile(url, 'utf8');
export const h1SourceDigest = createHash('sha256').update(source).digest('hex');
// Only type imports are removed by TypeScript. Run H1's actual pure identity function.
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
}).outputText;
const actual = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
export const lexicalIdentity = actual.lexicalIdentity;
