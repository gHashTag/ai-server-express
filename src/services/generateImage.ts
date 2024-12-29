import { ApiImageResponse, GenerationResult } from '@/interfaces/generate.interface';
import { models, replicate } from '../core/replicate';
import { incrementGeneratedImages, getAspectRatio, savePrompt } from '../core/supabase/ai';
import { downloadFile } from '@/helpers/downloadFile';
import { processApiResponse } from '@/helpers/processApiResponse';

export const generateImage = async (prompt: string, model_type: string, telegram_id: number): Promise<GenerationResult> => {
  try {
    await incrementGeneratedImages(telegram_id);
    const aspect_ratio = await getAspectRatio(telegram_id);
    console.log(aspect_ratio, 'aspect_ratio generateImage');

    const modelConfig = models[model_type];
    console.log(modelConfig, 'modelConfig');
    if (!modelConfig) {
      throw new Error(`Неподдерживаемый тип модели: ${model_type}`);
    }

    console.log(JSON.stringify(modelConfig), 'modelConfig');

    const input = modelConfig.getInput(`${modelConfig.word} ${prompt}`, aspect_ratio);
    console.log(input, 'input');
    let output: ApiImageResponse = { data: { image: '', prompt_id: '' }, message: '' };

    let retries = 1;

    while (retries > 0) {
      try {
        const modelKey = modelConfig.key as `${string}/${string}` | `${string}/${string}:${string}`;
        console.log(modelKey, 'modelKey');
        output = (await replicate.run(modelKey, { input })) as ApiImageResponse;
        const imageUrl = await processApiResponse(output);
        const prompt_id = await savePrompt(prompt, modelKey, imageUrl, telegram_id);
        const image = await downloadFile(imageUrl);
        return { image, prompt_id };
      } catch (error) {
        console.error(`Попытка ${4 - retries} не удалась:`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Все попытки генерации изображения исчерпаны');
  } catch (error) {
    console.error('Ошибка при генерации изображения:', error);
    throw error;
  }
};
