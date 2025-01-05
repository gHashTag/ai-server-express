import { Request, Response } from 'express';
import { PaymentService } from '@/services/payment.service';

export class PaymentSuccessController {
  private paymentService = new PaymentService();

  public paymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { OutSum, Email } = req.query;
      console.log(OutSum, Email);

      await this.paymentService.processPayment(OutSum as string, Email as string);

      res.status(200).send('OK');
    } catch (error) {
      console.error('Ошибка обработки успешного платежа:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
