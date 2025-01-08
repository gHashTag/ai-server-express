import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const isDev = process.env.NODE_ENV === 'development';

if (!process.env.TELEGRAM_BOT_TOKEN_DEV) {
  throw new Error('TELEGRAM_BOT_TOKEN_DEV is not set');
}

if (!process.env.TELEGRAM_BOT_TOKEN_PROD) {
  throw new Error('TELEGRAM_BOT_TOKEN_PROD is not set');
}

export const BOT_TOKEN = isDev ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN_PROD;

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
