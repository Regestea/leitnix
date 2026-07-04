import { useState } from "react";
import { useNavigate } from "react-router";
import MainContainer from "../../shared/components/MainContainer";
import { useAddCardForm } from "./hooks/useAddCardForm";
import { useCardGeneration } from "./hooks/useCardGeneration";
import StepGenerate from "./components/StepGenerate";
import StepReview from "./components/StepReview";
import StepComplete from "./components/StepComplete";
import type { WizardStep, GeneratedCardData, QuestionsResponse } from "./types";
import "./AddCard.css";

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Generate",
  2: "Review",
  3: "Done",
};

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

  const [savedQuestions, setSavedQuestions] =
    useState<QuestionsResponse | null>(null);

  // savedQuestions is tracked for potential future display
  void savedQuestions;

  const handleGenerate = async () => {
    if (!form.validate()) return;

    const result = await generateCard(
      form.formState.aiModelId,
      form.formState.topicText,
      form.formState.customPromptId
    );

    if (result) {
      setIsComplete(false);
      setSavedQuestions(null);
      setCurrentStep(2);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!generatedCard) return;

    const questions = await generateQuestions(
      form.formState.aiModelId,
      generatedCard
    );

    if (questions) {
      const cardId = await saveCard(
        generatedCard,
        questions,
        form.formState.aiModelId,
        form.formState.categoryTagId
      );

      if (cardId) {
        setSavedQuestions(questions);
        setIsComplete(true);
      }
    }
  };

  const handleCardChange = (updatedCard: GeneratedCardData) => {
    setGeneratedCard(updatedCard);
  };

  const handleGenerateNewCard = () => {
    form.reset();
    clearGenerated();
    setIsComplete(false);
    setSavedQuestions(null);
    setCurrentStep(1);
  };

  const handleDone = () => {
    navigate("/");
  };

  const handleTabClick = (step: WizardStep) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <MainContainer>
      <div className="add-card-wizard">
        <div className="wizard-tabs">
          {([1, 2, 3] as WizardStep[]).map((step) => (
            <button
              key={step}
              className={`wizard-tab ${
                step === currentStep ? "active" : ""
              } ${step < currentStep ? "completed" : ""}`}
              onClick={() => handleTabClick(step)}
              disabled={step > currentStep}
            >
              <span className="wizard-tab-number">
                {step < currentStep ? "✓" : step}
              </span>
              <span className="wizard-tab-label">{STEP_LABELS[step]}</span>
            </button>
          ))}
        </div>

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
