import bot from '@/core/bot';
import { replicate } from '@/core/replicate';
import { supabase } from '@/core/supabase';
import { downloadFile } from '@/helpers/downloadFile';
import { pulse } from '@/helpers/pulse';
import { processBalanceOperation, sendBalanceMessage, textToVideoGenerationCost } from '@/helpers/telegramStars/telegramStars';
import { writeFile } from 'fs/promises';
import { InputFile } from 'grammy';

export const generateTextToVideo = async (
  prompt: string,
  model: string,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<{ videoPath: string }> => {
  try {
    console.log('generateTextToVideo', prompt, model, telegram_id, username, is_ru);
    // Проверка баланса для всех изображений
    const totalCost = textToVideoGenerationCost;
    const balanceCheck = await processBalanceOperation(telegram_id, totalCost, is_ru);
    if (!balanceCheck.success) {
      throw new Error(balanceCheck.error);
    }
    let output: any;

    if (model === 'haiper') {
      const input = {
        prompt,
        duration: 6,
        aspect_ratio: '16:9',
        use_prompt_enhancer: true,
      };
      console.log('Haiper model input:', input);
      output = await replicate.run('haiper-ai/haiper-video-2', { input });
    } else {
      const input = {
        prompt,
        prompt_optimizer: true,
      };
      console.log('Minimax model input:', input);
      output = await replicate.run('minimax/video-01', { input });
    }

    console.log('Raw API output:', output);
    console.log('Output type:', typeof output);
    if (Array.isArray(output)) {
      console.log('Output is array of length:', output.length);
    }

    if (!output) {
      throw new Error('No video generated');
    }

    let videoUrl: string;
    if (Array.isArray(output)) {
      if (!output[0]) {
        throw new Error('Empty array or first element is undefined');
      }
      videoUrl = output[0];
    } else if (typeof output === 'string') {
      videoUrl = output;
    } else {
      console.error('Unexpected output format:', JSON.stringify(output, null, 2));
      throw new Error(`Unexpected output format from API: ${typeof output}`);
    }

    console.log('Final video URL:', videoUrl);

    const video = await downloadFile(videoUrl);
    console.log('Video downloaded successfully, size:', video.length, 'bytes');

    // Сохраняем в таблицу assets
    const { data, error } = await supabase.from('assets').insert({
      type: 'video',
      trigger_word: 'video',
      project_id: telegram_id,
      storage_path: `videos/${model}/${new Date().toISOString()}`,
      public_url: videoUrl,
      text: prompt,
    });

    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Video metadata saved to database:', data);
    }
    const videoBuffer = await downloadFile(videoUrl);
    const videoPath = `temp_${Date.now()}.mp4`;
    await writeFile(videoPath, videoBuffer);

    await bot.api.sendVideo(telegram_id, new InputFile(videoPath));

    await sendBalanceMessage(telegram_id, is_ru, balanceCheck.newBalance);

    await pulse(videoPath, prompt, 'text-to-video', telegram_id, username, is_ru);

    return { videoPath };
  } catch (error) {
    console.error('Error generating video:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
