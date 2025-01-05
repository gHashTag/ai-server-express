import { Router } from 'express';
import { PaymentSuccessController } from '@controllers/paymentSuccess.controller';

export class PaymentRoute {
  public path = '/payment';
  public router: Router = Router(); // Явно указываем тип Router
  public paymentSuccessController = new PaymentSuccessController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/success`, this.paymentSuccessController.paymentSuccess);
  }
}
