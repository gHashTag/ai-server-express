import { Request, Response, NextFunction } from 'express';
import { InputFile } from 'grammy';
import bot from '@/core/bot';
import { generateTextToImage } from '@/services/generateTextToImage';
import { generateSpeech } from '@/services/generateSpeech';
import { generateTextToVideo } from '@/services/generateTextToVideo';
import { generateImageToVideo } from '@/services/generateImageToVideo';
import { generateImageToPrompt } from '@/services/generateImageToPrompt';
import { generateNeuroImage } from '@/services/generateNeuroImage';
import { createAvatarVoice } from '@/services/createAvatarVoice';
import { generateModelTraining } from '@/services/generateModelTraining';
import { processBalanceOperation, textToImageGenerationCost } from '@/helpers/telegramStars/telegramStars';
import { validateUserParams } from '@/middlewares/validateUserParams';

export class GenerationController {
  public textToImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, model, num_images, telegram_id, username, is_ru } = req.body;
      console.log(req.body, 'req.body');

      if (!prompt) {
        res.status(400).json({ message: 'prompt is required' });
        return;
      }

      if (!model) {
        res.status(400).json({ message: 'model is required' });
        return;
      }
      if (!num_images) {
        res.status(400).json({ message: 'num_images is required' });
        return;
      }

      validateUserParams(req);
      res.status(200).json({ message: 'Processing started' });

      generateTextToImage(prompt, model, num_images, telegram_id, username, is_ru)
        .then(async () => {
          console.log('Генерация изображения завершена:');
          await processBalanceOperation({ telegram_id, paymentAmount: textToImageGenerationCost, is_ru });
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
      const { prompt, model_url, num_images, telegram_id, username, is_ru } = req.body;
      if (!prompt) {
        res.status(400).json({ message: 'prompt is required' });
        return;
      }
      if (!model_url) {
        res.status(400).json({ message: 'model_url is required' });
        return;
      }
      if (!num_images) {
        res.status(400).json({ message: 'num_images is required' });
        return;
      }
      validateUserParams(req);
      res.status(200).json({ message: 'Processing started' });

      generateNeuroImage(prompt, model_url, num_images, telegram_id, username, is_ru)
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
      const { fileUrl, telegram_id, username, is_ru } = req.body;

      console.log('Received request body:', req.body);

      if (!fileUrl) {
        console.log('Missing required fields:', fileUrl);
        res.status(400).json({ message: 'fileId is required' });
        return;
      }

      validateUserParams(req);

      res.status(200).json({ message: 'Voice creation started' });

      createAvatarVoice(fileUrl, telegram_id, username, is_ru)
        .then(voiceId => {
          console.log('Создание голоса завершено:', voiceId);
        })
        .catch(error => {
          console.error('Ошибка при создании голоса:', error);
        });
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
      validateUserParams(req);
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
      const { prompt, videoModel, telegram_id, username, is_ru } = req.body;
      if (!prompt) {
        res.status(400).json({ message: 'Prompt is required' });
        return;
      }
      if (!videoModel) {
        res.status(400).json({ message: 'Video model is required' });
        return;
      }

      validateUserParams(req);
      res.status(200).json({ message: 'Processing started' });

      generateTextToVideo(prompt, videoModel, telegram_id, username, is_ru)
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
      const { imageUrl, prompt, videoModel, paymentAmount, telegram_id, username, is_ru } = req.body;
      if (!imageUrl) {
        res.status(400).json({ message: 'Image is required' });
        return;
      }
      if (!prompt) {
        res.status(400).json({ message: 'Prompt is required' });
        return;
      }
      if (!videoModel) {
        res.status(400).json({ message: 'Model is required' });
        return;
      }
      if (!paymentAmount) {
        res.status(400).json({ message: 'Payment amount is required' });
        return;
      }

      validateUserParams(req);
      res.status(200).json({ message: 'Processing started' });
      console.log(
        'imageUrl, prompt, videoModel, paymentAmount, telegram_id, username, is_ru',
        imageUrl,
        prompt,
        videoModel,
        paymentAmount,
        telegram_id,
        username,
        is_ru,
      );
      generateImageToVideo(imageUrl, prompt, videoModel, paymentAmount, telegram_id, username, is_ru)
        .then(async ({ videoUrl }) => {
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

  public imageToPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, telegram_id, username, is_ru } = req.body;
      console.log(req.body, 'req.body');
      if (!image) {
        res.status(400).json({ message: 'Image is required' });
        return;
      }
      validateUserParams(req);
      res.status(200).json({ message: 'Processing started' });

      generateImageToPrompt(image, telegram_id, username, is_ru)
        .then(async caption => {
          console.log('Генерация описания завершена:', caption);
        })
        .catch(error => {
          console.error('Ошибка при генерации описания:', error);
        });
    } catch (error) {
      next(error);
    }
  };

  public createModelTraining = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('Files:', req.files);

      const { triggerWord, modelName, steps, telegram_id, is_ru } = req.body;

      const zipFile = req.files?.find(file => file.fieldname === 'zipUrl');
      const zipUrl = zipFile.path;
      console.log('zipUrl', zipUrl);

      if (!zipFile || !triggerWord || !modelName || telegram_id || typeof is_ru !== 'boolean') {
        res.status(400).json({ message: 'zipUrl, triggerWord, modelName, telegram_id, and is_ru are required' });
        return;
      }

      await generateModelTraining(zipUrl, triggerWord, modelName, steps, telegram_id, is_ru);

      res.status(200).json({ message: 'Model training started' });
    } catch (error) {
      console.error('Ошибка при обработке запроса:', error);
      next(error);
    }
  };
}
