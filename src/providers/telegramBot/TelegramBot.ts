import { Bot, Context } from 'grammy';
import { config } from '../../config.js';
import { Logger } from '@nestjs/common';
import { UserRequest } from '../userRequest/UserRequest.js';

export class TelegramBot {
  private readonly _grammy: Bot;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(TelegramBot.name);

    this._grammy = new Bot(config.botToken);
    this.grammy.start();
    this.grammy.command('start', this.onStartCommand);
    this.grammy.on('message', this.onMessageReceived);

    this.logger.log('Grammy started');
  }

  private async onStartCommand(ctx) {
    await ctx.reply(
      'Привет, для начала работы необходимо установить API ключ OpenAI, отправь его в ответном сообщении.\n\nСгенерировать ключ можно [здесь](https://platform.openai.com/account/api-keys).',
      { parse_mode: 'Markdown' },
    );
  }

  private async onMessageReceived(ctx: Context) {
    const userRequest = new UserRequest(ctx);
    await userRequest.handle();
  }

  public get grammy(): Bot {
    return this._grammy;
  }
}
