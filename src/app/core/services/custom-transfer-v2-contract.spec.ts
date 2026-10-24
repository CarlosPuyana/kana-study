import {describe,it,expect} from 'vitest';
import {assertCustomTransferEnvelopeV2,customTransferTextHashV2,prepareCustomTransferChunkV2} from './custom-transfer-v2-contract';
describe('prepared V2 remote boundary (no client integration)',()=>{
 it('hashes exact escaped UTF-8 text, with a standard SHA-256 vector',async()=>{
  expect(await customTransferTextHashV2('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  expect(await customTransferTextHashV2('{"猫":"\\\""}')).not.toBe(await customTransferTextHashV2('{ "猫":"\\\""}'));
  await expect(customTransferTextHashV2('\ud800')).rejects.toThrow();
 });
 it('counts outer JSON escaping rather than just raw chunk text',()=>{
  const base={schemaVersion:2 as const,operationId:'chunk',transferId:'import',expectedRevision:'1',action:'chunk' as const,index:0};
  expect(()=>assertCustomTransferEnvelopeV2({...base,body:'猫'.repeat(100)})).not.toThrow();
  expect(()=>assertCustomTransferEnvelopeV2({...base,body:'"'.repeat(270000)})).toThrow();
 });
 it('rejects invalid indices and empty chunks without an upload',async()=>{
  await expect(prepareCustomTransferChunkV2([],0)).rejects.toThrow();
  await expect(prepareCustomTransferChunkV2([],128)).rejects.toThrow();
 });
});
