import fs from 'node:fs/promises';import{createHash}from'node:crypto';import{hiragana,normalizeWithOffsets}from'./engines.mjs';
export async function readCorpus(){
 const source=await fs.readFile(new URL('./corpus.tsv',import.meta.url),'utf8');
 const cases=source.replace(/^\uFEFF/u,'').split(/\r?\n/u).filter(l=>l.trim()&&!l.startsWith('#')).map(line=>{
  const columns=line.split('|');if(columns.length!==12)throw Error('Invalid corpus row: '+line);
  const [id,category,difficulty,rawText,segments,rawFocus,lemma,lemmaReading,reading,pos,classification,rationale]=columns;
  const text=rawText.replaceAll('\\n','\n'),focus=rawFocus.replaceAll('\\n','\n');const normalized=normalizeWithOffsets(text),focusStart=normalized.text.indexOf(focus.normalize('NFC'));
  if(focusStart<0)throw Error('Missing focus: '+id);
  return {id,category,difficulty,text,focus,span:[focusStart,focusStart+focus.normalize('NFC').length],tokens:segments==='?'?null:segments.split(' '),lemma:lemma==='-'?null:lemma,lemmaReading:lemmaReading==='-'?null:lemmaReading,reading:reading==='-'?null:reading,pos:pos==='-'?null:pos,classification,rationale};
 });
 return {sha256:createHash('sha256').update(source).digest('hex'),cases};
}
/** Triage only: not a certified LexicalIdentity adapter. No ranking, fixture labels or terms[0]. */
export function makeLexicalScreen(rows){
 const byExpression=new Map();for(const row of rows){const values=byExpression.get(row[0])??[];values.push(row);byExpression.set(row[0],values);}
 return token=>{
  if(token.pos==='記号'||token.pos==='助詞'||token.pos==='助動詞'||token.subpos==='固有名詞')return {classification:'excluded',reason:'function-symbol-or-proper-name',token};
  if(token.unknown===true)return {classification:'unknown',reason:'engine-unknown',token};
  const lemma=token.lemma??token.surface;
  const candidates=(byExpression.get(lemma)??[]).filter(r=>r[6]>0&&r[5].length);
  if(!candidates.length)return {classification:'unknown',reason:'no-Spanish-entry',token};
  if(!token.pos||!token.reading)return {classification:'ambiguous',reason:'no-morphological-reading-evidence',token,candidateCount:candidates.length};
  // Keep all entries/readings/senses; do not resolve ambiguity via score or a top result.
  if(candidates.length!==1)return {classification:'ambiguous',reason:'multiple-entry-reading-or-sense-rows',token,candidateCount:candidates.length};
  const row=candidates[0],reading=hiragana(row[1]||row[0]);
  let n=0;while(n<lemma.length&&n<token.surface.length&&lemma[n]===token.surface[n])n++;
  const removed=lemma.slice(n),added=token.surface.slice(n);
  const kana=s=>/^[\p{Script=Hiragana}\p{Script=Katakana}ー]*$/u.test(s);
  const expected=removed===''?reading+hiragana(added):reading.endsWith(hiragana(removed))?reading.slice(0,-hiragana(removed).length)+hiragana(added):null;
  const compatible=(token.pos==='動詞'?/^(?:.*\s)?v/u.test(row[2]):token.pos==='形容詞'?row[2].includes('adj-i'):['名詞','副詞','感動詞','連体詞'].includes(token.pos));
  if(!compatible||!kana(removed)||!kana(added)||expected!==token.reading)return {classification:'ambiguous',reason:'reading-or-POS-not-demonstrated',token};
  return {classification:'verified',experimentalOnly:true,identity:null,reason:'unique-export-row-and-compatible-morphology',token,lemma,lemmaReading:reading,provisionalEntry:{authority:'jmdict',entryId:String(row[6]),sourceDigestRequired:true,homographGroup:null},glossLanguage:'es'};
 };
}
export function wilson(successes,total){if(!total)return null;const z=1.959963984540054,p=successes/total,d=1+z*z/total,c=(p+z*z/(2*total))/d,h=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return [c-h,c+h];}
export function ratio(n,d){return d?n/d:null;}
export function metrics(cases,outputs,screen){
 const counts={boundaryTP:0,boundaryFP:0,boundaryFN:0,boundaryCases:0,exactSegmentation:0,lemmaCorrect:0,lemmaTotal:0,readingCorrect:0,readingTotal:0,posCorrect:0,posTotal:0,unknownCorrect:0,unknownTotal:0,offsetCorrect:0,offsetTotal:0,acceptedTP:0,acceptedFP:0,validGold:0,recoveredGold:0,unsafeFixturesAccepted:0};
 const labels=['verified','ambiguous','unknown','excluded'];const confusion=Object.fromEntries(labels.map(a=>[a,Object.fromEntries(labels.map(b=>[b,0]))]));const details=[];
 for(let i=0;i<cases.length;i++){
  const c=cases[i],normalized=normalizeWithOffsets(c.text),tokens=outputs[i].filter(t=>t.surface.trim());
  for(const t of tokens){counts.offsetTotal++;if(normalized.text.slice(t.start,t.end)===t.surface){const [a,b]=normalized.originalRange(t.start,t.end);if(c.text.slice(a,b).normalize('NFC')===t.surface)counts.offsetCorrect++;}}
  if(c.tokens){let from=0;const gold=[];for(const token of c.tokens){const start=normalized.text.indexOf(token,from);if(start<0)throw Error('Bad reference segmentation '+c.id);gold.push(start+':'+(start+token.length));from=start+token.length;}
   const predicted=tokens.map(t=>t.start+':'+t.end),g=new Set(gold),p=new Set(predicted);counts.boundaryCases++;if(gold.join('|')===predicted.join('|'))counts.exactSegmentation++;
   counts.boundaryTP+=predicted.filter(s=>g.has(s)).length;counts.boundaryFP+=predicted.filter(s=>!g.has(s)).length;counts.boundaryFN+=gold.filter(s=>!p.has(s)).length;
  }
  const exact=tokens.find(t=>t.start===c.span[0]&&t.end===c.span[1]);
  if(c.lemma){counts.lemmaTotal++;if(exact?.lemma===c.lemma)counts.lemmaCorrect++;}
  if(c.reading){counts.readingTotal++;if(exact?.reading===c.reading)counts.readingCorrect++;}
  if(c.pos){counts.posTotal++;if(exact?.pos===c.pos)counts.posCorrect++;}
  if(c.classification==='unknown'){counts.unknownTotal++;if(tokens.filter(t=>t.end>c.span[0]&&t.start<c.span[1]).some(t=>t.unknown===true))counts.unknownCorrect++;}
  const relevant=tokens.filter(t=>t.end>c.span[0]&&t.start<c.span[1]).map(screen);const accepted=relevant.filter(r=>r.classification==='verified');
  let recovered=false;for(const r of accepted){const correct=c.classification==='verified'&&r.token.start===c.span[0]&&r.token.end===c.span[1]&&r.lemma===c.lemma&&r.lemmaReading===c.lemmaReading;if(correct){counts.acceptedTP++;recovered=true;}else counts.acceptedFP++;}
  if(c.classification==='verified'){counts.validGold++;if(recovered)counts.recoveredGold++;}
  if(['ambiguous','unknown'].includes(c.classification)&&accepted.length)counts.unsafeFixturesAccepted++;
  const predicted=accepted.length?'verified':relevant.some(r=>r.classification==='ambiguous')?'ambiguous':relevant.some(r=>r.classification==='unknown')?'unknown':'excluded';confusion[c.classification][predicted]++;
  details.push({id:c.id,expected:c.classification,predicted,recovered,accepted:accepted.map(r=>({surface:r.token.surface,lemma:r.lemma,entry:r.provisionalEntry?.entryId})),raw:tokens,reason:c.rationale});
 }
 const precision=ratio(counts.acceptedTP,counts.acceptedTP+counts.acceptedFP),recall=ratio(counts.recoveredGold,counts.validGold);
 return {counts,tokenizer:{boundaryPrecision:ratio(counts.boundaryTP,counts.boundaryTP+counts.boundaryFP),boundaryRecall:ratio(counts.boundaryTP,counts.boundaryTP+counts.boundaryFN),exactSegmentation:ratio(counts.exactSegmentation,counts.boundaryCases),lemmaAccuracy:ratio(counts.lemmaCorrect,counts.lemmaTotal),surfaceReadingAccuracy:ratio(counts.readingCorrect,counts.readingTotal),coarsePOSAccuracy:ratio(counts.posCorrect,counts.posTotal),unknownRecall:ratio(counts.unknownCorrect,counts.unknownTotal),offsetAccuracy:ratio(counts.offsetCorrect,counts.offsetTotal)},pipeline:{precision,recall,precisionWilson95:wilson(counts.acceptedTP,counts.acceptedTP+counts.acceptedFP),acceptanceCoverage:ratio(details.filter(d=>d.predicted==='verified').length,cases.length)},confusion,details};
}
