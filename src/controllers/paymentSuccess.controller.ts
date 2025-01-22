import { Request, Response } from 'express'
import { PaymentService } from '@/services/payment.service'
import { PASSWORD2, MERCHANT_LOGIN, RESULT_URL2 } from '@/config'
import md5 from 'md5'

export class PaymentSuccessController {
  private paymentService = new PaymentService()
  private password2 = PASSWORD2
  private merchantLogin = MERCHANT_LOGIN
  private resultUrl2 = RESULT_URL2

  public paymentSuccess = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { OutSum, InvId, SignatureValue, Culture } = req.query
      console.log('req.query', req.query)
      console.log(
        'OutSum, InvId, SignatureValue, Culture',
        OutSum,
        InvId,
        SignatureValue,
        Culture
      )

      const calculatedSignature = md5(
        `${this.merchantLogin}:${OutSum}:${InvId}:${encodeURIComponent(
          this.resultUrl2
        )}:${this.password2}`
      ).toUpperCase()

      if (calculatedSignature !== SignatureValue) {
        throw new Error('Invalid signature')
      } else {
        console.log('Signature is valid')
        await this.paymentService.processPayment(
          OutSum as string,
          InvId as string
        )
      }

      // Ответ Robokassa
      res.status(200).send(`OK${InvId}`)
    } catch (error) {
      console.error('Ошибка обработки успешного платежа:', error)
      res.status(500).send('Internal Server Error')
    }
  }
}
