/** Navigation evidence only: no lexical identity, meaning or study state. All indices are base 0. */
export interface MangaOcrOccurrence {
  readonly schemaVersion:1;
  readonly volumeId:string;
  readonly pageIndex:number;
  readonly blockIndex:number;
  readonly lineIndex:number;
  readonly start:number;
  readonly end:number;
  readonly found:string;
  readonly pageFingerprint:string;
  readonly captureFingerprint?:string;
  readonly workspace:string;
  readonly activationRevision:number;
}
