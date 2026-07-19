import MarkdownRender from "../../../shared/components/MarkdownRender";
import type { MultipleChoiceOption } from "../../../db/entities";
import styles from "./MultipleChoiceQuestionCard.module.css";

interface MultipleChoiceQuestionCardProps {
  markdownQuestion: string;
  markdownOptionA: string;
  markdownOptionB: string;
  markdownOptionC: string;
  markdownOptionD: string;
  correctOption: MultipleChoiceOption;
  selectedOption: MultipleChoiceOption | null;
  onSelectOption: (option: MultipleChoiceOption) => void;
}

const OPTIONS: { key: MultipleChoiceOption; label: string }[] = [
  { key: "A", label: "A" },
  { key: "B", label: "B" },
  { key: "C", label: "C" },
  { key: "D", label: "D" },
];

export default function MultipleChoiceQuestionCard({
  markdownQuestion,
  markdownOptionA,
  markdownOptionB,
  markdownOptionC,
  markdownOptionD,
  correctOption,
  selectedOption,
  onSelectOption,
}: MultipleChoiceQuestionCardProps) {
  const optionMap: Record<MultipleChoiceOption, string> = {
    A: markdownOptionA,
    B: markdownOptionB,
    C: markdownOptionC,
    D: markdownOptionD,
  };

  const submitted = selectedOption !== null;

  return (
    <div className={styles.container}>
      <div className={styles.question}>
        <MarkdownRender markdown={markdownQuestion} isShowTranslationControl={false} />
      </div>

      <div className={styles.options}>
        {OPTIONS.map(({ key, label }) => {
          let optionClass = styles.option;

          if (submitted) {
            if (key === correctOption) {
              optionClass += ` ${styles.correct}`;
            } else if (key === selectedOption) {
              optionClass += ` ${styles.incorrect}`;
            }
          }

          if (key === selectedOption) {
            optionClass += ` ${styles.selected}`;
          }

          return (
            <button
              key={key}
              className={optionClass}
              onClick={() => onSelectOption(key)}
              disabled={submitted}
            >
              <span className={styles.optionLabel}>{label}</span>
              <span className={styles.optionContent}>
                <MarkdownRender markdown={optionMap[key]} isShowTranslationControl={false} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
