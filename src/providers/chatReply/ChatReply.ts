import { Api, Context } from 'grammy';
import { TSendOptions, TPendingMessage, TEditOptions } from './types.js';
import { Logger } from '@nestjs/common';

const UPDATE_INTERVAL = 2000;

export class ChatReply {
  private static initialOptions: Pick<
    TSendOptions | TEditOptions,
    'parse_mode'
  > = {
    parse_mode: 'Markdown',
  };

  private static readonly logger = new Logger(ChatReply.name);
  private timeout: NodeJS.Timeout | null = null;
  private pendingMessage: TPendingMessage | null = null;

  constructor(
    private readonly api: Api,
    private readonly chatId: number,
    private readonly messageId: number,
  ) {}

  public async update(text: string, options?: TEditOptions) {
    if (this.pendingMessage?.text !== text) {
      this.pendingMessage = {
        text,
        options,
      };
      if (!this.timeout && this.pendingMessage.text) {
        this.startTimeout();
      }
    }
  }

  public static async sendMessage(
    ctx: Context,
    text: string,
    options?: TSendOptions,
  ) {
    try {
      const message = await ctx.reply(text, {
        ...this.initialOptions,
        ...options,
      });
      return new ChatReply(ctx.api, message.chat.id, message.message_id);
    } catch (err) {
      this.logger.error(err);
    }
  }

  private startTimeout() {
    this.timeout = setTimeout(this.handleTimeout, UPDATE_INTERVAL);
  }

  private handleTimeout = async () => {
    try {
      await this.api.editMessageText(
        this.chatId,
        this.messageId,
        this.pendingMessage.text,
        {
          ...ChatReply.initialOptions,
          ...this.pendingMessage.options,
        },
      );
    } catch (err) {
      ChatReply.logger.error(err);
    }
    this.pendingMessage = null;
    this.timeout = null;
  };
}
