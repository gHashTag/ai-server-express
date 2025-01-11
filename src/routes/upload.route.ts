import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UploadController } from '@/controllers/upload.controller';

declare module 'express' {
  interface Request {
    files?: Express.Multer.File[];
  }
}

// Функция для создания директории, если она не существует
async function ensureDirectoryExistence(filePath: string) {
  console.log(`Ensuring directory exists: ${filePath}`); // Лог для проверки пути
  try {
    await fs.promises.mkdir(filePath, { recursive: true });
    console.log(`Directory created: ${filePath}`); // Лог для подтверждения создания
  } catch (error) {
    console.error(`Error creating directory: ${error}`);
    throw error;
  }
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    console.log(req.body, 'req.body');
    const telegramId = req.body.telegram_id;
    console.log(telegramId, 'telegramId');
    const type = req.body.type;
    console.log(type, 'type');

    // Убедитесь, что type не является undefined
    if (!type) {
      return cb(new Error('Type is not defined'), '');
    }

    const userDir = path.join(__dirname, '../uploads', telegramId.toString(), type);

    console.log(`Saving file to directory: ${userDir}`); // Лог для проверки пути

    try {
      await ensureDirectoryExistence(userDir);
      cb(null, userDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + '-' + file.originalname;
    console.log(`Saving file with name: ${filename}`);
    cb(null, filename);
  },
});

export const upload = multer({ storage: storage });

export class UploadRoute {
  public path = '/upload';
  public router: Router = Router();
  private uploadController = new UploadController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.path, upload.single('file'), this.uploadController.uploadFile);
  }
}
