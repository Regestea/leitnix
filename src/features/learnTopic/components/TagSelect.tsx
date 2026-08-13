import type { ReviewTagsDto } from "../../../dtos/ReviewTagsDto";
import styles from "../LearnTopic.module.css";

interface TagSelectProps {
  tags: ReviewTagsDto[];
  onSelect: (tagId: string) => void;
}

export default function TagSelect({ tags, onSelect }: TagSelectProps) {
  const tagsWithPending = tags.filter((t) => t.count > 0);

  if (tagsWithPending.length === 0) {
    return (
      <div className={styles.tagSelectEmpty}>
        <p>No topics to learn.</p>
        <p className={styles.tagSelectHint}>Add new cards first, then come back to learn them.</p>
      </div>
    );
  }

  return (
    <div className={styles.tagSelect}>
      <p className={styles.tagSelectTitle}>Choose a category to study</p>
      <div className={styles.tagSelectList}>
        {tagsWithPending.map((tag) => (
          <button
            key={tag.id}
            className={`card glass ${styles.tagSelectItem}`}
            type="button"
            onClick={() => onSelect(tag.id)}
          >
            <span className={styles.tagSelectName}>{tag.name ?? "Untitled"}</span>
            <span className={styles.tagSelectCount}>{tag.count} remaining</span>
          </button>
        ))}
      </div>
    </div>
  );
}
