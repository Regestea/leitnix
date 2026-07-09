import { AddCardWizardStep } from "../types";
import styles from "../AddCard.module.css";

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
    <div className={styles.wizardTabs}>
      {STEPS.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isDisabled = step > currentStep;

        return (
          <button
            key={step}
            className={`${styles.wizardTab} ${isActive ? styles.active : ""} ${isCompleted ? styles.completed : ""}`}
            onClick={() => onTabClick(step)}
            disabled={isDisabled}
          >
            <span className={styles.wizardTabNumber}>
              {isCompleted ? "✓" : step}
            </span>
            <span className={styles.wizardTabLabel}>{LABELS[step]}</span>
          </button>
        );
      })}
    </div>
  );
}
