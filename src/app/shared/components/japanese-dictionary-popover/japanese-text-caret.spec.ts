import {japaneseTextCaret} from './japanese-text-caret';
describe('Japanese lesson caret and furigana',()=>{
  it('maps split base text without appending ruby readings or destroying annotations',()=>{
    const region=document.createElement('p');region.lang='ja';region.innerHTML='<ruby>食<rp>（</rp><rt>た</rt><rp>）</rp></ruby><span>べる</span>。';
    const html=region.innerHTML;
    expect(japaneseTextCaret(region,region.querySelector('span')!.firstChild!,1)).toEqual({text:'食べる。',offset:2});
    expect(japaneseTextCaret(region,region.querySelector('rt')!.firstChild!,0)).toEqual({text:'食べる。',offset:0});
    expect(region.innerHTML).toBe(html);
  });
  it('retains UTF-16 offsets for supplementary characters and rejects an unrelated node',()=>{
    const region=document.createElement('p');region.textContent='𠮷田';
    expect(japaneseTextCaret(region,region.firstChild!,1)).toEqual({text:'𠮷田',offset:1});
    expect(japaneseTextCaret(region,document.createTextNode('外'),0)).toBeNull();
  });
});
