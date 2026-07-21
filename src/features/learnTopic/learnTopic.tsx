import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import MainContainer from "../../shared/components/MainContainer";
import Topic from "../../shared/components/Topic";
import { Button } from "../../shared/components/controls/Button";
import TagSelect from "./components/TagSelect";
import AiChatModal from "../../shared/components/AiChatModal";
import useModal from "../../shared/hooks/useModal";
import styles from "./learnTopic.module.css";
import type { ICategoryTagRepository } from "../../iRepositories/ICategoryTagRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import type { NewTopicTagsDto } from "../../dtos/newTopicTagsDto.ts";
import type { Card } from "../../db/entities";
import type { ICardRepository } from "../../iRepositories/ICardRepository";
import { cardRepository } from "../../repositories/CardRepository";
import MarkdownRender from "../../shared/components/MarkdownRender.tsx";

export default function LearnTopic() {
  const [showTopic, setShowTopic] = useState(true);
  const [tags, setTags] = useState<NewTopicTagsDto[]>([]);
  const [card, setCard] = useState<Card | null>();
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
          <Button onClick={aiChatModal.open}>Ask AI</Button>

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
        onContentChange={(topic, content) =>
          setCard((prev) => prev ? { ...prev, Topic: topic, MarkdownContent: content } : prev)
        }
      />
    </MainContainer>
  );
}
