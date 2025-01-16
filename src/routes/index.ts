import { UploadRoute } from './upload.route'
import { WebhookRoute } from './webhook.route'
import { PaymentRoute } from './payment.route'
import { GenerationRoute } from './generation.route'
import { UserRoute } from './user.route'

export const routes = [
  new UploadRoute(),
  new WebhookRoute(),
  new PaymentRoute(),
  new GenerationRoute(),
  new UserRoute(),
]
