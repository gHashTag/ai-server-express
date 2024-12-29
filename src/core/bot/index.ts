import { Bot } from 'grammy';
import { MyContextWithSession } from '@/types';

const bot = new Bot<MyContextWithSession>(process.env.BOT_TOKEN || '');

export default bot;
