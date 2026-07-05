import { AddCardWizardStep } from "../types";

interface WizardTabsProps {
  currentStep: AddCardWizardStep;
  onTabClick: (step: AddCardWizardStep) => void;
}

const STEPS: AddCardWizardStep[] = [
  AddCardWizardStep.Generate,
  AddCardWizardStep.Review,
  AddCardWizardStep.Complete,
];

const LABELS: Record<AddCardWizardStep, string> = {
  [AddCardWizardStep.Generate]: "Generate",
  [AddCardWizardStep.Review]: "Review",
  [AddCardWizardStep.Complete]: "Done",
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
