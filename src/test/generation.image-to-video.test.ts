import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateImageToVideo } from '@/services/generateImageToVideo';

jest.mock('@/services/generateImageToVideo', () => ({
  generateImageToVideo: jest.fn(),
}));

describe('POST /image-to-video', () => {
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
      image: 'https://dmrooqbmxdhdyblqzswu.supabase.co/storage/v1/object/public/neuro_coder/cover01.png',
      prompt: 'Create a video of a dance',
      model: 'haiper',
      telegram_id: 123456789,
    };

    (generateImageToVideo as jest.Mock).mockResolvedValue('/path/to/generated/video.mp4');

    const response = await request(app.getServer()).post('/generate/image-to-video').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');

    expect(generateImageToVideo).toHaveBeenCalledWith(
      'https://dmrooqbmxdhdyblqzswu.supabase.co/storage/v1/object/public/neuro_coder/cover01.png',
      'Create a video of a dance',
      'haiper',
    );
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/image-to-video').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Image, prompt, model, and telegram_id are required');
  });
});
