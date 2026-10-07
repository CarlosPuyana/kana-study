import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {buildGrammarV2} from './grammar-n5-v2.mjs';
import {compileTranslations} from './compile-i18n.mjs';

export function generateGrammarV2() {
  const {concepts,review,integration,copy}=buildGrammarV2();
  fs.mkdirSync('src/app/data/grammar',{recursive:true});
  fs.writeFileSync('src/app/data/grammar/grammar-n5-v2.generated.ts',
    "// Generated from scripts/grammar-n5-v2.mjs. Do not edit manually.\n"+
    "import {GrammarConcept,GrammarIntegrationSection} from '../../core/models/grammar-v2.model';\n"+
    "import {GrammarExercise} from '../../features/grammar/models/grammar.model';\n"+
    `export const GRAMMAR_V2_CONCEPTS: readonly GrammarConcept[] = ${JSON.stringify(concepts,null,2)};\n`+
    `export const GRAMMAR_V2_REVIEW: readonly GrammarExercise[] = ${JSON.stringify(review,null,2)};\n`+
    `export const GRAMMAR_V2_INTEGRATION: readonly GrammarIntegrationSection[] = ${JSON.stringify(integration,null,2)};\n`);
  for(const lang of ['es','en','ca']) {
    const path=`src/assets/i18n/${lang}.json`, existing=JSON.parse(fs.readFileSync(path,'utf8'));
    for(const id of Object.keys(existing))if(id.startsWith('grammar.v2.'))delete existing[id];
    fs.writeFileSync(path,JSON.stringify({...existing,...copy[lang]},null,2)+'\n');
  }
  compileTranslations();
  console.log(`Grammar V2: ${concepts.length} concepts, ${concepts.reduce((n,c)=>n+c.exercises.length,0)} lesson exercises, ${review.length} cumulative exercises.`);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1]))generateGrammarV2();
