import { Request, Response, NextFunction } from 'express';
import { generateImage } from '@services/generateReplicateImage';

export class GenerationController {
  public generateContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, data } = req.body;
      let result;

      switch (action) {
        case 'text_to_image':
          result = await generateImage(data.prompt, data.model, data.telegram_id);
          break;
        // case 'text_to_video':
        //   result = await generateVideo(data.model, data.prompt);
        //   break;
        // case 'image_to_video':
        //   result = await imageToVideo(data.model, data.image);
        //   break;
        default:
          res.status(400).json({ message: 'Invalid action' });
          return;
      }

      res.status(200).json({ data: result, message: `${action} successful` });
    } catch (error) {
      next(error);
    }
  };
}
