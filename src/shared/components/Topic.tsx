import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage, faVolumeHigh, faStop } from "@fortawesome/free-solid-svg-icons";
import { translationService } from "../../services/translationService";
import { textToSpeechService } from "../../services/textToSpeechService";
import { useSettingStore } from "../../features/settings/store/settingStore";
import styles from "./Topic.module.css";

function isRtl(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return (
    (cp >= 0x0590 && cp <= 0x05ff) ||
    (cp >= 0x0600 && cp <= 0x06ff)
  );
}

function detectDir(text: string): "rtl" | "ltr" | undefined {
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) return "ltr";
    if (isRtl(ch)) return "rtl";
  }
  return undefined;
}

export default function Topic({ text }: { text: string }) {
  const { readAloudBadge, isShowTranslationControl, defaultTranslationTarget } = useSettingStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  async function handleTts(e: React.MouseEvent) {
    e.preventDefault();
    if (isPlaying) {
      await textToSpeechService.stop();
      setIsPlaying(false);
      return;
    }
    const lang = await translationService.detectLanguageAsync(translated ?? text);
    setIsPlaying(true);
    await textToSpeechService.speak({ text: translated ?? text, lang });
    setIsPlaying(false);
  }

  async function handleTranslate(e: React.MouseEvent) {
    e.preventDefault();
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    try {
      const result = await translationService.translateAsync(text, defaultTranslationTarget);
      setTranslated(result.translatedText);
    } catch {
      console.error("Topic translation failed");
    } finally {
      setTranslating(false);
    }
  }

  const displayText = translated ?? text;
  const dir = detectDir(displayText);

  return (
    <h2 className={styles.topic} dir={dir} style={dir === "rtl" ? { textAlign: "right" } : undefined}>
      {displayText}
      {readAloudBadge && text && (
        <button
          type="button"
          className={`${styles.topicBadge}${isPlaying ? ` ${styles.topicBadgeActive}` : ""}`}
          onClick={handleTts}
        >
          <FontAwesomeIcon icon={isPlaying ? faStop : faVolumeHigh} />
        </button>
      )}
      {isShowTranslationControl && text && (
        <button
          type="button"
          className={`${styles.topicBadge}${translating ? ` ${styles.topicBadgeActive}` : ""}`}
          onClick={handleTranslate}
          disabled={translating}
        >
          <FontAwesomeIcon icon={faLanguage} />
        </button>
      )}
    </h2>
  );
}
