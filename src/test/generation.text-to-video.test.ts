import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateTextToVideo } from '@/services/generateTextToVideo';

jest.mock('@/services/generateTextToVideo', () => ({
  generateTextToVideo: jest.fn(),
}));

describe('POST /text-to-video', () => {
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
      prompt: 'Create a video of a sunset',
      model: 'haiper',
      telegram_id: 123456789,
    };

    (generateTextToVideo as jest.Mock).mockResolvedValue({
      videoPath: '/path/to/generated/video.mp4',
    });

    const response = await request(app.getServer()).post('/generate/text-to-video').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');

    expect(generateTextToVideo).toHaveBeenCalledWith('Create a video of a sunset', 'haiper', 123456789);
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/text-to-video').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Model, prompt, and telegram_id are required');
  });
});
