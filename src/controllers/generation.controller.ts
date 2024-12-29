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

export class GenerationController {
  public textToImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, model, telegram_id } = req.body;
      if (!prompt || !model || !telegram_id) {
        res.status(400).json({ message: 'Prompt, model, and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateImage(prompt, model, telegram_id)
        .then(async ({ image }) => {
          console.log('Генерация изображения завершена:', image);
          await bot.api.sendPhoto(telegram_id, new InputFile(image));
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

      const voiceId = await createAvatarVoice(fileUrl, username);

      if (voiceId) {
        console.log('Создание голоса завершено:', voiceId);
        const message = is_ru ? `Создание голоса завершено: \`${voiceId}\`` : `Voice creation completed: \`${voiceId}\``;

        await bot.api.sendMessage(telegram_id, message, {
          parse_mode: 'MarkdownV2',
        });
      } else {
        console.error('Ошибка при создании голоса');
      }
    } catch (error) {
      next(error);
    }
  };

  public textToSpeech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, voice_id, telegram_id } = req.body;
      if (!text || !voice_id || !telegram_id) {
        res.status(400).json({ message: 'Text, voice_id, and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateSpeech({ text, voice_id })
        .then(async ({ audioUrl }) => {
          console.log('Генерация речи завершена:', audioUrl);
          await bot.api.sendAudio(telegram_id, new InputFile(audioUrl));
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
      const { prompt, model, telegram_id } = req.body;
      if (!model || !prompt || !telegram_id) {
        res.status(400).json({ message: 'Model, prompt, and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateTextToVideo(prompt, model, telegram_id)
        .then(async ({ videoPath }) => {
          await bot.api.sendVideo(telegram_id, new InputFile(videoPath));
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
      const { image, prompt, model, telegram_id } = req.body;
      if (!image || !prompt || !model || !telegram_id) {
        res.status(400).json({ message: 'Image, prompt, model, and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateImageToVideo(image, prompt, model)
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

  public neuroPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, telegram_id } = req.body;
      if (!prompt || !telegram_id) {
        res.status(400).json({ message: 'Prompt and telegram_id are required' });
        return;
      }
      res.status(200).json({ message: 'Processing started' });

      generateNeuroImage(prompt, telegram_id)
        .then(async result => {
          if (result) {
            console.log('Генерация изображения завершена:', result.prompt_id);
            await bot.api.sendPhoto(telegram_id, new InputFile(result.image));
          } else {
            console.error('Ошибка при генерации нейрофото.');
          }
        })
        .catch(error => {
          console.error('Ошибка при генерации изображения:', error);
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
