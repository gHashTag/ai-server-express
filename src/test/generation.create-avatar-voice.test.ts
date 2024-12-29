import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { createAvatarVoice } from '@/services/createAvatarVoice';

jest.mock('@/services/createAvatarVoice', () => ({
  createAvatarVoice: jest.fn(),
}));

describe('POST /create-avatar-voice', () => {
  const generationRoute = new GenerationRoute();
  const app = new App([generationRoute]);

  beforeAll(() => {
    app.listen();
  });

  afterAll(done => {
    app.close(done);
  });

  const fileUrl = 'https://api.telegram.org/file/bot6389824290:AAH81vTqOjDcGLlWRVyDPcwCtfxqRYXc2zo/voice/file_74.oga';

  it('should return 200 and start voice creation when valid data is provided', async () => {
    const requestBody = {
      fileUrl,
      username: 'testuser',
      telegram_id: 123456789,
      is_ru: true,
    };

    (createAvatarVoice as jest.Mock).mockResolvedValue('voiceId123');

    const response = await request(app.getServer()).post('/generate/create-avatar-voice').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Voice creation started');

    expect(createAvatarVoice).toHaveBeenCalledWith(fileUrl, 'testuser');
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/create-avatar-voice').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'fileId, username, and telegram_id are required');
  });
});
