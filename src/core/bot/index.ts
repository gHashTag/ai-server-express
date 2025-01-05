import { Telegraf } from 'telegraf';

export const isDev = process.env.NODE_ENV === 'development';

if (!process.env.TELEGRAM_BOT_TOKEN_DEV) {
  throw new Error('TELEGRAM_BOT_TOKEN_DEV is not set');
}

if (!process.env.TELEGRAM_BOT_TOKEN_PROD) {
  throw new Error('TELEGRAM_BOT_TOKEN_PROD is not set');
}

export const BOT_TOKEN = isDev ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN_PROD;

if (!BOT_TOKEN) {
  throw new Error('!!!!! BOT_TOKEN is not set !!!!!');
}
// Явно указываем тип Telegraf для переменной bot
const bot: Telegraf = new Telegraf(BOT_TOKEN);

export default bot;
