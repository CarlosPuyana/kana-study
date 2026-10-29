export const KAISHI_PACKAGE = {
  bytes: 102049547,
  sha256: '3fdaef081150b09e1f58be4637d261903b95a9e7d60374467d5facee5b0387df',
  url: 'https://github.com/Dogi5/Kaishi-ESP/releases/download/v1.0.1/Kaishi.1.5k.Espanol.apkg',
  resources: 4353, links: 1500, unpackedBytes: 109484291,
} as const;
export type KaishiMediaKind = 'wordAudio' | 'sentenceAudio' | 'picture';
export type KaishiReference = readonly [zipEntry: string, bytes: number, sha1: string, type: 'audio/mpeg' | 'image/webp' | 'image/png' | 'image/jpeg'];
export interface KaishiMediaLink { readonly id: string; readonly wordAudio?: KaishiReference; readonly sentenceAudio?: KaishiReference; readonly picture: KaishiReference }
export interface KaishiResource { readonly id: string; readonly blob: Blob }
export interface KaishiInstallation { readonly id: string; readonly phase: 'installing' | 'ready'; readonly count: number; readonly bytes: number; readonly installedAt: number }
export type KaishiImportPhase = 'idle' | 'checking' | 'installing' | 'installed' | 'cancelled' | 'error';
export type KaishiErrorCode = 'package' | 'format' | 'resource' | 'quota' | 'storage' | 'worker';
export class KaishiMediaError extends Error { constructor(readonly code: KaishiErrorCode) { super(code); } }
export const KAISHI_RESOURCE_LIMIT = 512 * 1024;
