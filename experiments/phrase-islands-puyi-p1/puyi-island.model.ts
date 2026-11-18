/** P0 design contract only; never imported by the public Angular application. */
export type Id = string; // UUID generated once; server validates UUIDs and foreign keys.
export interface LocalizedText { es:string; en:string|null; ca:string|null; }
export interface Segment { text:string; reading?:string; }
export interface Island { id:Id; titleJa:string; title:LocalizedText; description:LocalizedText; position:number; revision:number; blockIds:readonly Id[]; }
export interface Block { id:Id; islandId:Id; name:LocalizedText; position:number; revision:number; phraseIds:readonly Id[]; promptIds:readonly Id[]; practice?:{gapSeconds?:number}; }
export interface Phrase { id:Id; blockId:Id; japanese:string; reading:string; segments:readonly Segment[]; natural:LocalizedText; structural:LocalizedText; explanation:LocalizedText; vocabulary:readonly {japanese:string;reading:string;meaning:LocalizedText}[]; originalContextId:Id; register:'informal'|'polite'|'neutral'; position:number; contentRevision:number; audioAssetId:Id|null; status:'draft'|'reviewed'; }
export interface ConversationPrompt { id:Id; blockId:Id; japanese:string; reading:string; translation:LocalizedText; answerPhraseIds:readonly Id[]; audioAssetId:Id|null; revision:number; }
export interface AudioAsset { id:Id; phraseId:Id|null; promptId:Id|null; bucket:'puyi-islands-private'; objectKey:string; revision:number; voice:'aida-shigeru-normal'; engine:'AivisSpeech'; engineVersion:'1.2.0'; modelSha256:string; durationSeconds:number; sha256:string; bytes:number; mime:'audio/mpeg'; synthesisFingerprint:string; provenanceId:Id; }
export interface PrivateOriginalContext {id:Id; source:'user-provided-chat'; text:string; revision:number;}
// Signed URLs, JWTs, membership and selected session duration are NOT audio-asset fields.
// Database authority is RLS, never these client-side types or display names.
