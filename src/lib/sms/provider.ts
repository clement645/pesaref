export interface SmsMessage {
  to: string;
  message: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}
