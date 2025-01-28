import { GameService } from '@/services/gameService'

export class GameController {
  private gameService: GameService

  constructor() {
    this.gameService = new GameService()
  }

  public handleGameStep = async (req: any, res: any): Promise<void> => {
    const {
      roll,
      telegram_id,
    }: {
      roll: number
      telegram_id: string
      report: string
    } = req.body

    console.log('roll', roll)
    console.log('telegram_id', telegram_id)

    const { gameStep, plan } = await this.gameService.processGameStep(
      roll,
      telegram_id
    )

    res.json({ gameStep, plan })
  }
}
