import { Injectable } from '@angular/core';

export type InflectionClass = 'v1' | 'v5' | 'vs' | 'vk' | 'adj-i';
export interface Deinflection {
  surface: string; base: string; reasons: string[]; depth: number; cost: number;
  classes: InflectionClass[]; steps: { from: string; to: string }[];
}
interface Rule { from: string; to: string; reason: string; classes: InflectionClass[]; input?: InflectionClass[] }
const rules: Rule[] = [];
function add(from: string, to: string, reason: string, classes: InflectionClass[], input?: InflectionClass[]): void {
  rules.push({ from, to, reason, classes, input });
}
// Surface suffixes, not a sentence parser. Ambiguous candidates require dictionary POS validation.
for (const [ending, reason] of [['ました','polite-past'],['ませんでした','polite-negative-past'],['ません','polite-negative'],['ます','polite'],['ましょう','polite-volitional']] as const) {
  add(ending,'る',reason,['v1'],['v1']);
  for (const [stem, base] of [['い','う'],['き','く'],['ぎ','ぐ'],['し','す'],['ち','つ'],['に','ぬ'],['び','ぶ'],['み','む'],['り','る']]) add(stem+ending,base,reason,['v5'],['v5']);
  add('し'+ending,'する',reason,['vs'],['vs']); add('来'+ending,'来る',reason,['vk'],['vk']);
}
for (const [ending, reason] of [['ない','negative'],['なかった','negative-past']] as const) {
  add(ending,'る',reason,['v1'],['v1']);
  for (const [stem,base] of [['わ','う'],['か','く'],['が','ぐ'],['さ','す'],['た','つ'],['な','ぬ'],['ば','ぶ'],['ま','む'],['ら','る']]) add(stem+ending,base,reason,['v5'],['v5']);
  add('し'+ending,'する',reason,['vs'],['vs']); add('来'+ending,'来る',reason,['vk'],['vk']);
}
add('ぬ','る','negative-nu',['v1'],['v1']);
for(const [stem,base] of [['わ','う'],['か','く'],['が','ぐ'],['さ','す'],['た','つ'],['な','ぬ'],['ば','ぶ'],['ま','む'],['ら','る']]) add(stem+'ぬ',base,'negative-nu',['v5'],['v5']);
add('せぬ','する','negative-nu',['vs'],['vs']);
add('来ぬ','来る','negative-nu',['vk'],['vk']);add('こぬ','くる','negative-nu',['vk'],['vk']);
// Prefer the explicit irregular 行く form over generic った → う candidates.
add('行った','行く','past',['v5'],['v5']);add('行って','行く','te',['v5'],['v5']);
add('いった','いく','past',['v5'],['v5']);add('いって','いく','te',['v5'],['v5']);
for(const [from,reason] of [['きた','past'],['きて','te'],['きました','polite-past'],['きます','polite'],['きません','polite-negative'],['きませんでした','polite-negative-past'],['こない','negative'],['こなかった','negative-past']] as const) add(from,'くる',reason,['vk'],['vk']);
for (const [ending,reason] of [['た','past'],['て','te']] as const) {
  add(ending,'る',reason,['v1'],['v1']);
  for (const [stem,bases] of [['っ',['う','つ','る']],['い',['く']],['し',['す']]] as const) for (const base of bases) add(stem+ending,base,reason,['v5'],['v5']);
  add('し'+ending,'する',reason,['vs'],['vs']);add('来'+ending,'来る',reason,['vk'],['vk']);
}
for (const [ending,reason] of [['だ','past'],['で','te']] as const) {
  for (const base of ['む','ぶ','ぬ']) add('ん'+ending,base,reason,['v5'],['v5']);add('い'+ending,'ぐ',reason,['v5'],['v5']);
}
for (const [from,to] of [['ている','て'],['でいる','で'],['てる','て'],['でる','で']]) add(from,to,'progressive',['v1','v5','vs','vk'],['v1']);
for (const [from,reason] of [['かった','past'],['くない','negative'],['くなかった','negative-past']]) add(from,'い',reason,['adj-i'],['adj-i']);
add('たい','る','desire',['v1'],['adj-i']);add('すぎる','る','excess',['v1'],['v1']);
for (const [stem,base] of [['い','う'],['き','く'],['ぎ','ぐ'],['し','す'],['ち','つ'],['に','ぬ'],['び','ぶ'],['み','む'],['り','る']]) {
  add(stem+'たい',base,'desire',['v5'],['adj-i']);add(stem+'すぎる',base,'excess',['v5'],['v1']);
}
add('すぎる','い','excess',['adj-i'],['v1']);
add('られる','る','potential-passive',['v1'],['v1']);add('させる','る','causative',['v1'],['v1']);add('よう','る','volitional',['v1'],['v1']);
add('ろ','る','imperative',['v1'],['v1']);add('よ','る','imperative',['v1'],['v1']);
for (const [a,e,o,base] of [['わ','え','お','う'],['か','け','こ','く'],['が','げ','ご','ぐ'],['さ','せ','そ','す'],['た','て','と','つ'],['な','ね','の','ぬ'],['ば','べ','ぼ','ぶ'],['ま','め','も','む'],['ら','れ','ろ','る']]) {
  add(e+'る',base,'potential',['v5'],['v1']);add(a+'れる',base,'passive',['v5'],['v1']);add(a+'せる',base,'causative',['v5'],['v1']);add(o+'う',base,'volitional',['v5'],['v5']);add(e,base,'imperative',['v5'],['v5']);
}
for(const [from,reason] of [['できる','potential'],['される','passive'],['させる','causative'],['しよう','volitional'],['しろ','imperative']]) add(from,'する',reason,['vs'],['v1','vs']);
add('来られる','来る','potential-passive',['vk'],['v1']);add('来させる','来る','causative',['vk'],['v1']);

export function deinflect(surface: string): Deinflection[] {
  if (!/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(surface) || Array.from(surface).length > 32) return [];
  const queue: Deinflection[] = [{ surface, base: surface, reasons: [], depth: 0, cost: 0, classes: [], steps: [] }];
  const seen = new Set<string>([surface+'|']);
  for(let index=0;index<queue.length && queue.length<96;index++) {
    const current=queue[index];if(current.depth>=4)continue;
    for(const rule of rules) {
      if(!current.base.endsWith(rule.from) || (current.classes.length && rule.input && !rule.input.some(pos=>current.classes.includes(pos))))continue;
      const base=current.base.slice(0,-rule.from.length)+rule.to;
      if(base===current.base || base.length<2 || current.steps.some(step=>step.from===rule.from && step.to===rule.to))continue;
      const key=base+'|'+rule.classes.join(',');if(seen.has(key))continue;seen.add(key);
      queue.push({surface,base,reasons:[...current.reasons,rule.reason],depth:current.depth+1,cost:current.cost+1,classes:rule.classes,steps:[...current.steps,{from:rule.from,to:rule.to}]});
      if(queue.length>=96)break;
    }
  }
  return queue.slice(1);
}
export function matchesInflectionRules(rulesText: string, candidate: Deinflection): boolean {
  const tags=rulesText.split(/\s+/).filter(Boolean);
  return candidate.classes.some(pos=>tags.some(tag=>tag===pos || (pos==='v5' && /^v5[a-z0-9-]*$/u.test(tag)) || (pos==='vs' && /^vs(?:-[a-z]+)?$/u.test(tag))));
}
export function inflectedReading(reading:string,candidate:Deinflection):string|undefined {
  for(const step of [...candidate.steps].reverse()) {if(!reading.endsWith(step.to))return undefined;reading=reading.slice(0,-step.to.length)+step.from;}
  return reading;
}
@Injectable({providedIn:'root'})
export class JapaneseDeinflectionService { candidates(surface:string):Deinflection[] {return deinflect(surface);} }
