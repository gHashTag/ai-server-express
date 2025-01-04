import bot from '@/core/bot';
import { replicate } from '@/core/replicate';
import { supabase } from '@/core/supabase';
import { downloadFile } from '@/helpers/downloadFile';
import { pulse } from '@/helpers/pulse';
import { calculateFinalPrice, processBalanceOperation, sendBalanceMessage, textToVideoGenerationCost } from '@/helpers/telegramStars/telegramStars';
import { writeFile } from 'fs/promises';
import { InputFile } from 'grammy';

export const generateTextToVideo = async (
  prompt: string,
  videoModel: string,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<{ videoPath: string }> => {
  try {
    if (!prompt) throw new Error('Prompt is required');
    if (!videoModel) throw new Error('Video model is required');
    if (!telegram_id) throw new Error('Telegram ID is required');
    if (!username) throw new Error('Username is required');
    if (!is_ru) throw new Error('is_ru is required');

    console.log('generateTextToVideo', prompt, videoModel, telegram_id, username, is_ru);
    // Проверка баланса для всех изображений
    const balanceCheck = await processBalanceOperation({ telegram_id, paymentAmount: calculateFinalPrice(videoModel as VideoModel), is_ru });
    if (!balanceCheck.success) {
      throw new Error(balanceCheck.error);
    }
    let output: any;

    bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация видео...' : '⏳ Generating video...');

    if (videoModel === 'haiper') {
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
      storage_path: `videos/${videoModel}/${new Date().toISOString()}`,
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

    await bot.api.sendMessage(
      telegram_id,
      is_ru
        ? `Ваше видео сгенерировано!\n\nСгенерировать еще?\n\nСтоимость: ${textToVideoGenerationCost.toFixed(
            2,
          )} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
        : `Your video has been generated!\n\nGenerate more?\n\nCost: ${textToVideoGenerationCost.toFixed(
            2,
          )} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
      {
        reply_markup: {
          keyboard: [[{ text: is_ru ? '🎥 Сгенерировать новое видео?' : '🎥 Generate new video?' }]],
          resize_keyboard: false,
        },
      },
    );

    await sendBalanceMessage(telegram_id, balanceCheck.newBalance, textToVideoGenerationCost, is_ru);

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
