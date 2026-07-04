import type { WizardStep } from "../types";

interface WizardTabsProps {
  currentStep: WizardStep;
  onTabClick: (step: WizardStep) => void;
}

const STEPS: WizardStep[] = [1, 2, 3];
const LABELS: Record<WizardStep, string> = {
  1: "Generate",
  2: "Review",
  3: "Done",
};

export function WizardTabs({ currentStep, onTabClick }: WizardTabsProps) {
  return (
    <div className="wizard-tabs">
      {STEPS.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isDisabled = step > currentStep;

        return (
          <button
            key={step}
            className={`wizard-tab ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            onClick={() => onTabClick(step)}
            disabled={isDisabled}
          >
            <span className="wizard-tab-number">
              {isCompleted ? "✓" : step}
            </span>
            <span className="wizard-tab-label">{LABELS[step]}</span>
          </button>
        );
      })}
    </div>
  );
}
