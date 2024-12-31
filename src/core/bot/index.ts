import { Bot } from 'grammy';
import { MyContextWithSession } from '@/interfaces/generate.interface';

const bot = new Bot<MyContextWithSession>(process.env.TELEGRAM_BOT_TOKEN || '');

export default bot;
