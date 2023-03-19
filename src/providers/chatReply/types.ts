import { RawApi } from 'grammy';

export type TSendOptions = Omit<
  Parameters<RawApi['sendMessage']>[0],
  'text' | 'chat_id'
>;

export type TEditOptions = Omit<
  Parameters<RawApi['editMessageText']>[0],
  'text' | 'chat_id'
>;

export type TPendingMessage = {
  text: string;
  options?: TEditOptions;
};
