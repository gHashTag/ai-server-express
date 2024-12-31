import { Request, Response, NextFunction } from 'express';

interface UserParams {
  username?: string;
  telegram_id?: number;
  is_ru?: boolean;
}

export const validateUserParams = (req: Request, res: Response, next: NextFunction): void => {
  const { username, telegram_id, is_ru } = req.body as UserParams;

  const missingParams = [];

  if (!username) {
    missingParams.push('username');
  }

  if (!telegram_id) {
    missingParams.push('telegram_id');
  }

  if (is_ru === undefined) {
    missingParams.push('is_ru');
  }

  if (missingParams.length > 0) {
    res.status(400).json({
      message: `Missing required parameters: ${missingParams.join(', ')}`,
      missingParams,
    });
    return;
  }

  next();
};
