import { ApiImageResponse, GenerationResult } from '@/interfaces/generate.interface';
import { models, replicate } from '../core/replicate';
import { getAspectRatio, savePrompt } from '../core/supabase/ai';
import { downloadFile } from '@/helpers/downloadFile';
import { processApiResponse } from '@/helpers/processApiResponse';
import { pulse } from '@/helpers/pulse';
import bot from '@/core/bot';
import { InputFile } from 'grammy';
import { textToImageGenerationCost, processBalanceOperation } from '@/helpers/telegramStars/telegramStars';

export const generateTextToImage = async (
  prompt: string,
  model_type: string,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<GenerationResult> => {
  try {
    console.log(telegram_id, 'telegram_id generateImage');

    const balanceCheck = await processBalanceOperation({ telegram_id, operationCost: textToImageGenerationCost, is_ru });
    console.log(balanceCheck, 'balanceCheck generateImage');
    if (!balanceCheck.success) {
      throw new Error('Not enough stars');
    }
    await bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация...' : '⏳ Generating...');

    const modelConfig = models[model_type];
    console.log(modelConfig, 'modelConfig');

    if (!modelConfig) {
      throw new Error(`Неподдерживаемый тип модели: ${model_type}`);
    }
    const aspect_ratio = await getAspectRatio(telegram_id);
    console.log(aspect_ratio, 'aspect_ratio generateImage');
    const input = modelConfig.getInput(`${modelConfig.word} ${prompt}`, aspect_ratio);
    console.log(input, 'input');

    try {
      const modelKey = modelConfig.key as `${string}/${string}` | `${string}/${string}:${string}`;

      const output: ApiImageResponse = (await replicate.run(modelKey, { input })) as ApiImageResponse;
      const imageUrl = await processApiResponse(output);
      const prompt_id = await savePrompt(prompt, modelKey, imageUrl, telegram_id);
      const image = await downloadFile(imageUrl);
      console.log(image, 'image');
      await bot.api.sendPhoto(telegram_id, new InputFile(image));

      await bot.api.sendMessage(
        telegram_id,
        is_ru
          ? `Ваше изображение сгенерировано!\n\nСгенерировать еще?\n\nСтоимость: ${textToImageGenerationCost.toFixed(
              2,
            )} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
          : `Your image has been generated!\n\nGenerate more?\n\nCost: ${textToImageGenerationCost.toFixed(
              2,
            )} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '1️⃣', callback_data: `generate_1_${prompt_id}` },
                { text: '2️⃣', callback_data: `generate_2_${prompt_id}` },
                { text: '3️⃣', callback_data: `generate_3_${prompt_id}` },
                { text: '4️⃣', callback_data: `generate_4_${prompt_id}` },
              ],
              [{ text: is_ru ? '⬆️ Улучшить промпт' : '⬆️ Improve prompt', callback_data: `improve_photo_${prompt_id}` }],
              [{ text: is_ru ? '📐 Изменить размер' : '📐 Change size', callback_data: 'change_size' }],
            ],
          },
        },
      );

      const pulseImage = Buffer.isBuffer(image) ? `data:image/jpeg;base64,${image.toString('base64')}` : image;
      await pulse(pulseImage, prompt, `/${model_type}`, telegram_id, username, is_ru);

      return { image, prompt_id };
    } catch (error) {
      console.error(`Попытка не удалась:`, error);
      throw new Error('Все попытки генерации изображения исчерпаны');
    }
  } catch (error) {
    console.error('Ошибка при генерации изображения:', error);
    throw error;
  }
};
