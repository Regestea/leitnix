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
import BatchProgress from "./components/BatchProgress";
import { cardService } from "./services/CardService";
import type { ICardService } from "./services/ICardService";
import {
  AddCardWizardStep,
  EMPTY_FORM_STATE,
  validateAddCardForm,
  QUESTION_TYPES,
  parseTopics,
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

  // ── Multiple-topic batch state ─────────────────────────────────────
  // `batch.index` is the topic currently being processed; `completed`
  // counts topics already generated AND saved. Each topic is persisted
  // immediately, so a failure only pauses the remaining topics.
  const [batch, setBatch] = useState<{
    topics: string[];
    index: number;
    completed: number;
  } | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

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

  // ── Multiple-topic batch runner ─────────────────────────────────────
  const runBatchFrom = useCallback(
    async (topics: string[], startIndex: number) => {
      const service: ICardService = cardService;
      const { topicType, categoryTagId, aiModelId, customPromptId } = formState;

      setIsBatchRunning(true);
      setIsGeneratingCard(true);
      setBatchError(null);
      setBatch({ topics, index: startIndex, completed: startIndex });

      try {
        for (let i = startIndex; i < topics.length; i++) {
          setBatch({ topics, index: i, completed: i });

          const batchCard = await service.generateCard({
            topicType,
            aiModelId,
            customPromptId,
            topicText: topics[i],
          });

          const questions = await service.generateQuestions(
            aiModelId,
            batchCard,
            questionTypes,
            topicType,
          );

          // Persist immediately — finished topics must survive a later failure.
          await service.saveCard({
            aiModelId,
            categoryTagId,
            card: batchCard,
            questions,
            topicType,
          });

          setBatch((prev) =>
            prev && prev.topics === topics
              ? { ...prev, index: i + 1, completed: i + 1 }
              : prev,
          );
        }

        setBatch(null);
        setIsBatchRunning(false);
        setIsGeneratingCard(false);
        setCurrentStep(AddCardWizardStep.Complete);
      } catch (err) {
        // Pause the batch — `batch` keeps pointing at the failed topic so
        // Retry resumes from there.
        setIsBatchRunning(false);
        setIsGeneratingCard(false);
        setBatchError(
          err instanceof Error ? err.message : "Failed to process topic",
        );
      }
    },
    [formState, questionTypes],
  );

  const handleBatchRetry = useCallback(() => {
    if (!batch) return;
    void runBatchFrom(batch.topics, batch.index);
  }, [batch, runBatchFrom]);

  const handleGenerate = useCallback(async () => {
    const { success, errors } = validateAddCardForm(formState);
    if (!success) {
      setFormErrors(errors);
      return;
    }

    if (formState.topicMode === "multiple") {
      const topics = parseTopics(formState.topicText);
      if (topics.length === 0) {
        setFormErrors({
          topicText: "Please enter at least one topic (one per line).",
        });
        return;
      }
      void runBatchFrom(topics, 0);
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
  }, [formState, images, runBatchFrom]);

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
        formStateSaved.topicType,
      );

      await service.saveCard({
        aiModelId: formStateSaved.aiModelId,
        categoryTagId: formStateSaved.categoryTagId,
        card,
        questions,
        topicType: formStateSaved.topicType,
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
    setBatch(null);
    setIsBatchRunning(false);
    setBatchError(null);
    setCurrentStep(AddCardWizardStep.Generate);
  }, []);

  const handleDone = useCallback(() => navigate("/"), [navigate]);

  // Batch view (running or paused) replaces everything else, including the footer.
  const isThinking = isGeneratingCard || isGeneratingQuestions || batch !== null;

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
              gridTemplateColumns: nixChangedContent ? "1fr 1fr 1fr" : "1fr 1fr",
              gap: "0.5rem",
              width: "100%",
            }}
          >
            <NixButton
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(255, 255, 255, 0.55)",
                borderRadius: "0.8rem",
                background: "rgba(255, 255, 255, 0.1)",
              }}
              rollbackStyle={{
                width: "100%",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(255, 255, 255, 0.55)",
                borderRadius: "0.8rem",
                background: "rgba(255, 255, 255, 0.1)",
              }}
              onClick={aiChatModal.open}
              showRollback={nixChangedContent}
              onRollback={handleNixRollback}
            />
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
          {currentStep === AddCardWizardStep.Generate &&
            (batch ? (
              <BatchProgress
                currentTopic={batch.topics[batch.index]}
                completed={batch.completed}
                total={batch.topics.length}
                isPaused={!isBatchRunning}
                error={batchError}
                onRetry={handleBatchRetry}
              />
            ) : (
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
            ))}

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
