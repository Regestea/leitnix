import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import MainContainer from "../../shared/components/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { WizardTabs } from "./components/WizardTabs";
import StepGenerate from "./components/StepGenerate";
import StepReview from "./components/StepReview";
import StepComplete from "./components/StepComplete";
import { CardService } from "../../services/CardService";
import { AddCardWizardStep } from "./types";
import { EMPTY_FORM_STATE, validateAddCardForm } from "./types";
import type {
  AddCardFormState,
  AddCardFormErrors,
  GeneratedCardData,
} from "./types";
import "./AddCard.css";

export default function AddCard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<AddCardWizardStep>(
    AddCardWizardStep.Generate
  );

  // ── Generate-step state (lifted from StepGenerate) ────────────────
  const [formState, setFormState] =
    useState<AddCardFormState>(EMPTY_FORM_STATE);
  const [formErrors, setFormErrors] = useState<AddCardFormErrors>({});
  const [images, setImages] = useState<string[]>([]);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // ── Review-step state (lifted from StepReview) ────────────────────
  const [card, setCard] = useState<GeneratedCardData | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Snapshot of the form at generation time — the saved card/questions
  // must use the category tag + AI model that were active when "Generate"
  // was clicked, even if the user later edits the form on a re-run.
  const [formStateSaved, setFormStateSaved] =
    useState<AddCardFormState | null>(null);

  const handleTabClick = useCallback(
    (step: AddCardWizardStep) => {
      if (step < currentStep) setCurrentStep(step);
    },
    [currentStep]
  );

  // ── Generate handlers ─────────────────────────────────────────────
  const handleFieldChange = useCallback(
    (field: keyof AddCardFormState, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      // clear any stale field error as soon as the user edits the field
      setFormErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handleImagesChange = useCallback((next: string[]) => {
    setImages(next);
  }, []);

  const handleGenerate = useCallback(async () => {
    const { success, errors } = validateAddCardForm(formState);
    if (!success) {
      setFormErrors(errors);
      return;
    }

    setIsGeneratingCard(true);
    setCardError(null);
    try {
      const cardService = new CardService();
      const generated = await cardService.generateCard({
        topicType: formState.topicType,
        aiModelId: formState.aiModelId,
        customPromptId: formState.customPromptId,
        topicText: formState.topicText,
        images: images.length > 0 ? images : undefined,
      });
      setCard(generated);
      setFormStateSaved(formState);
      setCurrentStep(AddCardWizardStep.Review);
    } catch (err) {
      setCardError(
        err instanceof Error ? err.message : "Failed to generate card"
      );
    } finally {
      setIsGeneratingCard(false);
    }
  }, [formState, images]);

  // ── Review handlers ───────────────────────────────────────────────
  const handleCardChange = useCallback(
    (part: "topicMarkdown" | "markdownContent", value: string) => {
      setCard((prev) => (prev ? { ...prev, [part]: value } : prev));
    },
    []
  );

  const handleGenerateQuestions = useCallback(async () => {
    if (!card || !formStateSaved) return;

    setIsGeneratingQuestions(true);
    setQuestionError(null);
    try {
      const cardService = new CardService();
      const questions = await cardService.generateQuestions(
        formStateSaved.aiModelId,
        card
      );

      await cardService.saveCard({
        aiModelId: formStateSaved.aiModelId,
        categoryTagId: formStateSaved.categoryTagId,
        card,
        questions,
      });

      setCurrentStep(AddCardWizardStep.Complete);
    } catch (err) {
      setQuestionError(
        err instanceof Error ? err.message : "Failed to generate questions"
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [card, formStateSaved]);

  // ── Lifecycle handlers ────────────────────────────────────────────
  const handleGenerateNewCard = useCallback(() => {
    setFormState(EMPTY_FORM_STATE);
    setFormErrors({});
    setImages([]);
    setCardError(null);
    setIsGeneratingCard(false);
    setCard(null);
    setQuestionError(null);
    setIsGeneratingQuestions(false);
    setFormStateSaved(null);
    setCurrentStep(AddCardWizardStep.Generate);
  }, []);

  const handleDone = useCallback(() => navigate("/"), [navigate]);

  const isThinking = isGeneratingCard || isGeneratingQuestions;

  // ── Footer (no button while a thinking view is shown) ─────────────
  let footer = null;
  if (!isThinking) {
    if (currentStep === AddCardWizardStep.Generate) {
      footer = (
        <div className="add-card-footer">
          <Button
            style={{ width: "100%" }}
            label="Generate"
            onClick={handleGenerate}
          />
        </div>
      );
    } else if (currentStep === AddCardWizardStep.Review && card) {
      footer = (
        <div className="add-card-footer">
          <Button
            style={{ width: "100%" }}
            label="Generate Questions"
            onClick={handleGenerateQuestions}
          />
        </div>
      );
    } else if (currentStep === AddCardWizardStep.Complete) {
      footer = (
        <div className="step-actions">
          <Button label="Generate New Card" onClick={handleGenerateNewCard} />
          <Button label="Done" onClick={handleDone} />
        </div>
      );
    }
  }

  return (
    <MainContainer footer={footer}>
      <div className="add-card-wizard">
        <WizardTabs currentStep={currentStep} onTabClick={handleTabClick} />

        <div className="wizard-content">
          {currentStep === AddCardWizardStep.Generate && (
            <StepGenerate
              formState={formState}
              formErrors={formErrors}
              images={images}
              isGenerating={isGeneratingCard}
              error={cardError}
              onFieldChange={handleFieldChange}
              onImagesChange={handleImagesChange}
            />
          )}

          {currentStep === AddCardWizardStep.Review && card && (
            <StepReview
              card={card}
              isGenerating={isGeneratingQuestions}
              error={questionError}
              onCardChange={handleCardChange}
            />
          )}

          {currentStep === AddCardWizardStep.Complete && <StepComplete />}
        </div>
      </div>
    </MainContainer>
  );
}
