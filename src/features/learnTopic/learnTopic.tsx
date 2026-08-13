import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import MainContainer from "../../shared/components/mainContainer/MainContainer";
import Topic from "../../shared/components/topic/Topic";
import { Button } from "../../shared/components/controls/Button";
import { NixButton } from "../../shared/components/controls/NixButton";
import TagSelect from "./components/TagSelect";
import AiChatModal from "../aiChat/AiChatModal";
import useModal from "../../shared/hooks/useModal";
import styles from "./LearnTopic.module.css";
import type { ICategoryTagRepository } from "../../repositories/CategoryTagRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import type { NewTopicTagsDto } from "../../dtos/NewTopicTagsDto.ts";
import type { Card } from "../../db/entities";
import type { ICardRepository } from "../../repositories/CardRepository";
import { cardRepository } from "../../repositories/CardRepository";
import MarkdownRender from "../../shared/components/markdownRender/MarkdownRender.tsx";

export default function LearnTopic() {
  const [showTopic, setShowTopic] = useState(true);
  const [tags, setTags] = useState<NewTopicTagsDto[]>([]);
  const [card, setCard] = useState<Card | null>();
  const [prevMarkdownContent, setPrevMarkdownContent] = useState("");
  const [nixChangedContent, setNixChangedContent] = useState(false);
  const [learnedLast24h, setlearnedLast24h] = useState<number>(0);
  const [tagId, setTagId] = useState<string | null>(null);
  const tagRepo: ICategoryTagRepository = categoryTagRepository;
  const cardRepo: ICardRepository = cardRepository;
  const aiChatModal = useModal();

  useEffect(() => {
    const load = async () => {
      const newTopicTags = await tagRepo.getNewTopicTags();
      setTags(newTopicTags);
    };
    void load();
  }, [tagRepo]);

  const showCards = async (selectedTagId: string) => {
    setShowTopic(false);
    setTagId(selectedTagId);
    const cardResult = await cardRepo.getCardNewTopic(selectedTagId);
    setCard(cardResult);
    if (cardResult) {
      setPrevMarkdownContent(cardResult.MarkdownContent);
      setNixChangedContent(false);
    }
    setlearnedLast24h(await cardRepo.countStartedLearningLast24h());
  };

  const loadNextCard = async () => {
    if (tagId != null) {
      const cardResult = await cardRepo.getCardNewTopic(tagId);
      setCard(cardResult);
      setlearnedLast24h(await cardRepo.countStartedLearningLast24h());
    }
  };

  const markAsKnown = async (cardId: string) => {
    await cardRepo.markAsKnown(cardId);
    await loadNextCard();
  };

  const startLearning = async (cardId: string) => {
    await cardRepo.startLearning(cardId);
    await loadNextCard();
  };

  const handleNixRollback = async () => {
    if (!card) return;
    setCard((prev) => prev ? { ...prev, MarkdownContent: prevMarkdownContent } : prev);
    await cardRepo.update({
      Id: card.Id,
      Topic: card.Topic,
      MarkdownContent: prevMarkdownContent,
    } as Card);
    setNixChangedContent(false);
  };

  if (showTopic) {
    return (
      <MainContainer>
        <TagSelect tags={tags} onSelect={showCards} />
      </MainContainer>
    );
  }

  if (card == null) {
    return (
      <MainContainer
        header={
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <button
              onClick={() => setShowTopic(true)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "0.5rem",
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>
        }
      >
        <h1>No cards to review for this category</h1>
      </MainContainer>
    );
  }

  return (
    <MainContainer
      header={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setShowTopic(true)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <NixButton onClick={aiChatModal.open} showRollback={nixChangedContent} onRollback={handleNixRollback} />

          <span className={styles.learnCardProgress}>
            {learnedLast24h} learned today
          </span>
        </div>
      }
      footer={
        <div className={styles.learnFooter}>
          <Button label="I Know" onClick={() => markAsKnown(card.Id)} />
          <Button label="Learn" onClick={() => startLearning(card.Id)} />
        </div>
      }
    >
      <Topic text={card.Topic ?? ""} />

      <MarkdownRender markdown={card.MarkdownContent ?? ""} />

      <AiChatModal
        isOpen={aiChatModal.isOpen}
        onClose={aiChatModal.close}
        cardId={card.Id}
        cardTopic={card.Topic ?? ""}
        cardContent={card.MarkdownContent ?? ""}
        onContentChange={(topic, content) => {
          setCard((prev) => prev ? { ...prev, Topic: topic, MarkdownContent: content } : prev);
          setNixChangedContent(content !== prevMarkdownContent);
        }}
      />
    </MainContainer>
  );
}
