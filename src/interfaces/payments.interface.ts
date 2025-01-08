export interface BalanceOperationResult {
  newBalance: number;
  success: boolean;
  error?: string;
}
export interface Payment {
  id: string;
  amount: number;
  date: string;
}
