import bot from '../bot';
import { supabase } from './';

interface Payment {
  id: string;
  amount: number;
  date: string;
}

export const sendPaymentNotification = async (amount: number, stars: number, telegramId: string, language: string, username: string) => {
  try {
    const caption =
      language === 'ru'
        ? `💸 Пользователь @${
            username || 'Пользователь без username'
          } (Telegram ID: ${telegramId}) оплатил ${amount} рублей и получил ${stars} звезд.`
        : `💸 User @${username || 'User without username'} (Telegram ID: ${telegramId}) paid ${amount} RUB and received ${stars} stars.`;

    await bot.telegram.sendMessage('-4166575919', caption);
  } catch (error) {
    console.error('Ошибка при отправке уведомления об оплате:', error);
    throw new Error('Ошибка при отправке уведомления об оплате');
  }
};

export async function sendPaymentInfo(user_id: string, level: string): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').insert([{ user_id, level }]);

  if (error) {
    console.error('Error sending payment info:', error);
    throw new Error(`Failed to send payment info: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after inserting payment info.');
  }

  return data[0];
}

export async function getPaymentsInfoByTelegramId(telegram_id: string): Promise<Payment[]> {
  const { data: userData, error: userError } = await supabase.from('users').select('user_id').eq('telegram_id', telegram_id.toString()).single();

  if (userError || !userData) {
    console.error('Error fetching user ID:', userError);
    return [];
  }

  const user_id = userData.user_id;

  const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').eq('user_id', user_id);

  if (paymentsError || !paymentsData) {
    console.error('Error fetching payments info:', paymentsError);
    return [];
  }

  return paymentsData;
}

export async function getPaymentsInfoByUsername(username: string): Promise<Payment[]> {
  // Получаем user_id по username из таблицы users
  const { data: userData, error: userError } = await supabase.from('users').select('user_id').eq('username', username).single();

  if (userError) {
    console.error('Error fetching user ID:', userError);
    return [];
  }

  const user_id = userData?.user_id;

  // Получаем все строчки с данным user_id из таблицы payments
  const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').eq('user_id', user_id);

  if (paymentsError) {
    console.error('Error fetching payments info:', paymentsError);
    return [];
  }

  return paymentsData;
}

export async function checkSubscriptionByTelegramId(telegram_id: string): Promise<string> {
  // Получаем user_id по telegram_id из таблицы users
  const { data: userData, error: userError } = await supabase.from('users').select('user_id').eq('telegram_id', telegram_id.toString()).single();

  if (userError) {
    console.error('Ошибка при получении user_id:', userError);
    return 'unsubscribed';
  }

  const user_id = userData?.user_id;

  // Получаем последнюю подписку пользователя
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subscriptionError) {
    console.error('Ошибка при получении информации о подписке:', subscriptionError);
    return 'unsubscribed';
  }

  if (!subscriptionData) {
    return 'unsubscribed';
  }

  // Проверяем, была ли подписка куплена меньше месяца назад
  const subscriptionDate = new Date(subscriptionData.created_at);
  const currentDate = new Date();
  const differenceInDays = (currentDate.getTime() - subscriptionDate.getTime()) / (1000 * 3600 * 24);

  if (differenceInDays > 30) {
    return 'unsubscribed';
  }

  return subscriptionData.level;
}

export async function isLimitAi(telegram_id: string): Promise<boolean> {
  const dailyLimit = 3;
  const today = new Date().toISOString().split('T')[0];

  // Получаем user_id по telegram_id из таблицы users
  const { data: userData, error: userError } = await supabase.from('users').select('user_id').eq('telegram_id', telegram_id.toString()).single();

  if (userError) {
    console.error('Ошибка при получении user_id:', userError);
    return false;
  }

  const user_id = userData?.user_id;

  // Получаем последнюю запись для пользователя
  const { data: limitData, error: limitError } = await supabase
    .from('ai_requests')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (limitError && limitError.code !== 'PGRST116') {
    console.error('Ошибка при получении данных о лимите:', limitError);
    return false;
  }

  if (!limitData || limitData.created_at.split('T')[0] !== today) {
    // Создаем новую запись на сегодня
    const { error: insertError } = await supabase.from('ai_requests').insert({ user_id, count: 1, created_at: new Date().toISOString() });

    if (insertError) {
      console.error('Ошибка при создании новой записи:', insertError);
      return false;
    }

    return false;
  } else if (limitData.count < dailyLimit) {
    // Обновляем существующую запись
    const { error: updateError } = await supabase
      .from('ai_requests')
      .update({ count: limitData.count + 1 })
      .eq('id', limitData.id);

    if (updateError) {
      console.error('Ошибка при обновлении записи:', updateError);
      return false;
    }

    return false;
  }

  return true;
}

export async function saveUserEmail(telegram_id: string, email: string): Promise<void> {
  const { error } = await supabase.from('users').update({ email }).eq('telegram_id', telegram_id);

  if (error) {
    console.error('Ошибка при сохранении e-mail:', error);
    throw new Error('Не удалось сохранить e-mail пользователя');
  }
}
