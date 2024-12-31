import { Request, Response, NextFunction } from 'express';
import { InputFile } from 'grammy';
import bot from '@/core/bot';
import { generateImage } from '@/services/generateImage';
import { generateSpeech } from '@/services/generateSpeech';
import { generateTextToVideo } from '@/services/generateTextToVideo';
import { generateImageToVideo } from '@/services/generateImageToVideo';
import { generateImageToPrompt } from '@/services/generateImageToPrompt';
import { generateNeuroImage } from '@/services/generateNeuroImage';
import { createAvatarVoice } from '@/services/createAvatarVoice';
import { generateModelTraining } from '@/services/generateModelTraining';
import { imageGenerationCost, processBalanceOperation } from '@/helpers/telegramStars/telegramStars';

export class GenerationController {
  public textToImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, model, telegram_id, username, is_ru } = req.body;
      console.log(req.body, 'req.body');

      if (!prompt) {
        res.status(400).json({ message: 'prompt is required' });
        return;
      }

      if (!model) {
        res.status(400).json({ message: 'model is required' });
        return;
      }

      if (!telegram_id) {
        res.status(400).json({ message: 'telegram_id is required' });
        return;
      }

      if (!username) {
        res.status(400).json({ message: 'username is required' });
        return;
      }

      res.status(200).json({ message: 'Processing started' });

      generateImage(prompt, model, telegram_id, username, is_ru)
        .then(async () => {
          console.log('Генерация изображения завершена:');
          await processBalanceOperation(telegram_id, imageGenerationCost, is_ru);
        })
        .catch(error => {
          console.error('Ошибка при генерации изображения:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public neuroPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, telegram_id, username, num_images, is_ru } = req.body;
      if (!prompt || !telegram_id || !username || !num_images || !is_ru) {
        res.status(400).json({ message: 'Prompt, telegram_id, username, and is_ru are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateNeuroImage(prompt, telegram_id, username, num_images, is_ru)
        .then(async () => {
          console.log('Генерация изображения завершена:');
        })
        .catch(error => {
          console.error('Ошибка при генерации изображения:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public createAvatarVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileUrl, username, telegram_id, is_ru } = req.body;
      if (!fileUrl || !username || !telegram_id || !is_ru) {
        res.status(400).json({ message: 'fileId, username, and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Voice creation started' });

      const voiceId = await createAvatarVoice(fileUrl, telegram_id, username, is_ru);

      console.log('Создание голоса завершено:', voiceId);
    } catch (error) {
      next(error);
    }
  };

  public textToSpeech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, voice_id, telegram_id, username, is_ru } = req.body;
      console.log(req.body, 'req.body');
      if (!text) {
        res.status(400).json({ message: 'Text is required' });
        return;
      }
      if (!voice_id) {
        res.status(400).json({ message: 'Voice_id is required' });
        return;
      }
      if (!telegram_id) {
        res.status(400).json({ message: 'Telegram_id is required' });
        return;
      }
      if (!username) {
        res.status(400).json({ message: 'Username is required' });
        return;
      }
      if (!is_ru) {
        res.status(400).json({ message: 'Is_ru is required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateSpeech({ text, voice_id, telegram_id, username, is_ru })
        .then(async ({ audioUrl }) => {
          console.log('Генерация речи завершена:', audioUrl);
        })
        .catch(error => {
          console.error('Ошибка при генерации речи:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public textToVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, model, telegram_id, username, is_ru } = req.body;
      if (!prompt) {
        res.status(400).json({ message: 'Prompt is required' });
        return;
      }
      if (!model) {
        res.status(400).json({ message: 'Model is required' });
        return;
      }

      if (!telegram_id) {
        res.status(400).json({ message: 'Telegram_id is required' });
        return;
      }
      if (!username) {
        res.status(400).json({ message: 'Username is required' });
        return;
      }
      if (!is_ru) {
        res.status(400).json({ message: 'Is_ru is required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateTextToVideo(prompt, model, telegram_id, username, is_ru)
        .then(async ({ videoPath }) => {
          console.log('Генерация видео завершена:', videoPath);
        })
        .catch(error => {
          console.error('Ошибка при генерации видео:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public imageToVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, prompt, model, telegram_id, username, is_ru } = req.body;
      if (!image) {
        res.status(400).json({ message: 'Image is required' });
        return;
      }
      if (!prompt) {
        res.status(400).json({ message: 'Prompt is required' });
        return;
      }
      if (!model) {
        res.status(400).json({ message: 'Model is required' });
        return;
      }

      if (!telegram_id) {
        res.status(400).json({ message: 'Telegram_id is required' });
        return;
      }
      if (!username) {
        res.status(400).json({ message: 'Username is required' });
        return;
      }
      if (!is_ru) {
        res.status(400).json({ message: 'Is_ru is required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateImageToVideo(image, prompt, model, telegram_id, username, is_ru)
        .then(async videoUrl => {
          console.log('Генерация видео завершена:', videoUrl);
          await bot.api.sendVideo(telegram_id, new InputFile(videoUrl));
        })
        .catch(error => {
          console.error('Ошибка при генерации видео:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public createModelTraining = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { zipUrl, triggerWord, modelName, telegram_id, is_ru } = req.body;
      if (!zipUrl || !triggerWord || !modelName || !telegram_id || !is_ru) {
        res.status(400).json({ message: 'zipUrl, triggerWord, modelName, telegram_id, and is_ru are required' });
        return;
      }
      res.status(200).json({ message: 'Model training started' });

      generateModelTraining(zipUrl, triggerWord, modelName, telegram_id)
        .then(async result => {
          if (result) {
            console.log('Генерация модели завершена:', result.model_id);
            const message = is_ru
              ? `Тренировка модели завершена. Вы можете воспользоваться командой /neuro_photo.`
              : `Model training completed. You can use the command /neuro_photo.`;
            await bot.api.sendMessage(telegram_id, message);
          } else {
            console.error('Ошибка при генерации модели.');
          }
        })
        .catch(error => {
          console.error('Ошибка при генерации модели:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public imageToPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, telegram_id } = req.body;
      if (!image || !telegram_id) {
        res.status(400).json({ message: 'Image and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateImageToPrompt(image)
        .then(async caption => {
          console.log('Генерация описания завершена:', caption);

          await bot.api.sendMessage(telegram_id, '```\n' + caption + '\n```', { parse_mode: 'MarkdownV2' });
        })
        .catch(error => {
          console.error('Ошибка при генерации описания:', error);
        });
    } catch (error) {
      next(error);
    }
  };
}
