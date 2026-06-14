import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export const env = {
  get crmBackendUrl(): string {
    return process.env.CRM_BACKEND_URL || 'http://localhost:3000';
  },
  get port(): number {
    return Number(process.env.PORT || 3001);
  },
};
