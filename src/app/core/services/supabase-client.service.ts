import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from '../config/supabase.config';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly config = readSupabaseConfig();
  private readonly promise: Promise<SupabaseClient | null> = this.config.configured
    ? import('@supabase/supabase-js').then(({ createClient }) => createClient(this.config.url, this.config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }))
    : Promise.resolve(null);

  getClient(): Promise<SupabaseClient | null> { return this.promise; }
}
