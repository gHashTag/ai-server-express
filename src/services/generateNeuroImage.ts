import { replicate } from '../core/replicate';
import { getAspectRatio, savePrompt } from '../core/supabase/ai';

import { processApiResponse } from '@/helpers/processApiResponse';
import { GenerationResult } from '@/interfaces/generate.interface';
import { supabase } from '@/core/supabase';
import { downloadFile } from '@/helpers/downloadFile';
import bot from '@/core/bot';
import { InputFile } from 'grammy';
import { pulse } from '@/helpers/pulse';
import { imageNeuroGenerationCost, processBalanceOperation } from '@/helpers/telegramStars/telegramStars';

export async function generateNeuroImage(
  prompt: string,
  telegram_id: number,
  username: string,
  num_images: number,
  is_ru: boolean,
): Promise<GenerationResult | null> {
  console.log('Starting generateNeuroImage with:', { prompt, telegram_id, num_images });

  try {
    // Проверка баланса для всех изображений
    const totalCost = imageNeuroGenerationCost * num_images;
    const balanceCheck = await processBalanceOperation(telegram_id, totalCost, is_ru);
    if (!balanceCheck.success) {
      throw new Error(balanceCheck.error);
    }

    // Получаем настройки модели один раз
    const { data, error } = await supabase
      .from('model_trainings')
      .select('model_url')
      .eq('user_id', telegram_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Model type not found for this user.');
    }

    const model_type = data.model_url;
    const aspect_ratio = await getAspectRatio(telegram_id);
    const results: GenerationResult[] = [];
    const input = {
      prompt,
      negative_prompt: 'nsfw, erotic, violence, bad anatomy...',
      num_inference_steps: 28,
      guidance_scale: 7,
      ...(aspect_ratio === '1:1'
        ? { width: 1024, height: 1024 }
        : aspect_ratio === '16:9'
        ? { width: 1368, height: 768 }
        : aspect_ratio === '9:16'
        ? { width: 768, height: 1368 }
        : { width: 1024, height: 1024 }),
      sampler: 'flowmatch',
      num_outputs: 1,
      aspect_ratio,
    };

    // Цикл генерации изображений
    for (let i = 0; i < num_images; i++) {
      console.log(`Generating image ${i + 1} of ${num_images}`);
      bot.api.sendMessage(telegram_id, `Generating image ${i + 1} of ${num_images}`);

      const output = await replicate.run(model_type, { input });
      const imageUrl = await processApiResponse(output);

      if (!imageUrl || imageUrl.endsWith('empty.zip')) {
        console.error(`Failed to generate image ${i + 1}`);
        continue;
      }

      const image = await downloadFile(imageUrl);
      const prompt_id = await savePrompt(prompt, model_type, imageUrl, telegram_id);

      if (prompt_id === null) {
        console.error(`Failed to save prompt for image ${i + 1}`);
        continue;
      }

      // Отправляем каждое изображение
      await bot.api.sendPhoto(telegram_id, new InputFile(image));

      // Сохраняем результат
      results.push({ image, prompt_id });

      // Отправляем в pulse
      const pulseImage = Buffer.isBuffer(image) ? `data:image/jpeg;base64,${image.toString('base64')}` : image;
      await pulse(pulseImage, prompt, `/${model_type}`, telegram_id, username, is_ru);
    }

    // Отправляем финальное сообщение после всех изображений
    await bot.api.sendMessage(
      telegram_id,
      is_ru
        ? `Генерация завершена!\n\nСтоимость: ${totalCost.toFixed(2)} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
        : `Generation completed!\n\nCost: ${totalCost.toFixed(2)} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1️⃣', callback_data: `generate_1_${results[0]?.prompt_id}` },
              { text: '2️⃣', callback_data: `generate_2_${results[0]?.prompt_id}` },
              { text: '3️⃣', callback_data: `generate_3_${results[0]?.prompt_id}` },
              { text: '4️⃣', callback_data: `generate_4_${results[0]?.prompt_id}` },
            ],
            [
              { text: is_ru ? '⬆️ Улучшить промпт' : '⬆️ Improve prompt', callback_data: `improve_neuro_photo_${results[0]?.prompt_id}` },
              { text: is_ru ? '📐 Изменить размер' : '📐 Change size', callback_data: 'change_size' },
            ],
          ],
        },
      },
    );

    return results[0] || null;
  } catch (error) {
    console.error('Error in generateNeuroImage:', error);
    throw error;
  }
}
