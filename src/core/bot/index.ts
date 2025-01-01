import { Bot } from 'grammy';
import { MyContextWithSession } from '@/interfaces/generate.interface';

export const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log('DEV');
} else {
  console.log('PROD');
}

if (!process.env.TELEGRAM_BOT_TOKEN_DEV || !process.env.TELEGRAM_BOT_TOKEN_PROD) {
  throw new Error('TELEGRAM_BOT_TOKEN_DEV or TELEGRAM_BOT_TOKEN_PROD is not set');
}

const token = isDev ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN_PROD;
const bot = new Bot<MyContextWithSession>(token || '');

export default bot;
