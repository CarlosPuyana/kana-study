import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {validatePublicCatalog} from './phrase-islands-admin-lib.mjs';
const root=process.cwd();const catalog=validatePublicCatalog(root);const outputs=JSON.parse(fs.readFileSync('dist/kana-study-candidate/browser-stats.json','utf8')).outputs;
for(const output of Object.values(outputs))for(const name of Object.keys(output.inputs??{}))assert(!/phrase-islands-admin|phrase-admin-contract|phrase-authoring-preferences|phrase-admin-copy|\.phrase-islands-authoring/.test(name),'Authoring source in public build: '+name);
const folder='dist/kana-study-candidate/browser/audio/phrase-islands';
function check(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())check(p);else assert(!/\.(wav|aivmx|onnx|exe)$|draft\.json$|job\.json$|review\.json$/i.test(f.name),'Private artifact in public audio: '+p);}}
check(folder);console.log(`Public-only audit: ${catalog.content.phrases.length} phrases; no authoring modules, demos or private masters`);
