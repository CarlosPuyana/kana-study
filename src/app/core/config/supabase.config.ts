import { safeReturnUrl } from '../services/return-navigation';
export interface KanaStudyRuntimeConfig {
  readonly supabaseUrl?: string;
  readonly supabasePublishableKey?: string;
}

declare global {
  interface Window {
    __KANA_STUDY_CONFIG__?: KanaStudyRuntimeConfig;
  }
}

export interface SupabasePublicConfig {
  readonly url: string;
  readonly publishableKey: string;
  readonly configured: boolean;
}

export function readSupabaseConfig(): SupabasePublicConfig {
  const runtime = typeof window === 'undefined' ? {} : window.__KANA_STUDY_CONFIG__ ?? {};
  const url = runtime.supabaseUrl?.trim() ?? '';
  const publishableKey = runtime.supabasePublishableKey?.trim() ?? '';
  return { url, publishableKey, configured: /^https:\/\/.+\.supabase\.co$/i.test(url) && publishableKey.length > 20 };
}

export function authReturnUrl(mode?: 'recovery' | 'confirm', returnUrl?:string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  if(!mode)return base;
  const params=new URLSearchParams({auth:mode});
  if(returnUrl)params.set('return',safeReturnUrl(returnUrl));
  return `${base}?${params}`;
}
