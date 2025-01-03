import { pulse } from '@/helpers/pulse';
import { processBalanceOperation, sendBalanceMessage, imageToPromptCost } from '@/helpers/telegramStars/telegramStars';
import axios from 'axios';
import bot from '@/core/bot';

export async function generateImageToPrompt(imageUrl: string, telegram_id: number, username: string, is_ru: boolean): Promise<string> {
  try {
    console.log('generateImageToPrompt', imageUrl, telegram_id, username, is_ru);
    console.log('imageToPromptCost', imageToPromptCost);
    const balanceCheck = await processBalanceOperation({ telegram_id, operationCost: imageToPromptCost, is_ru });
    console.log('balanceCheck', balanceCheck);
    if (!balanceCheck.success) {
      throw new Error('Not enough stars');
    }

    bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация промпта...' : '⏳ Generating prompt...');

    const initResponse = await axios.post(
      'https://fancyfeast-joy-caption-alpha-two.hf.space/call/stream_chat',
      {
        data: [{ path: imageUrl }, 'Descriptive', 'long', ['Describe the image in detail, including colors, style, mood, and composition.'], '', ''],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      },
    );

    const eventId = initResponse.data?.event_id || initResponse.data;
    if (!eventId) {
      throw new Error('No event ID in response');
    }

    const resultResponse = await axios.get(`https://fancyfeast-joy-caption-alpha-two.hf.space/call/stream_chat/${eventId}`, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (!resultResponse.data) {
      throw new Error('Image to prompt: No data in response');
    }

    const responseText = resultResponse.data as string;
    const lines = responseText.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (Array.isArray(data) && data.length > 1) {
            const caption = data[1];
            await bot.api.sendMessage(telegram_id, '```\n' + caption + '\n```', { parse_mode: 'MarkdownV2' });
            await pulse(imageUrl, caption, 'image-to-prompt', telegram_id, username, is_ru);
            await sendBalanceMessage(telegram_id, balanceCheck.newBalance, imageToPromptCost, is_ru);
            return caption;
          }
        } catch (e) {
          console.error('Error parsing JSON from line:', line, e);
        }
      }
    }

    throw new Error('No valid caption found in response');
  } catch (error) {
    console.error('Joy Caption API error:', error);
    throw error;
  }
}
