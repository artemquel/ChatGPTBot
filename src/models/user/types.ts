import { ChatGPTAPI } from 'chatgpt';
import { Model } from 'mongoose';
import { User } from './user.js';

export interface IUser {
  telegramId: number;
  openAiToken: string;
  parentMessageId: string;
  chatGPTFactory: () => ChatGPTAPI;
}

export interface IUserModel extends Model<User> {
  getByTelegramId: (telegramId: number) => Promise<User>;
}
