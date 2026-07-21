import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import Tabs from "../../../shared/components/Tabs";
import MarkdownRender from "../../../shared/components/MarkdownRender";
import MarkdownEditor from "../../../shared/components/MarkdownEditor";
import { Input } from "../../../shared/components/controls/Input";
import type { GeneratedCardData } from "../types";
import styles from "../AddCard.module.css";

interface StepReviewProps {
  card: GeneratedCardData;
  isGenerating: boolean;
  error: string | null;
  onCardChange: (
    part: "topic" | "markdownContent",
    value: string
  ) => void;
}

export default function StepReview({
  card,
  isGenerating,
  error,
  onCardChange,
}: StepReviewProps) {
  if (isGenerating) {
    return (
      <div className={styles.stepLoading}>
        <ThinkingSphere />
        <p className={styles.loadingText}>Generating questions...</p>
      </div>
    );
  }

  return (
    <div className={styles.stepReview}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className={styles.reviewSection}>
          <h3>Card Topic</h3>
          <Input
            defaultValue={card.topic}
            onChange={(value) => onCardChange("topic", value)}
            placeholder="Enter card topic..."
          />
        </div>

        <div className={styles.reviewSection}>
          <div style={{ overflow: "scroll" }}>
            <Tabs
              tabs={[
                {
                  id: "content-view",
                  label: "View",
                  content: <MarkdownRender markdown={card.markdownContent} />,
                },
                {
                  id: "content-edit",
                  label: "Edit",
                  content: (
                    <MarkdownEditor
                      value={card.markdownContent}
                      onChange={(value) =>
                        onCardChange("markdownContent", value)
                      }
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
