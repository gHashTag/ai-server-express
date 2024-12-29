import { Bot } from 'grammy';
import { MyContextWithSession } from '@/interfaces/generate.interface';

const bot = new Bot<MyContextWithSession>(process.env.BOT_TOKEN || '');

export default bot;
