import { API_URL } from '@/config';
import bot from '@/core/bot';
import { replicate } from '@/core/replicate';

import { saveVideoUrlToSupabase } from '@/core/supabase/saveVideoUrlToSupabase';
import { downloadFile } from '@/helpers/downloadFile';
import { errorMessageAdmin } from '@/helpers/errorMessageAdmin';

import { processBalanceOperation, imageToVideoGenerationCost } from '@/price/helpers';

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { InputFile } from 'telegraf/typings/core/types/typegram';

interface ReplicateResponse {
  id: string;
  output: string;
}

type shortModelUrl = `${string}/${string}`;

export const generateImageToVideo = async (
  imageUrl: string,
  prompt: string,
  videoModel: string,
  paymentAmount: number,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<{ videoUrl?: string; prediction_id?: string } | string> => {
  try {
    console.log('Start generateImageToVideo', { imageUrl, prompt, videoModel, paymentAmount, telegram_id, username, is_ru });
    if (!imageUrl) throw new Error('Image is required');
    if (!prompt) throw new Error('Prompt is required');
    if (!videoModel) throw new Error('Video model is required');
    if (!telegram_id) throw new Error('Telegram ID is required');
    if (!username) throw new Error('Username is required');
    if (!is_ru) throw new Error('Is RU is required');

    const balanceCheck = await processBalanceOperation({ telegram_id, paymentAmount, is_ru });

    if (!balanceCheck.success) {
      throw new Error(balanceCheck.error);
    }

    bot.telegram.sendMessage(telegram_id, is_ru ? '⏳ Генерация видео...' : '⏳ Generating video...');

    const runModel = async (model: `${string}/${string}` | `${string}/${string}:${string}`, input: any): Promise<ReplicateResponse> => {
      const result = (await replicate.run(model, { input })) as ReplicateResponse;

      return result;
    };

    let result: ReplicateResponse | string;

    switch (videoModel) {
      case 'minimax':
        const imageBuffer = await downloadFile(imageUrl);
        result = await runModel('minimax/video-01' as shortModelUrl, {
          prompt,
          first_frame_image: imageBuffer,
        });
        break;

      case 'haiper':
        result = await runModel('haiper-ai/haiper-video-2' as shortModelUrl, {
          prompt,
          duration: 6,
          aspect_ratio: '16:9',
          use_prompt_enhancer: true,
          frame_image_url: imageUrl,
        });
        break;

      case 'ray':
        result = await runModel('luma/ray' as shortModelUrl, {
          prompt,
          aspect_ratio: '16:9',
          loop: false,
          start_image_url: imageUrl,
        });
        break;

      case 'i2vgen-xl':
        result = await runModel('ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4' as shortModelUrl, {
          image: imageUrl,
          prompt,
          max_frames: 16,
          guidance_scale: 9,
          num_inference_steps: 50,
        });
        break;

      default:
        throw new Error('Unsupported service');
    }
    console.log(result, 'result');
    const videoUrl = result?.output ? result.output : result;
    // const videoUrl = 'https://replicate.delivery/czjl/jicf4ChG3hX3JKDF0OtGXb26utKkYutrNkYdMW5lVxO8kiCKA/tmplcjb5712.mp4';
    // console.log(videoUrl, 'videoUrl');

    if (videoUrl) {
      const videoLocalPath = path.join(__dirname, '../uploads', telegram_id.toString(), 'video', `${new Date().toISOString()}.mp4`);
      console.log(videoLocalPath, 'videoLocalPath');
      await mkdir(path.dirname(videoLocalPath), { recursive: true });

      const videoBuffer = await downloadFile(videoUrl as string);
      await writeFile(videoLocalPath, videoBuffer);

      await saveVideoUrlToSupabase(telegram_id, videoUrl as string, videoLocalPath, videoModel);

      const video = { source: videoLocalPath };

      await bot.telegram.sendVideo(telegram_id, video as InputFile);
      await bot.telegram.sendMessage(
        telegram_id,
        is_ru
          ? `Ваше видео сгенерировано!\n\nСгенерировать еще?\n\nСтоимость: ${imageToVideoGenerationCost.toFixed(
              2,
            )} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
          : `Your video has been generated!\n\nGenerate more?\n\nCost: ${imageToVideoGenerationCost.toFixed(
              2,
            )} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
        {
          reply_markup: {
            keyboard: [[{ text: is_ru ? '🎥 Сгенерировать новое видео?' : '🎥 Generate new video?' }]],
            resize_keyboard: false,
          },
        },
      );
      await bot.telegram.sendVideo('@neuro_blogger_pulse', video as InputFile, {
        caption: is_ru
          ? `${username} Telegram ID: ${telegram_id} сгенерировал видео с промптом: ${prompt} \n\n Команда: ${videoModel}`
          : `${username} Telegram ID: ${telegram_id} generated a video with a prompt: ${prompt} \n\n Command: ${videoModel}`,
      });
    }

    return { videoUrl: videoUrl as string };
  } catch (error) {
    console.error('Error in generateImageToVideo:', error);
    bot.telegram.sendMessage(
      telegram_id,
      is_ru
        ? `Произошла ошибка при генерации видео. Попробуйте еще раз.\n\nОшибка: ${error.message}`
        : `An error occurred during video generation. Please try again.\n\nError: ${error.message}`,
    );
    errorMessageAdmin(error as Error);
    throw error;
  }
};
