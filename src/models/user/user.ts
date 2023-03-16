import { IUser } from './types.js';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { ChatGPTAPI } from 'chatgpt';

@Schema({ versionKey: false })
export class User extends Document implements IUser {
  @Prop()
  openAiToken: string;

  @Prop({ required: true, unique: true })
  telegramId: number;

  @Prop()
  parentMessageId: string;

  chatGPTFactory: () => ChatGPTAPI;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.chatGPTFactory = function (this: User): ChatGPTAPI {
  if (!this.openAiToken) {
    throw new Error('User OpenAI token is not defined');
  }
  return new ChatGPTAPI({ apiKey: this.openAiToken });
};

UserSchema.statics.getByTelegramId = async function (
  this: Model<User>,
  telegramId: number,
): Promise<User> {
  const user = await this.findOne({ telegramId });
  if (user) {
    return user;
  }

  return this.create({
    telegramId,
  });
};
