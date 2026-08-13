import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import MainContainer from "../../shared/components/mainContainer/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { NixButton } from "../../shared/components/controls/NixButton";
import AiChatModal from "../aiChat/AiChatModal";
import useModal from "../../shared/hooks/useModal";
import { WizardTabs } from "./components/WizardTabs";
import StepGenerate from "./components/StepGenerate";
import StepReview from "./components/StepReview";
import StepComplete from "./components/StepComplete";
import { cardService } from "./services/CardService";
import type { ICardService } from "./services/ICardService";
import {
  AddCardWizardStep,
  EMPTY_FORM_STATE,
  validateAddCardForm,
  QUESTION_TYPES,
} from "./types";
import type {
  AddCardFormState,
  AddCardFormErrors,
  GeneratedCardData,
  QuestionType,
} from "./types";
import styles from "./AddCard.module.css";

export default function AddCard() {
  const navigate = useNavigate();
  const aiChatModal = useModal();
  const [currentStep, setCurrentStep] = useState<AddCardWizardStep>(
    AddCardWizardStep.Generate,
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
  const [prevMarkdownContent, setPrevMarkdownContent] = useState("");
  const [nixChangedContent, setNixChangedContent] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionTypes, setQuestionTypes] = useState<readonly QuestionType[]>([
    ...QUESTION_TYPES,
  ]);

  // Snapshot of the form at generation time — the saved card/questions
  // must use the category tag + AI model that were active when "Generate"
  // was clicked, even if the user later edits the form on a re-run.
  const [formStateSaved, setFormStateSaved] = useState<AddCardFormState | null>(
    null,
  );

  const handleTabClick = useCallback(
    (step: AddCardWizardStep) => {
      if (step < currentStep) setCurrentStep(step);
    },
    [currentStep],
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
    [],
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
      const service: ICardService = cardService;
      const generated = await service.generateCard({
        topicType: formState.topicType,
        aiModelId: formState.aiModelId,
        customPromptId: formState.customPromptId,
        topicText: formState.topicText,
        images: images.length > 0 ? images : undefined,
      });
      setCard(generated);
      setPrevMarkdownContent(generated.markdownContent);
      setNixChangedContent(false);
      setFormStateSaved(formState);
      setCurrentStep(AddCardWizardStep.Review);
    } catch (err) {
      setCardError(
        err instanceof Error ? err.message : "Failed to generate card",
      );
    } finally {
      setIsGeneratingCard(false);
    }
  }, [formState, images]);

  // ── Review handlers ───────────────────────────────────────────────
  const handleCardChange = useCallback(
    (part: "topic" | "markdownContent", value: string) => {
      setCard((prev) => (prev ? { ...prev, [part]: value } : prev));
    },
    [],
  );

  const handleNixRollback = useCallback(() => {
    if (!card) return;
    setCard((prev) => prev ? { ...prev, markdownContent: prevMarkdownContent } : prev);
    setNixChangedContent(false);
  }, [card, prevMarkdownContent]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!card || !formStateSaved) return;

    setIsGeneratingQuestions(true);
    setQuestionError(null);
    try {
      const service: ICardService = cardService;
      const questions = await service.generateQuestions(
        formStateSaved.aiModelId,
        card,
        questionTypes,
      );

      await service.saveCard({
        aiModelId: formStateSaved.aiModelId,
        categoryTagId: formStateSaved.categoryTagId,
        card,
        questions,
      });

      setCurrentStep(AddCardWizardStep.Complete);
    } catch (err) {
      setQuestionError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [card, formStateSaved, questionTypes]);

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
    setQuestionTypes([...QUESTION_TYPES]);
    setCurrentStep(AddCardWizardStep.Generate);
  }, []);

  const handleDone = useCallback(() => navigate("/"), [navigate]);

  const isThinking = isGeneratingCard || isGeneratingQuestions;

  // ── Footer (no button while a thinking view is shown) ─────────────
  let footer = null;
  if (!isThinking) {
    if (currentStep === AddCardWizardStep.Generate) {
      footer = (
        <div className={styles.addCardFooter}>
          <Button
            style={{ width: "100%" }}
            label="Generate"
            onClick={handleGenerate}
          />
        </div>
      );
    } else if (currentStep === AddCardWizardStep.Review && card) {
      footer = (
        <div className={styles.addCardFooter}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              width: "100%",
            }}
          >
            <NixButton onClick={aiChatModal.open} showRollback={nixChangedContent} onRollback={handleNixRollback} />
            <Button
              label="Generate Questions"
              onClick={handleGenerateQuestions}
            />
          </div>
        </div>
      );
    } else if (currentStep === AddCardWizardStep.Complete) {
      footer = (
        <div className={styles.stepActions}>
          <Button label="Generate New Card" onClick={handleGenerateNewCard} />
          <Button label="Done" onClick={handleDone} />
        </div>
      );
    }
  }

  return (
    <MainContainer footer={footer}>
      <div className={styles.addCardWizard}>
        <WizardTabs currentStep={currentStep} onTabClick={handleTabClick} />

        <div className={styles.wizardContent}>
          {currentStep === AddCardWizardStep.Generate && (
            <StepGenerate
              formState={formState}
              formErrors={formErrors}
              images={images}
              isGenerating={isGeneratingCard}
              error={cardError}
              questionTypes={questionTypes}
              onFieldChange={handleFieldChange}
              onImagesChange={handleImagesChange}
              onQuestionTypesChange={setQuestionTypes}
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

      {card && (
        <AiChatModal
          isOpen={aiChatModal.isOpen}
          onClose={aiChatModal.close}
          cardTopic={card.topic}
          cardContent={card.markdownContent}
          onContentChange={(topic, content) => {
            handleCardChange("topic", topic);
            handleCardChange("markdownContent", content);
            setNixChangedContent(content !== prevMarkdownContent);
          }}
        />
      )}
    </MainContainer>
  );
}
