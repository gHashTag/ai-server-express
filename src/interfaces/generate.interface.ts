import { Context, SessionFlavor } from 'grammy';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';

export interface SessionData {
  text: string;
  telegram_id: number;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

export type MyConversation = Conversation<MyContext>;

export type MyContextWithSession = MyContext & SessionFlavor<SessionData>;

export interface GenerationResult {
  image: string | Buffer;
  prompt_id: number;
}

export type ApiResponse = string | string[] | { output: string };

export interface ApiImageResponse {
  data: {
    image: string;
    prompt_id: string;
  };
  message: string;
}
