import bot from '@/core/bot';
import { supabase } from '@/core/supabase';

const starCost = 0.016;

// Определяем тип для моделей
export type VideoModel = 'minimax' | 'haiper' | 'ray' | 'i2vgen';

// Определяем стоимость для каждой модели
const MODEL_PRICES: Record<VideoModel, number> = {
  minimax: 0.5,
  haiper: 0.05,
  ray: 0.45,
  i2vgen: 0.45,
};

export function calculateFinalPrice(model: VideoModel): number {
  const basePrice = MODEL_PRICES[model];
  const interest = 0.5; // 50% interest
  return basePrice * (1 + interest);
}

const trainingCostInStars = 20 / starCost;
const promptGenerationCost = 0.048 / starCost;
const textToImageGenerationCost = 0.12 / starCost;
const imageNeuroGenerationCost = 0.12 / starCost;
const textToVideoGenerationCost = 0.99 / starCost;
const textToVideoCost = 0.99 / starCost;
const speechGenerationCost = 0.12 / starCost;
const textToSpeechCost = 0.12 / starCost;
const imageToVideoCost = 0.99 / starCost;
const imageToVideoGenerationCost = 0.99 / starCost;
const imageToPromptCost = 0.03 / starCost;
const voiceConversationCost = 0.99 / starCost;

interface BalanceOperationResult {
  newBalance: number;
  success: boolean;
  error?: string;
}

export async function processBalanceOperation({
  telegram_id,
  paymentAmount,
  is_ru,
}: {
  telegram_id: number;
  paymentAmount: number;
  is_ru: boolean;
}): Promise<BalanceOperationResult> {
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
}

async function incrementBalance({ telegram_id, amount }: { telegram_id: string; amount: number }) {
  const { data, error } = await supabase.from('users').select('balance').eq('telegram_id', telegram_id).single();

  if (error || !data) {
    throw new Error('Не удалось получить текущий баланс');
  }

  const newBalance = data.balance + amount;

  const { error: updateError } = await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id.toString());

  if (updateError) {
    throw new Error('Не удалось обновить баланс');
  }
}

async function getUserBalance(userId: number): Promise<number> {
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
}

// Функция для обновления баланса пользователя
async function updateUserBalance(userId: number, newBalance: number): Promise<void> {
  console.log('updateUserBalance', userId, newBalance);
  const { error } = await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', userId.toString());
  console.log('updateUserBalance', error);
  if (error) {
    console.error('Ошибка при обновлении баланса:', error);
    throw new Error('Не удалось обновить баланс пользователя');
  }
}

function calculateStars(paymentAmount: number, starCost: number): number {
  return Math.floor(paymentAmount / starCost);
}

async function sendInsufficientStarsMessage(telegram_id: number, isRu: boolean) {
  const message = isRu
    ? 'Недостаточно звезд для генерации изображения. Пополните баланс вызвав команду /buy.'
    : 'Insufficient stars for image generation. Top up your balance by calling the /buy command.';

  await bot.api.sendMessage(telegram_id, message);
}

const sendBalanceMessage = async (telegram_id: number, newBalance: number, cost: number, isRu: boolean) => {
  await bot.api.sendMessage(
    telegram_id,
    isRu
      ? `Стоимость: ${cost.toFixed(2)} ⭐️\nВаш баланс: ${newBalance.toFixed(2)} ⭐️`
      : `Cost: ${cost.toFixed(2)} ⭐️\nYour balance: ${newBalance.toFixed(2)} ⭐️`,
  );
};

const sendCurrentBalanceMessage = async (telegram_id: number, isRu: boolean, currentBalance: number) => {
  await bot.api.sendMessage(
    telegram_id,
    isRu ? `Ваш текущий баланс: ${currentBalance.toFixed(2)} ⭐️` : `Your current balance: ${currentBalance.toFixed(2)} ⭐️`,
  );
  return;
};

const sendCostMessage = async (telegram_id: number, isRu: boolean, cost: number) => {
  await bot.api.sendMessage(telegram_id, isRu ? `Стоимость: ${cost.toFixed(2)} ⭐️` : `Cost: ${cost.toFixed(2)} ⭐️`);
  return;
};

export {
  incrementBalance,
  starCost,
  getUserBalance,
  updateUserBalance,
  calculateStars,
  trainingCostInStars,
  sendInsufficientStarsMessage,
  textToImageGenerationCost,
  sendBalanceMessage,
  textToVideoCost,
  sendCurrentBalanceMessage,
  imageToVideoCost,
  textToSpeechCost,
  speechGenerationCost,
  promptGenerationCost,
  imageNeuroGenerationCost,
  sendCostMessage,
  textToVideoGenerationCost,
  imageToVideoGenerationCost,
  imageToPromptCost,
  voiceConversationCost,
};
