import bot from '@/core/bot';
import { supabase } from '@/core/supabase';
import { createVoiceElevenLabs } from '@/core/supabase/ai';

export async function createAvatarVoice(fileUrl: string, telegram_id: number, username: string, isRu: boolean): Promise<string | null> {
  await bot.api.sendMessage(telegram_id, isRu ? '⏳ Создаю голосовой аватар...' : '⏳ Creating voice avatar...');

  const voiceId = await createVoiceElevenLabs({
    fileUrl,
    username,
  });
  console.log(voiceId, 'voiceId');
  if (!voiceId) {
    throw new Error('Ошибка при создании голоса');
  }

  // Сохранение voiceId в таблицу users
  const { error } = await supabase.from('users').update({ voice_id_elevenlabs: voiceId }).eq('username', username);

  await bot.api.sendMessage(
    telegram_id,
    isRu
      ? '✅ Голосовой аватар успешно создан, используйте команду /text_to_speech чтобы проверить'
      : '✅ Voice avatar successfully created! Use the command /text_to_speech to check',
    {
      parse_mode: 'MarkdownV2',
    },
  );

  if (error) {
    console.error('Ошибка при сохранении voiceId в базу данных:', error);
    throw new Error('Ошибка при сохранении данных');
  }

  return voiceId;
}
