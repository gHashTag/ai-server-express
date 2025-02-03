// src/services/bot.service.ts
import { Telegraf } from 'telegraf'

export class BotService {
  private bots: Telegraf<any>[] = []

  constructor(tokens: string[]) {
    this.initializeBots(tokens)
  }

  private initializeBots(tokens: string[]) {
    tokens.forEach(token => {
      const bot = new Telegraf(token)

      bot.on('text', ctx => {
        console.log(ctx.message)
        ctx.reply('I am one of the bots!')
      })

      this.bots.push(bot)
      bot
        .launch()
        .then(() => {
          console.log(`Bot launched with token: ${token}`)
        })
        .catch(error => {
          console.error(`Failed to launch bot with token: ${token}`, error)
        })
    })
  }
}
