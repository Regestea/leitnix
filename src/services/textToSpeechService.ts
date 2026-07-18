import { TextToSpeech } from "@capacitor-community/text-to-speech";
import type { ITextToSpeechService, TtsOptions } from "./ITextToSpeechService";

export class TextToSpeechService implements ITextToSpeechService {
  async speak(options: TtsOptions): Promise<void> {
    await TextToSpeech.speak({
      text: options.text,
      lang: options.lang,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume,
      voice: options.voice,
    });
  }

  async stop(): Promise<void> {
    await TextToSpeech.stop();
  }

  async isLanguageSupported(lang: string): Promise<boolean> {
    const { supported } = await TextToSpeech.isLanguageSupported({ lang });
    return supported;
  }
}

export const textToSpeechService: ITextToSpeechService =
  new TextToSpeechService();
