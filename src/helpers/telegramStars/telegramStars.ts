import bot from '@/core/bot';
import { supabase } from '@/core/supabase';
// Определяем тип для моделей
export type VideoModel = 'minimax' | 'haiper' | 'ray' | 'i2vgen-xl';

// Стоимость одной звезды
export const starCost = 0.016;

// Определяем базовую стоимость для каждой модели
export const MODEL_PRICES: Record<VideoModel, number> = {
  minimax: 0.5,
  haiper: 0.05,
  ray: 0.45,
  'i2vgen-xl': 0.45,
};

// Процент наценки
const interestRate = 0.5; // 50% наценка

// Функция для расчета окончательной стоимости модели
export function calculateFinalPrice(model: VideoModel): number {
  const basePrice = MODEL_PRICES[model];
  const finalPrice = basePrice * (1 + interestRate);
  return Math.floor(finalPrice / starCost);
}

// Функция для расчета стоимости в звездах
function calculateCostInStars(costInDollars: number): number {
  return costInDollars / starCost;
}

export const costPerStepInStars = 1.47;

export function calculateTrainingCostInStars(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars;

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2));
}

export function calculateTrainingCostInDollars(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars;

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2));
}

export function calculateTrainingCostInRub(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars;

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2));
}

export const promptGenerationCost = calculateCostInStars(0.048);
export const textToImageGenerationCost = calculateCostInStars(0.12);
export const imageNeuroGenerationCost = calculateCostInStars(0.12);
export const textToVideoGenerationCost = calculateCostInStars(0.99);
export const textToVideoCost = calculateCostInStars(0.99);
export const speechGenerationCost = calculateCostInStars(0.12);
export const textToSpeechCost = calculateCostInStars(0.12);
export const imageToVideoCost = calculateCostInStars(0.99);
export const imageToVideoGenerationCost = calculateCostInStars(0.99);
export const imageToPromptCost = calculateCostInStars(0.03);
export const voiceConversationCost = calculateCostInStars(0.99);

interface BalanceOperationResult {
  newBalance: number;
  success: boolean;
  error?: string;
}

export const processBalanceOperation = async ({
  telegram_id,
  paymentAmount,
  is_ru,
}: {
  telegram_id: number;
  paymentAmount: number;
  is_ru: boolean;
}): Promise<BalanceOperationResult> => {
  try {
    // Получаем текущий баланс
    const currentBalance = await getUserBalance(telegram_id);
    console.log(`Current balance for user ${telegram_id}:`, currentBalance);

    // Проверяем достаточно ли средств
    if (currentBalance < paymentAmount) {
      const message = is_ru
        ? 'Недостаточно средств на балансе. Пополните баланс вызвав команду /buy.'
        : 'Insufficient funds. Top up your balance by calling the /buy command.';
      await bot.api.sendMessage(telegram_id, message);
      return {
        newBalance: currentBalance,
        success: false,
        error: message,
      };
    }
    console.log('paymentAmount', paymentAmount);
    // Рассчитываем новый баланс
    const newBalance = Number(currentBalance) - Number(paymentAmount);
    console.log(`New balance for user ${telegram_id}:`, newBalance);

    // Обновляем баланс в БД
    await updateUserBalance(telegram_id, newBalance);

    return {
      newBalance,
      success: true,
    };
  } catch (error) {
    console.error('Error in processBalanceOperation:', error);
    throw error;
  }
};

export const incrementBalance = async ({ telegram_id, amount }: { telegram_id: string; amount: number }) => {
  const { data, error } = await supabase.from('users').select('balance').eq('telegram_id', telegram_id).single();

  if (error || !data) {
    throw new Error('Не удалось получить текущий баланс');
  }

  const newBalance = data.balance + amount;

  const { error: updateError } = await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id.toString());

  if (updateError) {
    throw new Error('Не удалось обновить баланс');
  }
};

export const getUserBalance = async (userId: number): Promise<number> => {
  const { data, error } = await supabase.from('users').select('balance').eq('telegram_id', userId.toString()).single();
  console.log('getUserBalance', data, error);
  if (error) {
    if (error.code === 'PGRST116') {
      console.error(`Пользователь с ID ${userId} не найден.`);
      throw new Error('Пользователь не найден');
    }
    console.error('Ошибка при получении баланса:', error);
    throw new Error('Не удалось получить баланс пользователя');
  }

  return data?.balance || 0;
};

// Функция для обновления баланса пользователя
export const updateUserBalance = async (userId: number, newBalance: number): Promise<void> => {
  console.log('updateUserBalance', userId, newBalance);
  const { error } = await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', userId.toString());
  console.log('updateUserBalance', error);
  if (error) {
    console.error('Ошибка при обновлении баланса:', error);
    throw new Error('Не удалось обновить баланс пользователя');
  }
};

export const calculateStars = (paymentAmount: number, starCost: number): number => {
  return Math.floor(paymentAmount / starCost);
};

export const sendInsufficientStarsMessage = async (telegram_id: number, isRu: boolean) => {
  const message = isRu
    ? 'Недостаточно звезд для генерации изображения. Пополните баланс вызвав команду /buy.'
    : 'Insufficient stars for image generation. Top up your balance by calling the /buy command.';

  await bot.api.sendMessage(telegram_id, message);
};

export const sendBalanceMessage = async (telegram_id: number, newBalance: number, cost: number, isRu: boolean) => {
  await bot.api.sendMessage(
    telegram_id,
    isRu
      ? `Стоимость: ${cost.toFixed(2)} ⭐️\nВаш баланс: ${newBalance.toFixed(2)} ⭐️`
      : `Cost: ${cost.toFixed(2)} ⭐️\nYour balance: ${newBalance.toFixed(2)} ⭐️`,
  );
};

export const sendCurrentBalanceMessage = async (telegram_id: number, isRu: boolean, currentBalance: number) => {
  await bot.api.sendMessage(
    telegram_id,
    isRu ? `Ваш текущий баланс: ${currentBalance.toFixed(2)} ⭐️` : `Your current balance: ${currentBalance.toFixed(2)} ⭐️`,
  );
  return;
};

export const sendCostMessage = async (telegram_id: number, isRu: boolean, cost: number) => {
  await bot.api.sendMessage(telegram_id, isRu ? `Стоимость: ${cost.toFixed(2)} ⭐️` : `Cost: ${cost.toFixed(2)} ⭐️`);
  return;
};
