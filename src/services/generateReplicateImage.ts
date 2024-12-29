import { models, replicate } from '../core/replicate';
import axios from 'axios';
import { incrementGeneratedImages, getAspectRatio, savePrompt } from '../core/supabase/ai';
import { downloadFile } from '@/helpers/downloadFile';

export interface GenerationResult {
  image: string | Buffer;
  prompt_id: number | null;
}

interface ApiResponse {
  data: {
    image: string;
    prompt_id: string;
  };
  message: string;
}

export async function processApiResponse(output: unknown): Promise<string> {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  if (output && typeof output === 'object' && 'output' in output) {
    const obj = output as { output: string };
    return obj.output;
  }
  throw new Error(`Некорректный ответ от API: ${JSON.stringify(output)}`);
}

export async function fetchImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    validateStatus: status => status === 200,
    timeout: 30000,
  });
  return Buffer.from(response.data);
}

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
    let output: ApiResponse = { data: { image: '', prompt_id: '' }, message: '' };

    let retries = 1;

    while (retries > 0) {
      try {
        const modelKey = modelConfig.key as `${string}/${string}` | `${string}/${string}:${string}`;
        console.log(modelKey, 'modelKey');
        output = (await replicate.run(modelKey, { input })) as ApiResponse;
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
