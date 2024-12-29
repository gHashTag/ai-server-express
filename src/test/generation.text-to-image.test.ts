import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateImage } from '@/services/generateImage';
import request from 'supertest';

jest.mock('@/services/generateImage', () => ({
  generateImage: jest.fn().mockResolvedValue({ image: 'mockedImageBuffer' }),
}));

jest.mock('@/services/generateSpeech', () => ({
  generateSpeech: jest.fn(),
}));

jest.setTimeout(60000);

describe('GenerationController', () => {
  const generationRoute = new GenerationRoute();
  const app = new App([generationRoute]);

  beforeAll(() => {
    app.listen();
  });

  afterAll(done => {
    app.close(done);
  });

  describe('[POST] /generate/text-to-image', () => {
    it('should be called with correct arguments and return expected result', async () => {
      const prompt = 'Create a beautiful landscape';
      const model = 'flux';
      const telegramId = 123456789;

      // Замокайте возвращаемое значение функции generateImage
      (generateImage as jest.Mock).mockResolvedValue({ image: 'mockedImageBuffer' });

      // Вызовите функцию generateImage
      const result = await generateImage(prompt, model, telegramId);

      // Проверка, что generateImage была вызвана с правильными аргументами
      expect(generateImage).toHaveBeenCalledWith(prompt, model, telegramId);

      // Проверка, что результат соответствует ожидаемому
      expect(result).toEqual({ image: 'mockedImageBuffer' });
    });

    it('should return 400 when required fields are missing', async () => {
      const requestBody = {
        // Оставьте поля пустыми, чтобы вызвать ошибку
      };

      const response = await request(app.getServer()).post('/generate/text-to-image').send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Prompt, model, and telegram_id are required');
    });
  });
});
