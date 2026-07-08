import MainContainer from "../../shared/components/MainContainer";
import MarkdownRender from "../../shared/components/MarkdownRender";
import { Button } from "../../shared/components/controls/Button";
import { useLearnTopic } from "./hooks/useLearnTopic";
import TagSelect from "./components/TagSelect";
import "./learnTopic.css";

export default function LearnTopic() {
  const {
    tags,
    pendingCounts,
    learnedLast24h,
    selectedTagId,
    selectTag,
    goBackToTags,
    currentCard,
    startLearning,
    markAsKnown,
    isLoading,
  } = useLearnTopic();

  // Stage 1: Tag selection
  if (!selectedTagId) {
    return (
      <MainContainer>
        <TagSelect tags={tags} pendingCounts={pendingCounts} onSelect={selectTag} />
      </MainContainer>
    );
  }

  // Stage 2: Card-by-card learning
  if (isLoading) return null;

  if (!currentCard) {
    // Queue became empty (edge case — should snap back via hook)
    return (
      <MainContainer>
        <TagSelect tags={tags} pendingCounts={pendingCounts} onSelect={selectTag} />
      </MainContainer>
    );
  }

  return (
    <MainContainer
      header={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Button label="←" onClick={goBackToTags} />
          <span className="learn-card-progress">
            {learnedLast24h} learned today
          </span>
        </div>
      }
      footer={
        <div className="learn-footer">
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
