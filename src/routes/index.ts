import { UploadRoute } from './upload.route';
import { WebhookRoute } from './webhook.route';
import { PaymentRoute } from './payment.route';
import { GenerationRoute } from './generation.route';

export const routes = [new UploadRoute(), new WebhookRoute(), new PaymentRoute(), new GenerationRoute()];
