import MarkdownRender from "../../../shared/components/MarkdownRender";
import styles from "./FillTheBlankQuestionCard.module.css";

interface FillTheBlankQuestionCardProps {
  markdownQuestion: string;
  markdownAnswer: string;
  showAnswer: boolean;
}

export default function FillTheBlankQuestionCard({
  markdownQuestion,
  markdownAnswer,
  showAnswer,
}: FillTheBlankQuestionCardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.question}>
        <MarkdownRender markdown={markdownQuestion} />
      </div>

      {showAnswer && (
        <div className={styles.answer}>
          <MarkdownRender markdown={markdownAnswer} />
        </div>
      )}
    </div>
  );
}
