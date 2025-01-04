import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import elevenLabsClient from '@/core/elevenlabs';
import bot from '@/core/bot';
import { InputFile } from 'grammy';
import { processBalanceOperation, sendBalanceMessage, speechGenerationCost } from '@/helpers/telegramStars/telegramStars';
import { pulse } from '@/helpers/pulse';

export const generateSpeech = async ({
  text,
  voice_id,
  telegram_id,
  username,
  is_ru,
}: {
  text: string;
  voice_id: string;
  telegram_id: number;
  username: string;
  is_ru: boolean;
}): Promise<{ audioUrl: string }> => {
  // Логируем входные данные
  console.log('Attempting to create audio with:', {
    voice_id,
    textLength: text.length,
    telegram_id,
    username,
    apiKeyPresent: !!process.env.ELEVENLABS_API_KEY,
    apiKeyPrefix: process.env.ELEVENLABS_API_KEY?.substring(0, 5),
  });
  // Проверка баланса для всех изображений
  const balanceCheck = await processBalanceOperation({ telegram_id, paymentAmount: speechGenerationCost, is_ru });
  if (!balanceCheck.success) {
    throw new Error(balanceCheck.error);
  }

  return new Promise<{ audioUrl: string }>(async (resolve, reject) => {
    try {
      // Проверяем наличие API ключа
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY отсутствует');
      }
      bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация аудио...' : '⏳ Generating audio...');
      // Логируем попытку генерации
      console.log('Generating audio stream...');

      const audioStream = await elevenLabsClient.generate({
        voice: voice_id,
        model_id: 'eleven_turbo_v2_5',
        text,
      });

      // Логируем успешную генерацию
      console.log('Audio stream generated successfully');

      const audioUrl = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);
      const writeStream = createWriteStream(audioUrl);

      audioStream.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log('Audio file written successfully to:', audioUrl);
        bot.api.sendAudio(telegram_id, new InputFile(audioUrl));
        sendBalanceMessage(telegram_id, balanceCheck.newBalance, speechGenerationCost, is_ru);
        pulse(audioUrl, text, 'text-to-speech', telegram_id, username, is_ru);
        resolve({ audioUrl });
      });

      writeStream.on('error', error => {
        console.error('Error writing audio file:', error);
        reject(error);
      });
    } catch (error: any) {
      console.error('Error in createAudioFileFromText:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
      });
      reject(error);
    }
  });
};
