import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import Tabs from "../../../shared/components/Tabs";
import MarkdownRender from "../../../shared/components/MarkdownRender";
import MarkdownEditor from "../../../shared/components/MarkdownEditor";
import { Input } from "../../../shared/components/controls/Input";
import type { GeneratedCardData } from "../types";

interface StepReviewProps {
  card: GeneratedCardData;
  isGenerating: boolean;
  error: string | null;
  onCardChange: (
    part: "topicMarkdown" | "markdownContent",
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
      <div className="step-loading">
        <ThinkingSphere />
        <p className="loading-text">Generating questions...</p>
      </div>
    );
  }

  return (
    <div className="step-review">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="review-section">
          <h3>Card Topic</h3>
          <Input
            defaultValue={card.topicMarkdown}
            onChange={(value) => onCardChange("topicMarkdown", value)}
            placeholder="Enter card topic..."
          />
        </div>

        <div className="review-section">
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
