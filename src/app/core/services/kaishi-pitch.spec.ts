import {kaishiPitch} from './kaishi-pitch';
import {JAPANESE_1500_ENTRIES} from '../../data/japanese-1500.generated';
describe('structured Kaishi pitch',()=>{
 it('renders every existing pitch entry as text/flags without HTML execution',()=>{
  for(const e of JAPANESE_1500_ENTRIES.filter(e=>e.pitchAccentHtml)){const parts=kaishiPitch(e.pitchAccentHtml);expect(parts.length,e.id).toBeGreaterThan(0);expect(parts.some(p=>p.text.includes('<'))).toBe(false);}
 });
 it('rejects executable or unknown tags without inserting Anki markup',()=>{
  for(const html of ['<script>alert(1)</script>','<img src="https://example.invalid/pixel" onerror="alert(1)">','<svg onload="x"/>'])expect(kaishiPitch(html)).toEqual([]);
  expect(kaishiPitch(null)).toEqual([]);expect(kaishiPitch('カタカナ')).toEqual([{text:'カタカナ',high:false,drop:false}]);
 });
});
