import { useState } from "react";
import { Button } from "../../../shared/components/controls/Button";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import Tabs from "../../../shared/components/Tabs";
import MarkdownRender from "../../../shared/components/MarkdownRender";
import MarkdownEditor from "../../../shared/components/MarkdownEditor";
import { CardService } from "../../../services/CardService";
import type {
  GeneratedCardData,
  QuestionsResponse,
  AddCardFormState,
} from "../types";

interface StepReviewProps {
  card: GeneratedCardData;
  formState: AddCardFormState;
  onComplete: () => void;
  onGenerateNewCard: () => void;
  onDone: () => void;
}

export default function StepReview({
  card: initialCard,
  formState,
  onComplete,
  onGenerateNewCard,
  onDone,
}: StepReviewProps) {
  const [card, setCard] = useState<GeneratedCardData>(initialCard);
  const [questions, setQuestions] = useState<QuestionsResponse | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTopicChange = (value: string) =>
    setCard((prev) => ({ ...prev, topicMarkdown: value }));

  const handleContentChange = (value: string) =>
    setCard((prev) => ({ ...prev, markdownContent: value }));

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    setError(null);
    try {
      const cardService = new CardService();
      const generated = await cardService.generateQuestions(
        formState.aiModelId,
        card,
      );
      setQuestions(generated);

      const cardId = await cardService.saveCard({
        aiModelId: formState.aiModelId,
        categoryTagId: formState.categoryTagId,
        card,
        questions: generated,
      });

      if (cardId) onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="step-review">
      {isGeneratingQuestions ? (
        <div className="step-loading">
          <ThinkingSphere />
          <p className="loading-text">Generating questions...</p>
        </div>
      ) : questions ? (
        <div className="step-complete-review">
          <p className="complete-message">
            Card and questions saved successfully!
          </p>
          <div className="step-actions">
            <Button label="Generate New Card" onClick={onGenerateNewCard} />
            <Button label="Done" onClick={onDone} />
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="review-section">
            <h3>Card Topic</h3>
            <div style={{ overflow: "scroll", height: "30dvh" }}>
              <Tabs
                tabs={[
                  {
                    id: "topic-view",
                    label: "View",
                    content: <MarkdownRender markdown={card.topicMarkdown} />,
                  },
                  {
                    id: "topic-edit",
                    label: "Edit",
                    content: (
                      <MarkdownEditor
                        value={card.topicMarkdown}
                        onChange={handleTopicChange}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div className="review-section">
            <h3>Content</h3>
            <div style={{ overflow: "scroll", height: "40dvh" }}>
              <Tabs
                tabs={[
                  {
                    id: "content-view",
                    label: "View",
                    content: (
                      <MarkdownRender markdown={card.markdownContent} />
                    ),
                  },
                  {
                    id: "content-edit",
                    label: "Edit",
                    content: (
                      <MarkdownEditor
                        value={card.markdownContent}
                        onChange={handleContentChange}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {error && <p className="field-error">{error}</p>}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <Button
              style={{ width: "100%" }}
              label="Generate Questions"
              onClick={handleGenerateQuestions}
            />
          </div>
        </div>
      )}
    </div>
  );
}
