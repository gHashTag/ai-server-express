import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { createAvatarVoice } from '@/services/createAvatarVoice';

jest.mock('../services/createAvatarVoice', () => ({
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

  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/voice/file_74.oga`;

  it('should return 200 and start voice creation when valid data is provided', async () => {
    const requestBody = {
      fileId: 'file_74.oga',
      username: 'testuser',
      telegram_id: 123456789,
      is_ru: true,
    };

    const response = await request(app.getServer()).post('/generate/create-avatar-voice').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Voice creation started');

    // Исправляем ожидаемые параметры вызова
    expect(createAvatarVoice).toHaveBeenCalledWith(fileUrl, requestBody.telegram_id, requestBody.username, requestBody.is_ru);
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      fileId: 'file_74.oga',
      // Отсутствуют обязательные поля
    };

    const response = await request(app.getServer()).post('/generate/create-avatar-voice').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'fileId, username, and telegram_id are required');
  });
});
