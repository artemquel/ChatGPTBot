import { Api, Context } from 'grammy';

const updateInterval = 2000;

export class ChatReply {
  private timeout: NodeJS.Timeout | null;
  private pendingMessage: string;

  constructor(
    private readonly api: Api,
    private readonly chatId: number,
    private readonly messageId: number,
  ) {}

  public async update(text: string) {
    if (this.pendingMessage !== text) {
      this.pendingMessage = text;
      if (!this.timeout) {
        this.startTimeout();
      }
    }
  }

  public static async sendMessage(ctx: Context, text: string) {
    const message = await ctx.reply(text);
    return new ChatReply(ctx.api, message.chat.id, message.message_id);
  }

  private startTimeout() {
    this.timeout = setTimeout(async () => {
      await this.api.editMessageText(
        this.chatId,
        this.messageId,
        this.pendingMessage,
      );
      this.pendingMessage = '';
      this.timeout = null;
    }, updateInterval);
  }
}
