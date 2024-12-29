import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import elevenLabsClient from '@/core/elevenlabs';

export const generateSpeech = async ({ text, voice_id }: { text: string; voice_id: string }): Promise<{ audioUrl: string }> => {
  // Логируем входные данные
  console.log('Attempting to create audio with:', {
    voice_id,
    textLength: text.length,
    apiKeyPresent: !!process.env.ELEVENLABS_API_KEY,
    apiKeyPrefix: process.env.ELEVENLABS_API_KEY?.substring(0, 5),
  });

  return new Promise<{ audioUrl: string }>(async (resolve, reject) => {
    try {
      // Проверяем наличие API ключа
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY отсутствует');
      }

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
