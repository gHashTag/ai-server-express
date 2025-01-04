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
  num_images: number,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<GenerationResult[]> => {
  try {
    console.log(telegram_id, 'telegram_id generateImage');

    const balanceCheck = await processBalanceOperation({ telegram_id, paymentAmount: textToImageGenerationCost * num_images, is_ru });
    console.log(balanceCheck, 'balanceCheck generateImage');
    if (!balanceCheck.success) {
      throw new Error('Not enough stars');
    }

    const modelConfig = models[model_type.toLowerCase()];
    console.log(modelConfig, 'modelConfig');

    if (!modelConfig) {
      throw new Error(`Неподдерживаемый тип модели: ${model_type}`);
    }
    const aspect_ratio = await getAspectRatio(telegram_id);
    console.log(aspect_ratio, 'aspect_ratio generateImage');
    const input = modelConfig.getInput(`${modelConfig.word} ${prompt}`, aspect_ratio);
    console.log(input, 'input');

    const results: GenerationResult[] = [];

    for (let i = 0; i < num_images; i++) {
      try {
        const modelKey = modelConfig.key as `${string}/${string}` | `${string}/${string}:${string}`;
        if (num_images > 1) {
          bot.api.sendMessage(
            telegram_id,
            is_ru ? `⏳ Генерация изображения ${i + 1} из ${num_images}` : `⏳ Generating image ${i + 1} of ${num_images}`,
          );
        } else {
          bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация...' : '⏳ Generating...', {
            reply_markup: { remove_keyboard: true },
          });
        }

        const output: ApiImageResponse = (await replicate.run(modelKey, { input })) as ApiImageResponse;
        const imageUrl = await processApiResponse(output);
        const prompt_id = await savePrompt(prompt, modelKey, imageUrl, telegram_id);
        const image = await downloadFile(imageUrl);
        console.log(image, 'image');
        await bot.api.sendPhoto(telegram_id, new InputFile(image));

        const pulseImage = Buffer.isBuffer(image) ? `data:image/jpeg;base64,${image.toString('base64')}` : image;
        await pulse(pulseImage, prompt, `/${model_type}`, telegram_id, username, is_ru);

        results.push({ image, prompt_id });
      } catch (error) {
        console.error(`Попытка не удалась для изображения ${i + 1}:`, error);
        throw new Error('Все попытки генерации изображения исчерпаны');
      }
    }

    await bot.api.sendMessage(
      telegram_id,
      is_ru
        ? `Ваши изображения сгенерированы!\n\nСгенерировать еще?\n\nСтоимость: ${(textToImageGenerationCost * num_images).toFixed(
            2,
          )} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
        : `Your images have been generated!\n\nGenerate more?\n\nCost: ${(textToImageGenerationCost * num_images).toFixed(
            2,
          )} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '1️⃣' }, { text: '2️⃣' }, { text: '3️⃣' }, { text: '4️⃣' }],
            [{ text: is_ru ? '⬆️ Улучшить промпт' : '⬆️ Improve prompt' }, { text: is_ru ? '📐 Изменить размер' : '📐 Change size' }],
            [{ text: is_ru ? '🏠 Главное меню' : '🏠 Main menu' }],
          ],
          resize_keyboard: false,
        },
      },
    );

    return results;
  } catch (error) {
    console.error('Ошибка при генерации изображений:', error);
    throw error;
  }
};
