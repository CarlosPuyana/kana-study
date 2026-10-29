export interface KaishiPitchPart {readonly text:string;readonly high:boolean;readonly drop:boolean}
/** Recognize the catalog's limited span notation; emit text and flags, never HTML/CSS. */
export function kaishiPitch(html:string|null|undefined):readonly KaishiPitchPart[]{
  if(!html||html.length>10000)return [];const result:KaishiPitchPart[]=[];let rest=html.replace(/<span style="color: (?:red|royalblue|rgb\(65, 105, 225\));">([^<>]*)<\/span>/g,'$1').replace(/<span style="display:inline-block;position:relative;(?:padding-right:0.1em;margin-right:0.1em;)?"><\/span>/g,'');
  while(rest){
    if(rest.startsWith('<br>')||rest.startsWith('<br/>')||rest.startsWith('<br />')){rest=rest.replace(/^<br\s*\/?>/,'');result.push({text:' / ',high:false,drop:false});continue;}
    const span=/^<span style="[^"<>]{1,700}"><span style="display:inline;">([^<>]{1,200})<\/span><span style="([^"<>]{1,1000})">(?:<br\s*\/?>)?<\/span><\/span>/.exec(rest);
    if(span){result.push({text:span[1],high:span[2].includes('border-top-style:solid'),drop:span[2].includes('border-right-style:solid')});rest=rest.slice(span[0].length);continue;}
    const overline=/^<span style="text-decoration:overline;">([^<>]{1,200})<\/span>/.exec(rest);
    if(overline){result.push({text:overline[1],high:true,drop:false});rest=rest.slice(overline[0].length);continue;}
    const text=/^[^<>]+/.exec(rest);if(!text)return [];result.push({text:text[0],high:false,drop:false});rest=rest.slice(text[0].length);
  }
  return result;
}
