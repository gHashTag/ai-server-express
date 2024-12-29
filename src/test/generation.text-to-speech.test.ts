import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateSpeech } from '@/services/generateSpeech';

jest.mock('@/services/generateSpeech', () => ({
  generateSpeech: jest.fn(),
}));

describe('POST /text-to-speech', () => {
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
      text: 'Hello, world!',
      voice_id: 'gPxfjvn7IXljXm1Tlb8o',
      telegram_id: 123456789,
    };

    (generateSpeech as jest.Mock).mockResolvedValue({
      audioUrl: `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/voice/file_74.oga`,
    });

    const response = await request(app.getServer()).post('/generate/text-to-speech').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');

    expect(generateSpeech).toHaveBeenCalledWith({ text: 'Hello, world!', voice_id: 'gPxfjvn7IXljXm1Tlb8o' });
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/text-to-speech').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Text, voice_id, and telegram_id are required');
  });
});
