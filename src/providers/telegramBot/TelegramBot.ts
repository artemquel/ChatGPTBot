import { Bot, Keyboard } from 'grammy';
import { config } from '../../config.js';
import { Logger } from '@nestjs/common';
import { NestServices } from '../../NestServices.js';
import { User } from '../../models/user/user.js';
import { IUserModel } from '../../models/user/types.js';
import { ChatGPTError, ChatMessage } from 'chatgpt';
import { ChatReply } from '../chatReply/ChatReply.js';

enum InlineCommand {
  CHANGE_TOKEN = 'Поменять API токен',
  RESET_CONTEXT = 'Сбросить контекст диалога',
}

export class TelegramBot {
  private readonly _grammy: Bot;
  private readonly logger = new Logger(TelegramBot.name);

  constructor() {
    this._grammy = new Bot(config.botToken);
    this.start();
  }

  public get grammy(): Bot {
    return this._grammy;
  }

  public start(): void {
    this.grammy.start();

    this.grammy.command('start', async (ctx) => {
      await ctx.reply(
        'Привет, для начала работы необходимо установить API ключ OpenAI, отправь его в ответном сообщении.\n\nСгенерировать ключ можно [здесь](https://platform.openai.com/account/api-keys).',
        { parse_mode: 'Markdown' },
      );
    });

    this.grammy.on('message', async (ctx) => {
      const UserModel = NestServices.getModel<IUserModel>(User.name);
      const user = await UserModel.getByTelegramId(ctx.update.message.from.id);

      if (ctx.update.message.text === InlineCommand.CHANGE_TOKEN) {
        user.openAiToken = '';

        await ctx.reply('Пришли новый API ключ в ответном сообщении.');
      } else if (ctx.update.message.text === InlineCommand.RESET_CONTEXT) {
        user.parentMessageId = '';

        await ctx.reply('Контекст диалога сброшен.');
      } else {
        const message = await ChatReply.sendMessage(ctx, 'Пишет...');
        try {
          let response: ChatMessage;
          if (!user.openAiToken) {
            user.openAiToken = ctx.update.message.text;

            const chatGpt = user.chatGPTFactory();

            response = await chatGpt.sendMessage('Привет! Давай познакомися.', {
              onProgress(response) {
                message.update(response.text);
              },
            });

            await ctx.reply('', {
              reply_markup: new Keyboard()
                .resized(true)
                .text(InlineCommand.CHANGE_TOKEN)
                .row()
                .text(InlineCommand.RESET_CONTEXT),
            });
          } else {
            const chatGpt = user.chatGPTFactory();

            response = await chatGpt.sendMessage(ctx.update.message.text, {
              parentMessageId: user.parentMessageId,
              onProgress(response) {
                message.update(response.text);
              },
            });
          }
          await message.update(`${response.text}\n✅`);
          user.parentMessageId = response.id;
        } catch (err) {
          if (
            (err instanceof ChatGPTError && err.statusCode === 401) ||
            err.message.includes('Cannot convert argument to a ByteString')
          ) {
            user.openAiToken = '';
            await ctx.reply('Некорректный API ключ. Попробуй еще раз.');
          } else {
            throw err;
          }
        }
      }
      await user.save();
    });

    this.logger.log('Grammy started');
  }
}
