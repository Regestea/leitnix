import { Textarea } from "../../../shared/components/controls/Textarea";
import { Button } from "../../../shared/components/controls/Button";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import type { GeneratedCardData } from "../types";

interface StepReviewProps {
  card: GeneratedCardData;
  onCardChange: (updatedCard: GeneratedCardData) => void;
  isGeneratingQuestions: boolean;
  error: string | null;
  onGenerateQuestions: () => void;
  onDone: () => void;
  onGenerateNewCard: () => void;
  isComplete: boolean;
}

export default function StepReview({
  card,
  onCardChange,
  isGeneratingQuestions,
  error,
  onGenerateQuestions,
  onDone,
  onGenerateNewCard,
  isComplete,
}: StepReviewProps) {
  const handleTopicChange = (value: string) => {
    onCardChange({ ...card, topicMarkdown: value });
  };

  const handleNoteChange = (index: number, value: string) => {
    const updated = [...card.notes];
    updated[index] = value;
    onCardChange({ ...card, notes: updated });
  };

  return (
    <div className="step-review">
      {isGeneratingQuestions ? (
        <div className="step-loading">
          <ThinkingSphere />
          <p className="loading-text">Generating questions...</p>
        </div>
      ) : isComplete ? (
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
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="review-section">
            <h3>Card Topic</h3>
            <Textarea
              label="Topic (Markdown)"
              defaultValue={card.topicMarkdown}
              rows={4}
              onChange={handleTopicChange}
            />
          </div>

          <div className="review-section">
            <h3>Notes ({card.notes.length})</h3>
            {card.notes.map((note, index) => (
              <Textarea
                key={index}
                label={`Note ${index + 1}`}
                defaultValue={note}
                rows={4}
                onChange={(value) => handleNoteChange(index, value)}
              />
            ))}
          </div>

          {error && <p className="field-error">{error}</p>}

          <div className="step-actions">
            <Button label="Generate Questions" onClick={onGenerateQuestions} />
          </div>
        </div>
      )}
    </div>
  );
}
