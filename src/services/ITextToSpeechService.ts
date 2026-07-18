export interface TtsOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: number;
}

export interface ITextToSpeechService {
  speak(options: TtsOptions): Promise<void>;
  stop(): Promise<void>;
  isLanguageSupported(lang: string): Promise<boolean>;
}
