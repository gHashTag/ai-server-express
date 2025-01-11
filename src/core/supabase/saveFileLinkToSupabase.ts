import { supabase } from '.';

export const saveFileLinkToSupabase = async (telegramId: number, filePath: string, type: string) => {
  try {
    const { error } = await supabase.from('user_files').insert({
      telegram_id: telegramId,
      file_path: filePath,
      type: type,
    });

    if (error) {
      console.error('Ошибка при сохранении ссылки на файл в Supabase:', error);
    }
  } catch (error) {
    console.error('Ошибка при сохранении ссылки на файл в Supabase:', error);
  }
};
