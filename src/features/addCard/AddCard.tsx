import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import MainContainer from "../../shared/components/MainContainer";
import { useAddCardForm } from "./hooks/useAddCardForm";
import { useCardGeneration } from "./hooks/useCardGeneration";
import { WizardTabs } from "./components/WizardTabs";
import StepGenerate from "./components/StepGenerate";
import StepReview from "./components/StepReview";
import StepComplete from "./components/StepComplete";
import type { WizardStep } from "./types";
import "./AddCard.css";

export default function AddCard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isComplete, setIsComplete] = useState(false);

  const form = useAddCardForm();
  const {
    generatedCard,
    setGeneratedCard,
    isGenerating,
    isGeneratingQuestions,
    error,
    generateCard,
    generateQuestions,
    saveCard,
    clearGenerated,
  } = useCardGeneration();

  const handleGenerate = useCallback(async () => {
    if (!form.validate()) return;

    const result = await generateCard(
      form.formState.aiModelId,
      form.formState.topicText,
      form.formState.customPromptId
    );

    if (result) {
      setIsComplete(false);
      setCurrentStep(2);
    }
  }, [form, generateCard]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!generatedCard) return;

    const questions = await generateQuestions(
      form.formState.aiModelId,
      generatedCard
    );

    if (questions) {
      const cardId = await saveCard(
        generatedCard,
        questions,
        form.formState.categoryTagId
      );

      if (cardId) {
        setIsComplete(true);
      }
    }
  }, [generatedCard, form.formState.aiModelId, form.formState.categoryTagId, generateQuestions, saveCard]);

  const handleCardChange = useCallback(
    (updatedCard: typeof generatedCard) => {
      setGeneratedCard(updatedCard);
    },
    [setGeneratedCard]
  );

  const handleTabClick = useCallback(
    (step: WizardStep) => {
      if (step < currentStep) setCurrentStep(step);
    },
    [currentStep]
  );

  const handleGenerateNewCard = useCallback(() => {
    form.reset();
    clearGenerated();
    setIsComplete(false);
    setCurrentStep(1);
  }, [form, clearGenerated]);

  const handleDone = useCallback(() => navigate("/"), [navigate]);

  return (
    <MainContainer>
      <div className="add-card-wizard">
        <WizardTabs currentStep={currentStep} onTabClick={handleTabClick} />

        <div className="wizard-content">
          {currentStep === 1 && (
            <StepGenerate
              formState={form.formState}
              formErrors={form.formErrors}
              setCategoryTagId={form.setCategoryTagId}
              setAiModelId={form.setAiModelId}
              setCustomPromptId={form.setCustomPromptId}
              setTopicText={form.setTopicText}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
          )}

          {currentStep === 2 && generatedCard && (
            <StepReview
              card={generatedCard}
              onCardChange={handleCardChange}
              isGeneratingQuestions={isGeneratingQuestions}
              error={error}
              onGenerateQuestions={handleGenerateQuestions}
              onDone={handleDone}
              onGenerateNewCard={handleGenerateNewCard}
              isComplete={isComplete}
            />
          )}

          {currentStep === 3 && (
            <StepComplete
              onGenerateNewCard={handleGenerateNewCard}
              onDone={handleDone}
            />
          )}
        </div>

        {error && currentStep === 1 && (
          <div className="wizard-error">
            <p className="field-error">{error}</p>
          </div>
        )}
      </div>
    </MainContainer>
  );
}
