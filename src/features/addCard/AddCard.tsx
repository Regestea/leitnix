import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import MainContainer from "../../shared/components/MainContainer";
import { WizardTabs } from "./components/WizardTabs";
import StepGenerate from "./components/StepGenerate";
import StepReview from "./components/StepReview";
import StepComplete from "./components/StepComplete";
import { AddCardWizardStep } from "./types";
import type { AddCardFormState, GeneratedCardData } from "./types";
import "./AddCard.css";

export default function AddCard() {
  const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<AddCardWizardStep>(
    AddCardWizardStep.Generate
  );
  const [generatedCard, setGeneratedCard] =
    useState<GeneratedCardData | null>(null);
  const [formState, setFormState] = useState<AddCardFormState | null>(null);

  const handleTabClick = useCallback(
    (step: AddCardWizardStep) => {
      if (step < currentStep) setCurrentStep(step);
    },
    [currentStep]
  );

  const handleGenerated = useCallback(
    (card: GeneratedCardData, form: AddCardFormState) => {
      setGeneratedCard(card);
      setFormState(form);
      setCurrentStep(AddCardWizardStep.Review);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setCurrentStep(AddCardWizardStep.Complete);
  }, []);

  const handleGenerateNewCard = useCallback(() => {
    setGeneratedCard(null);
    setFormState(null);
    setCurrentStep(AddCardWizardStep.Generate);
  }, []);

  const handleDone = useCallback(() => navigate("/"), [navigate]);

  return (
    <MainContainer>
      <div className="add-card-wizard">
        <WizardTabs currentStep={currentStep} onTabClick={handleTabClick} />

        <div className="wizard-content">
          {currentStep === AddCardWizardStep.Generate && (
            <StepGenerate onGenerated={handleGenerated} />
          )}

          {currentStep === AddCardWizardStep.Review &&
            generatedCard &&
            formState && (
              <StepReview
                card={generatedCard}
                formState={formState}
                onComplete={handleComplete}
                onGenerateNewCard={handleGenerateNewCard}
                onDone={handleDone}
              />
            )}

          {currentStep === AddCardWizardStep.Complete && (
            <StepComplete
              onGenerateNewCard={handleGenerateNewCard}
              onDone={handleDone}
            />
          )}
        </div>
      </div>
    </MainContainer>
  );
}

