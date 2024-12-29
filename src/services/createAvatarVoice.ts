import { supabase } from '@/core/supabase';
import { createVoiceElevenLabs } from '@/core/supabase/ai';

export async function createAvatarVoice(fileUrl: string, username: string): Promise<string | null> {
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

  if (error) {
    console.error('Ошибка при сохранении voiceId в базу данных:', error);
    throw new Error('Ошибка при сохранении данных');
  }

  return voiceId;
}
