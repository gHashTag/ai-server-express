import { incrementBalance } from '@/helpers/telegramStars/telegramStars';
import { sendPaymentNotification } from '@/core/supabase/payments';
import { supabase } from '@/core/supabase';

type User = {
  telegram_id: string;
  username: string;
  balance: number;
  language: string;
};

export class PaymentService {
  public async processPayment(OutSum: string, Email: string): Promise<void> {
    console.log('PaymentService: OutSum', OutSum);
    console.log('PaymentService: Email', Email);
    let stars = 0;
    if (OutSum === '1999') {
      stars = 1249;
    } else if (OutSum === '5000') {
      stars = 3040;
    } else if (OutSum === '10000') {
      stars = 6080;
    } else if (OutSum === '10') {
      stars = 6;
    }

    if (stars > 0) {
      const { telegram_id, username, language } = await this.getTelegramIdFromInvId(Email);
      await incrementBalance({ telegram_id: telegram_id.toString(), amount: stars });
      await sendPaymentNotification(Number(OutSum), stars, telegram_id, language, username);
    }
  }

  private async getTelegramIdFromInvId(Email: string): Promise<User> {
    try {
      const { data } = await supabase.from('users').select('telegram_id, username, balance, language').eq('email', Email).single();
      if (!data) {
        throw new Error('User not found');
      }
      return data;
    } catch (error) {
      console.error('Ошибка получения Telegram ID пользователя:', error);
      throw error;
    }
  }
}
