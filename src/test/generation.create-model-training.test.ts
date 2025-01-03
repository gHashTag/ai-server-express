import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { generateModelTraining } from '@/services/generateModelTraining';

jest.mock('@/services/generateModelTraining', () => ({
  generateModelTraining: jest.fn(),
}));

describe('POST /create-model-training', () => {
  const generationRoute = new GenerationRoute();
  const app = new App([generationRoute]);

  beforeAll(() => {
    app.listen();
  });

  afterAll(done => {
    app.close(done);
  });

  it('should return 200 and start model training when valid data is provided', async () => {
    const requestBody = {
      zipUrl: 'http://example.com/model.zip',
      triggerWord: 'example',
      modelName: 'testModel',
      telegram_id: 123456789,
      is_ru: true,
    };

    (generateModelTraining as jest.Mock).mockResolvedValue({
      model_id: 'model123',
    });

    const response = await request(app.getServer()).post('/generate/create-model-training').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Model training started');

    expect(generateModelTraining).toHaveBeenCalledWith('http://example.com/model.zip', 'example', 'testModel', 123456789, true);
  });

  it('should return 400 when required fields are missing', async () => {
    const requestBody = {
      // Оставьте поля пустыми, чтобы вызвать ошибку
    };

    const response = await request(app.getServer()).post('/generate/create-model-training').send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'zipUrl, triggerWord, modelName, telegram_id, and is_ru are required');
  });
});
