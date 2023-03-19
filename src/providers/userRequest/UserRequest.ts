import { Context, Keyboard } from 'grammy';
import { User } from '../../models/user/user.js';
import { NestServices } from '../../NestServices.js';
import { IUserModel } from '../../models/user/types.js';
import { InlineCommand } from './types.js';
import { ChatGPTError } from 'chatgpt';
import { Logger } from '@nestjs/common';
import { ChatReply } from '../chatReply/ChatReply.js';

export class UserRequest {
  private _user: User | null = null;
  private readonly logger: Logger;

  constructor(private readonly ctx: Context) {
    this.logger = new Logger(UserRequest.name);
  }

  public async handle() {
    try {
      const UserModel = NestServices.getModel<IUserModel>(User.name);
      this._user = await UserModel.getByTelegramId(
        this.ctx.update.message.from.id,
      );

      if (!this.user.openAiToken) {
        await this.startSetTokenFlow();
      } else if (this.ctx.message.text === InlineCommand.CHANGE_TOKEN) {
        await this.startChangeTokenFlow();
      } else if (this.ctx.message.text === InlineCommand.RESET_CONTEXT) {
        await this.startResetContextFlow();
      } else {
        await this.startChatGPTFlow();
      }

      await this.user.save();
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async startChatGPTFlow() {
    const chatGPT = this.user.chatGPTFactory();

    const reply = await ChatReply.sendMessage(this.ctx, 'Пишет...');

    let latestResponse: string = '';

    try {
      const response = await chatGPT.sendMessage(this.ctx.update.message.text, {
        parentMessageId: this.user.parentMessageId,
        onProgress: async (message) => {
          latestResponse = message.text;
          await reply.update(latestResponse);
        },
      });

      this.user.parentMessageId = response.id;
    } catch (err) {
      await reply.update(`${latestResponse}\n❌ Произошла ошибка`);
    }
  }

  private async startResetContextFlow() {
    this.user.parentMessageId = '';
    await this.ctx.reply('Контекст диалога сброшен.');
  }

  private async startChangeTokenFlow() {
    this.user.openAiToken = '';
    await this.ctx.reply('Пришли новый API ключ в ответном сообщении.');
  }

  private async startSetTokenFlow() {
    this.user.openAiToken = this.ctx.update.message.text;
    const chatGpt = this.user.chatGPTFactory();

    try {
      const response = await chatGpt.sendMessage('Привет! Давай познакомися.');

      await this.ctx.reply(response.text, {
        parse_mode: 'Markdown',
        reply_markup: new Keyboard()
          .resized(true)
          .text(InlineCommand.CHANGE_TOKEN)
          .row()
          .text(InlineCommand.RESET_CONTEXT),
      });

      this.user.parentMessageId = response.id;
    } catch (err) {
      if (
        (err instanceof ChatGPTError && err.statusCode === 401) ||
        err.message.includes('Cannot convert argument to a ByteString')
      ) {
        this.user.openAiToken = '';

        await this.ctx.reply('Некорректный API ключ. Попробуй еще раз.');
      } else {
        throw err;
      }
    }
  }

  private get user(): User {
    if (!this._user) {
      throw new Error('User not found');
    }
    return this._user;
  }
}
