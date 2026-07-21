import { describe, it, expect, vi } from "vitest";

const { mockSpeak, mockStop, mockIsLanguageSupported } = vi.hoisted(() => ({
  mockSpeak: vi.fn<() => Promise<void>>(),
  mockStop: vi.fn<() => Promise<void>>(),
  mockIsLanguageSupported: vi.fn<
    (options: { lang: string }) => Promise<{ supported: boolean }>
  >(),
}));

vi.mock("@capacitor-community/text-to-speech", () => ({
  TextToSpeech: {
    speak: mockSpeak,
    stop: mockStop,
    isLanguageSupported: mockIsLanguageSupported,
  },
}));

import { TextToSpeechService } from "../../src/services/textToSpeechService";

describe("TextToSpeechService", () => {
  const service = new TextToSpeechService();

  it("speak calls TextToSpeech.speak with all options", async () => {
    const options = {
      text: "hello",
      lang: "en",
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      voice: 1,
    };
    await service.speak(options);
    expect(mockSpeak).toHaveBeenCalledWith(options);
  });

  it("speak works with minimal options", async () => {
    await service.speak({ text: "hello" });
    expect(mockSpeak).toHaveBeenCalledWith({ text: "hello" });
  });

  it("stop calls TextToSpeech.stop", async () => {
    await service.stop();
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("isLanguageSupported returns true when supported", async () => {
    mockIsLanguageSupported.mockResolvedValue({ supported: true });
    const result = await service.isLanguageSupported("en");
    expect(result).toBe(true);
    expect(mockIsLanguageSupported).toHaveBeenCalledWith({ lang: "en" });
  });

  it("isLanguageSupported returns false when not supported", async () => {
    mockIsLanguageSupported.mockResolvedValue({ supported: false });
    const result = await service.isLanguageSupported("xx");
    expect(result).toBe(false);
  });
});
