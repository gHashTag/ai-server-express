import request from 'supertest';
import { App } from '@/app';
import { GenerationRoute } from '@routes/generation.route';
import { Server } from 'http';

jest.setTimeout(60000);

describe('GenerationController', () => {
  const generationRoute = new GenerationRoute();
  const app = new App([generationRoute]);
  let server: Server;

  beforeAll(() => {
    server = app.listen();
  });

  describe('[POST] /generate', () => {
    it('should generate an FLUX image and return 200 status', async () => {
      const requestBody = {
        action: 'text_to_image',
        data: {
          prompt: process.env.PROMPT,
          model: 'flux',
          telegram_id: Number(process.env.TELEGRAM_ID),
        },
      };

      const response = await request(app.getServer()).post('/generate').send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.message).toBe('text_to_image successful');
    });

    it('should return 400 status for invalid action', async () => {
      const requestBody = {
        action: 'invalid_action',
        data: {},
      };

      const response = await request(app.getServer()).post('/generate').send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid action');
    });
  });

  afterAll(done => {
    if (server) {
      server.close(done);
    }
  });
});
