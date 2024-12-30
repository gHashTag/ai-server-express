import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateImageToPrompt } from '@/services/generateImageToPrompt';

jest.mock('@/services/generateImageToPrompt', () => ({
  generateImageToPrompt: jest.fn(),
}));

describe('POST /image-to-prompt', () => {
  const generationRoute = new GenerationRoute();
  const app = new App([generationRoute]);

  beforeAll(() => {
    app.listen();
  });

  afterAll(done => {
    app.close(done);
  });

  it('should return 200 and start processing when valid data is provided', async () => {
    const requestBody = {
      image: 'http://example.com/image.jpg',
      telegram_id: 123456789,
    };

    (generateImageToPrompt as jest.Mock).mockResolvedValue('This is a generated caption.');

    const response = await request(app.getServer()).post('/generate/image-to-prompt').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');

    expect(generateImageToPrompt).toHaveBeenCalledWith('http://example.com/image.jpg');
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/image-to-prompt').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Image and telegram_id are required');
  });
});