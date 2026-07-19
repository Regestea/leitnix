import MarkdownRender from "../../../shared/components/MarkdownRender";
import styles from "./FreeResponseQuestionCard.module.css";

interface FreeResponseQuestionCardProps {
  markdownQuestion: string;
  markdownAnswer: string;
  showAnswer: boolean;
}

export default function FreeResponseQuestionCard({
  markdownQuestion,
  markdownAnswer,
  showAnswer,
}: FreeResponseQuestionCardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.question}>
        <MarkdownRender markdown={markdownQuestion} isShowTranslationControl={false} />
      </div>

      {showAnswer && (
        <div className={styles.answer}>
          <MarkdownRender markdown={markdownAnswer} isShowTranslationControl={false} />
        </div>
      )}
    </div>
  );
}
