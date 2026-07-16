import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import MainContainer from "../../shared/components/MainContainer";
import MarkdownRender from "../../shared/components/MarkdownRender";
import { Button } from "../../shared/components/controls/Button";
import AiChatModal from "../../shared/components/AiChatModal";
import useModal from "../../shared/hooks/useModal";
import FreeResponseQuestionCard from "./components/FreeResponseQuestionCard";
import FillTheBlankQuestionCard from "./components/FillTheBlankQuestionCard";
import MultipleChoiceQuestionCard from "./components/MultipleChoiceQuestionCard";
import type { ReviewTagsDto } from "../../dtos/reviewTagsDto";
import type {
  Card,
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceOption,
  MultipleChoiceQuestion,
} from "../../db/entities";
import type {
  Question,
  QuestionType,
} from "../../iRepositories/IQuestionRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import { cardRepository } from "../../repositories/CardRepository";
import { questionRepository } from "../../repositories/QuestionRepository";

import styles from "./Review.module.css";

type Phase =
  | "tag-select"
  | "question"
  | "answer-shown"
  | "answered"
  | "show-card";

export default function Review() {
  const [tags, setTags] = useState<ReviewTagsDto[]>([]);
  const [phase, setPhase] = useState<Phase>("tag-select");
  const [tagId, setTagId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<MultipleChoiceOption | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const aiChatModal = useModal();

  useEffect(() => {
    const load = async () => {
      const reviewTags = await categoryTagRepository.getReviewTags();
      setTags(reviewTags);
    };
    void load();
  }, []);

  const loadQuestion = useCallback(async (selectedTagId: string) => {
    const cardResult = await cardRepository.getCardNeedToReview(selectedTagId);
    if (!cardResult) {
      setCard(null);
      setPhase("tag-select");
      return;
    }
    setCard(cardResult);

    const questionResult = await questionRepository.getRandomQuestion(
      cardResult.Id,
    );
    const q = questionResult as Question & { Type: string };
    setQuestion(questionResult);
    setQuestionType(
      (q.Type === "FreeResponse"
        ? "FreeResponseQuestions"
        : q.Type === "FillTheBlank"
          ? "FillTheBlankQuestions"
          : "MultipleChoiceQuestions") as QuestionType,
    );
    setQuestionId(q.Id);
    setShowAnswer(false);
    setSelectedOption(null);
    setPhase("question");
  }, []);

  const handleTagSelect = async (selectedTagId: string) => {
    setTagId(selectedTagId);
    await loadQuestion(selectedTagId);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setPhase("answer-shown");
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!questionType || !questionId) return;

    await questionRepository.markQuestionAsReviewed(
      questionType,
      questionId,
      isCorrect,
    );

    setPhase("answered");
  };

  const handleNextQuestion = async () => {
    if (tagId) {
      await loadQuestion(tagId);
    }
  };

  const handleShowCard = () => {
    setPhase("show-card");
  };

  const questionTypeLabel =
    questionType === "FreeResponseQuestions"
      ? "Free Response"
      : questionType === "FillTheBlankQuestions"
        ? "Fill the Blank"
        : "Multiple Choice";

  const footer = () => {
    if (phase === "question") {
      return <Button style={{width:'100%'}} label="Show Answer" onClick={handleShowAnswer} />;
    }

    if (phase === "answer-shown") {
      return (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button style={{ width: "50%" }} label="Correct" onClick={() => handleAnswer(true)} />
          <Button style={{ width: "50%" }} label="Wrong" onClick={() => handleAnswer(false)} />
        </div>
      );
    }

    if (phase === "answered") {
      return (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button style={{ width: "50%" }} label="Show Card" onClick={handleShowCard} />
          <Button style={{ width: "50%" }} label="Next Question" onClick={handleNextQuestion} />
        </div>
      );
    }

    return null;
  };

  const isMc = question && "CorrectOption" in question;

  if (phase === "tag-select") {
    const tagsWithPending = tags.filter((t) => t.count > 0);

    if (tagsWithPending.length === 0) {
      return (
        <MainContainer>
          <div className={styles.tagSelectEmpty}>
            <p>No cards to review.</p>
            <p className={styles.tagSelectHint}>
              Learn new topics first, then come back to review them.
            </p>
          </div>
        </MainContainer>
      );
    }

    return (
      <MainContainer>
        <div className={styles.tagSelect}>
          <p className={styles.tagSelectTitle}>
            Choose a category to review
          </p>
          <div className={styles.tagSelectList}>
            {tagsWithPending.map((tag) => (
              <button
                key={tag.Id}
                className={`card glass ${styles.tagSelectItem}`}
                type="button"
                onClick={() => handleTagSelect(tag.Id)}
              >
                <span className={styles.tagSelectName}>
                  {tag.Name ?? "Untitled"}
                </span>
                <span className={styles.tagSelectCount}>
                  {tag.count} remaining
                </span>
              </button>
            ))}
          </div>
        </div>
      </MainContainer>
    );
  }

  if (phase === "show-card" && card) {
    return (
      <MainContainer
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button onClick={() => setPhase("answered")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.5rem" }}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <Button onClick={aiChatModal.open}>Ask AI</Button>
          </div>
        }
        footer={footer()}
      >
        <MarkdownRender markdown={card.MarkdownTopic ?? ""} />
        <MarkdownRender markdown={card.MarkdownContent ?? ""} />

        <AiChatModal
          isOpen={aiChatModal.isOpen}
          onClose={aiChatModal.close}
          cardTopic={card.MarkdownTopic ?? ""}
          cardContent={card.MarkdownContent ?? ""}
        />
      </MainContainer>
    );
  }

  if (!question) {
    return (
      <MainContainer
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button onClick={() => setPhase("tag-select")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.5rem" }}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>
        }
      >
        <p>Loading question...</p>
      </MainContainer>
    );
  }

  return (
    <MainContainer
      header={
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <button onClick={() => setPhase("tag-select")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.5rem" }}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <span>{questionTypeLabel}</span>
        </div>
      }
      footer={footer()}
    >
      {questionType === "FreeResponseQuestions" && (
        <FreeResponseQuestionCard
          markdownQuestion={question.MarkdownQuestion ?? ""}
          markdownAnswer={(question as FreeResponseQuestion).MarkdownAnswer ?? ""}
          showAnswer={showAnswer}
        />
      )}

      {questionType === "FillTheBlankQuestions" && (
        <FillTheBlankQuestionCard
          markdownQuestion={question.MarkdownQuestion ?? ""}
          markdownAnswer={(question as FillTheBlankQuestion).MarkdownAnswer ?? ""}
          showAnswer={showAnswer}
        />
      )}

      {questionType === "MultipleChoiceQuestions" && isMc && (
        <MultipleChoiceQuestionCard
          markdownQuestion={question.MarkdownQuestion ?? ""}
          markdownOptionA={
            (question as MultipleChoiceQuestion).MarkdownOptionA ?? ""
          }
          markdownOptionB={
            (question as MultipleChoiceQuestion).MarkdownOptionB ?? ""
          }
          markdownOptionC={
            (question as MultipleChoiceQuestion).MarkdownOptionC ?? ""
          }
          markdownOptionD={
            (question as MultipleChoiceQuestion).MarkdownOptionD ?? ""
          }
          correctOption={
            (question as MultipleChoiceQuestion).CorrectOption ?? "A"
          }
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
        />
      )}
    </MainContainer>
  );
}
