import { Telegraf } from 'telegraf';

const bot = new Telegraf('YOUR_BOT_TOKEN');

export const pulse = async (image: string, prompt: string, command: string, telegram_id: number, username: string, is_ru: boolean) => {
  try {
    if (process.env.NODE_ENV === 'development') return;

    const truncatedPrompt = prompt.length > 800 ? prompt.slice(0, 800) : prompt;
    const caption = is_ru
      ? `@${
          username || 'Пользователь без username'
        } Telegram ID: ${telegram_id} сгенерировал изображение с промптом: ${truncatedPrompt} \n\n Команда: ${command}`
      : `@${
          username || 'User without username'
        } Telegram ID: ${telegram_id} generated an image with a prompt: ${truncatedPrompt} \n\n Command: ${command}`;

    // Если изображение начинается с data:image/, нужно получить только base64
    let imageToSend = image;
    if (image.startsWith('data:image/')) {
      imageToSend = image.split(',')[1];
    }

    // Преобразуем base64 в буфер
    const imageBuffer = Buffer.from(imageToSend, 'base64');

    // Отправляем изображение как Buffer
    await bot.telegram.sendPhoto(-4166575919, { source: imageBuffer }, { caption });
  } catch (error) {
    console.error('Ошибка при отправке пульса:', error);
    throw new Error('Ошибка при отправке пульса');
  }
};
