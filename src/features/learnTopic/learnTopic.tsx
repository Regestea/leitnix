import { useEffect, useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import MarkdownRender from "../../shared/components/MarkdownRender";
import { Button } from "../../shared/components/controls/Button";
import TagSelect from "./components/TagSelect";
import styles from "./learnTopic.module.css";
import type { ICategoryTagRepository } from "../../iRepositories/ICategoryTagRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import type { CategoryTag } from "../../db/entities";

export default function LearnTopic() {
  const [showTopic, setShowTopic] = useState(true);
  const [tags, setTags] = useState<CategoryTag[]>([]);
  const tagRepo: ICategoryTagRepository = categoryTagRepository;

  useEffect(() => {
    const load = async () => {
      const reviewTags = await tagRepo.getReviewTags();
      setTags(reviewTags);
    };
    void load();
  }, [tagRepo]);

  
  // const {
  //   tags,
  //   pendingCounts,
  //   learnedLast24h,
  //   selectedTagId,
  //   selectTag,
  //   goBackToTags,
  //   currentCard,
  //   startLearning,
  //   markAsKnown,
  //   isLoading,
  // } = useLearnTopic();

  if (showTopic) {
    return (
      <MainContainer>
        <TagSelect
          tags={tags}
          pendingCounts={pendingCounts}
          onSelect={selectTag}
        />
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
          <Button label="I Know" onClick={markAsKnown} />

          <Button label="Learn" onClick={startLearning} />
        </div>
      }
    >
      <MarkdownRender markdown={currentCard.MarkdownTopic ?? ""} />
      <MarkdownRender markdown={currentCard.MarkdownContent ?? ""} />
    </MainContainer>
  );
}
