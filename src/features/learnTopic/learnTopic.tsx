import { useEffect, useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import MarkdownRender from "../../shared/components/MarkdownRender";
import { Button } from "../../shared/components/controls/Button";
import TagSelect from "./components/TagSelect";
import styles from "./learnTopic.module.css";
import type { ICategoryTagRepository } from "../../iRepositories/ICategoryTagRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import type { NewTopicTagsDto } from "../../dtos/newTopicTagsDto";
import type { Card } from "../../db/entities";
import type { ICardRepository } from "../../iRepositories/ICardRepository";
import { cardRepository } from "../../repositories/CardRepository";

export default function LearnTopic() {
  const [showTopic, setShowTopic] = useState(true);
  const [tags, setTags] = useState<NewTopicTagsDto[]>([]);
  const [card, setCard] = useState<Card | null>();
  const [learnedLast24h, setlearnedLast24h] = useState<number>(0);
  const [tagId, setTagId] = useState<string | null>(null);
  const tagRepo: ICategoryTagRepository = categoryTagRepository;
  const cardRepo: ICardRepository = cardRepository;

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Button label="←" onClick={() => setShowTopic(true)} />
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
          <Button label="←" onClick={() => setShowTopic(true)} />
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
      <MarkdownRender markdown={card.MarkdownTopic ?? ""} />
      <MarkdownRender markdown={card.MarkdownContent ?? ""} />
    </MainContainer>
  );
}
