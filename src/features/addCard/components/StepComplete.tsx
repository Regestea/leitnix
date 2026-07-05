import { Button } from "../../../shared/components/controls/Button";

interface StepCompleteProps {
  onGenerateNewCard: () => void;
  onDone: () => void;
}

export default function StepComplete({
  onGenerateNewCard,
  onDone,
}: StepCompleteProps) {
  return (
    <div className="step-complete">
      <div className="complete-icon">✓</div>
      <h2>Card Created!</h2>
      <p className="complete-message">
        Your flashcard with study content and questions has been saved successfully.
      </p>
      <div className="step-actions">
        <Button label="Generate New Card" onClick={onGenerateNewCard} />
        <Button label="Done" onClick={onDone} />
      </div>
    </div>
  );
}
