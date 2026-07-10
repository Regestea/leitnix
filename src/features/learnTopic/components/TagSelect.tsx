import type { CategoryTag } from "../../../db/entities";
import styles from "../learnTopic.module.css";

interface TagSelectProps {
  tags: CategoryTag[];
  pendingCounts: Map<string, number>;
  onSelect: (tagId: string) => void;
}

export default function TagSelect({ tags, pendingCounts, onSelect }: TagSelectProps) {
  const tagsWithPending = tags.filter((t) => (pendingCounts.get(t.Id) ?? 0) > 0);

  if (tagsWithPending.length === 0) {
    return (
      <div className={styles.tagSelectEmpty}>
        <p>No pending topics to learn.</p>
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
            key={tag.Id}
            className={`card glass ${styles.tagSelectItem}`}
            type="button"
            onClick={() => onSelect(tag.Id)}
          >
            <span className={styles.tagSelectName}>{tag.Name ?? "Untitled"}</span>
            <span className={styles.tagSelectCount}>{pendingCounts.get(tag.Id) ?? 0} remaining</span>
          </button>
        ))}
      </div>
    </div>
  );
}
