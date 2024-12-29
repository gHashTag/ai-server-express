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

  //   describe('[POST] /generate', () => {
  //     it('should generate an FLUX image and return 200 status', async () => {
  //       const requestBody = {
  //         action: 'text_to_image',
  //         data: {
  //           prompt: process.env.PROMPT,
  //           model: 'flux',
  //           telegram_id: Number(process.env.TELEGRAM_ID),
  //         },
  //       };

  //       const response = await request(app.getServer()).post('/generate').send(requestBody);

  //       expect(response.status).toBe(200);
  //       expect(response.body).toHaveProperty('data');
  //       expect(response.body.message).toBe('text_to_image successful');
  //     });

  //     it('should return 400 status for invalid action', async () => {
  //       const requestBody = {
  //         action: 'invalid_action',
  //         data: {},
  //       };

  //       const response = await request(app.getServer()).post('/generate').send(requestBody);

  //       expect(response.status).toBe(400);
  //       expect(response.body.message).toBe('Invalid action');
  //     });
  //   });

  //   it('should generate speech and return 200 status', async () => {
  //     const requestBody = {
  //       action: 'text_to_speech',
  //       data: {
  //         text: 'Hello, world!',
  //         voice_id: 'gPxfjvn7IXljXm1Tlb8o',
  //       },
  //     };

  //     const response = await request(app.getServer()).post('/generate').send(requestBody);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveProperty('data');
  //     expect(response.body.message).toBe('text_to_speech successful');
  //   });

  it('should generate video and return 200 status', async () => {
    const requestBody = {
      action: 'text_to_video',
      data: {
        prompt: 'Create a video of a sunset',
        model: 'haiper',
        telegram_id: Number(process.env.TELEGRAM_ID),
      },
    };

    const response = await request(app.getServer()).post('/generate').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Processing started');
  });

  //   it('should generate video from image and return 200 status', async () => {
  //     const requestBody = {
  //       action: 'image_to_video',
  //       data: {
  //         image: 'https://dmrooqbmxdhdyblqzswu.supabase.co/storage/v1/object/public/images/prompts/photo_2567-11-12%2017.04.10.jpeg',
  //         prompt: 'Create a video of a dance',
  //         model: 'haiper',
  //       },
  //     };

  //     const response = await request(app.getServer()).post('/generate').send(requestBody);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveProperty('data');
  //     expect(response.body.message).toBe('image_to_video successful');
  //   });

  //   it('should generate prompt from image and return 200 status', async () => {
  //     const requestBody = {
  //       action: 'image_to_prompt',
  //       data: {
  //         image: 'https://dmrooqbmxdhdyblqzswu.supabase.co/storage/v1/object/public/images/prompts/photo_2567-11-12%2017.04.10.jpeg',
  //         telegram_id: Number(process.env.TELEGRAM_ID),
  //       },
  //     };

  //     const response = await request(app.getServer()).post('/generate').send(requestBody);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveProperty('data');
  //     expect(response.body.message).toBe('image_to_prompt successful');
  //   });

  afterAll(done => {
    if (server) {
      server.close(done);
    }
  });
});
