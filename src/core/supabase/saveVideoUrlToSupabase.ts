import { supabase } from '@/core/supabase';

export async function saveVideoUrlToSupabase(telegramId: number, videoPath: string) {
  const { error } = await supabase.from('assets').insert({
    type: 'video',
    trigger_word: 'video',
    project_id: telegramId,
    public_url: videoPath,
    text: 'Generated video',
  });

  if (error) {
    console.error('Ошибка при сохранении URL видео в Supabase:', error);
  } else {
    console.log('URL видео успешно сохранен в Supabase');
  }
}
