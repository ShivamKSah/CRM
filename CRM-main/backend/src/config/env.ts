import { loadEnv, requireEnv } from './loadEnv.js';

loadEnv();

export const env = {
  get supabaseUrl(): string {
    return requireEnv('SUPABASE_URL');
  },
  get supabaseServiceRoleKey(): string {
    return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  },
  get geminiApiKey(): string {
    return requireEnv('GEMINI_API_KEY');
  },
  get channelServiceUrl(): string {
    return process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';
  },
  get port(): number {
    return Number(process.env.PORT || 3000);
  },
};

/** Validate required backend env vars at startup. */
export function validateBackendEnv(): void {
  env.supabaseUrl;
  env.supabaseServiceRoleKey;
  env.geminiApiKey;
}
