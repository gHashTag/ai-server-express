import { replicate } from '@/core/replicate';
import { downloadFile } from '@/helpers/downloadFile';
import { retry } from '@/helpers/retry';

export const generateImageToVideo = async (imageUrl: string, prompt: string, service: string): Promise<string | undefined> => {
  let videoUrl: string | undefined;

  switch (service) {
    case 'minimax':
      const imageBuffer = await downloadFile(imageUrl);
      const minimaxResult = await retry(async () => {
        return await replicate.run('minimax/video-01', {
          input: {
            prompt,
            first_frame_image: imageBuffer,
          },
        });
      });
      videoUrl = typeof minimaxResult === 'string' ? minimaxResult : undefined;
      break;

    case 'haiper':
      const haiperResult = await retry(async () => {
        return await replicate.run('haiper-ai/haiper-video-2', {
          input: {
            prompt,
            duration: 6,
            aspect_ratio: '16:9',
            use_prompt_enhancer: true,
            frame_image_url: imageUrl,
          },
        });
      });
      videoUrl = typeof haiperResult === 'string' ? haiperResult : undefined;
      break;

    case 'ray':
      const rayResult = await retry(async () => {
        return await replicate.run('luma/ray', {
          input: {
            prompt,
            aspect_ratio: '16:9',
            loop: false,
            start_image_url: imageUrl,
          },
        });
      });
      videoUrl = typeof rayResult === 'string' ? rayResult : undefined;
      break;

    case 'i2vgen':
      const i2vgenResult = await retry(async () => {
        return await replicate.run('ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4', {
          input: {
            image: imageUrl,
            prompt,
            max_frames: 16,
            guidance_scale: 9,
            num_inference_steps: 50,
          },
        });
      });
      videoUrl = typeof i2vgenResult === 'string' ? i2vgenResult : undefined;
      break;

    default:
      throw new Error('Unsupported service');
  }

  return videoUrl;
};
