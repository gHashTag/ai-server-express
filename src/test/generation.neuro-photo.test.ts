import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateNeuroImage } from '@/services/generateNeuroImage';

jest.mock('@/services/generateNeuroImage', () => ({
  generateNeuroImage: jest.fn(),
}));

describe('POST /neuro-photo', () => {
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
      prompt: 'Create a futuristic cityscape',
      telegram_id: 123456789,
    };

    (generateNeuroImage as jest.Mock).mockResolvedValue({
      prompt_id: 'prompt123',
      image: '/path/to/generated/image.jpg',
    });

    const response = await request(app.getServer()).post('/generate/neuro-photo').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');

    expect(generateNeuroImage).toHaveBeenCalledWith('Create a futuristic cityscape', 123456789);
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/neuro-photo').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Prompt and telegram_id are required');
  });
});
