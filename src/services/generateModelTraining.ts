import { replicate } from '@/core/replicate';

import { createModelTraining, updateModelTraining, ModelTrainingUpdate } from '@/core/supabase';

interface ApiError extends Error {
  response?: {
    status: number;
  };
}

interface TrainingInput {
  steps: number;
  lora_rank: number;
  optimizer: string;
  batch_size: number;
  resolution: string;
  autocaption: boolean;
}

interface TrainingResponse {
  id: string;
  status: string;
  urls: { get: string };
  error?: string;
}

interface ModelTrainingResult {
  model_id: string;
  modelFile: Buffer; // Или другой тип, который вы используете для файла модели
}

export async function generateModelTraining(
  zipUrl: string,
  triggerWord: string,
  modelName: string,
  telegram_id: string,
): Promise<ModelTrainingResult> {
  let currentTraining: TrainingResponse | null = null;

  try {
    if (!process.env.REPLICATE_USERNAME) {
      throw new Error('REPLICATE_USERNAME is not set');
    }

    const destination: `${string}/${string}` = `${process.env.REPLICATE_USERNAME}/${modelName}`;
    console.log('Training configuration:', {
      username: process.env.REPLICATE_USERNAME,
      modelName,
      destination,
      triggerWord,
      zipUrl,
    });

    // Сначала создаем модель
    try {
      const model = await replicate.models.create(process.env.REPLICATE_USERNAME, modelName, {
        description: `LoRA model trained with trigger word: ${triggerWord}`,
        visibility: 'public',
        hardware: 'gpu-t4',
      });
      console.log('Model created:', model);
    } catch (error) {
      console.error('Ошибка API:', error.message);
    }

    // Создаем запись о тренировке
    await createModelTraining({
      user_id: telegram_id,
      model_name: modelName,
      trigger_word: triggerWord,
      zip_url: zipUrl,
    });

    // Создаем тренировку в Replicate
    currentTraining = await replicate.trainings.create(
      'ostris',
      'flux-dev-lora-trainer',
      'e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497',
      {
        destination,
        input: {
          steps: 5000,
          lora_rank: 20,
          optimizer: 'adamw8bit',
          batch_size: 1,
          resolution: '512,768,1024',
          autocaption: true,
          input_images: zipUrl,
          trigger_word: triggerWord,
          learning_rate: 0.0004,
          wandb_project: 'flux_train_replicate',
        } as TrainingInput,
      },
    );

    // Обновляем запись с ID тренировки
    await updateModelTraining(telegram_id, modelName, {
      replicate_training_id: currentTraining.id,
    });

    // Ждем завершения тренировки
    let status = currentTraining.status;
    while (status !== 'succeeded' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const updatedTraining = await replicate.trainings.get(currentTraining.id);
      status = updatedTraining.status;
      console.log(`Training status: ${status}`);

      // Добавляем логирование деталей тренировки
      if (updatedTraining.error) {
        console.error('Training error details from Replicate:', {
          error: updatedTraining.error,
          status: updatedTraining.status,
          id: updatedTraining.id,
        });
      }

      // Обновляем статус в базе
      await updateModelTraining(telegram_id, modelName, { status });
    }

    if (status === 'failed') {
      // Получаем детали ошибки
      const failedTraining = await replicate.trainings.get(currentTraining.id);
      console.error('Training failed details:', {
        error: failedTraining.error,
        status: failedTraining.status,
        id: failedTraining.id,
        urls: failedTraining.urls,
      });

      await updateModelTraining(telegram_id, modelName, {
        status: 'failed',
        error: failedTraining.error || 'Unknown error',
      } as ModelTrainingUpdate);

      throw new Error(`Training failed: ${failedTraining.error || 'Unknown error'}`);
    }

    // Обновляем URL модели
    await updateModelTraining(telegram_id, modelName, {
      status: 'completed',
      model_url: currentTraining.urls.get,
    });

    // Предположим, что model_id и modelFile получены из currentTraining или другого источника
    return {
      model_id: currentTraining.id,
      modelFile: Buffer.from(''), // Замените на фактический файл модели
    };
  } catch (error) {
    console.error('Training error details:', {
      error,
      username: process.env.REPLICATE_USERNAME,
      modelName,
      triggerWord,
      trainingId: currentTraining?.id,
    });

    if ((error as ApiError).response?.status === 404) {
      throw new Error(`Ошибка при создании или доступе к модели. Проверьте REPLICATE_USERNAME (${process.env.REPLICATE_USERNAME}) и права доступа.`);
    }
    throw error;
  }
}
