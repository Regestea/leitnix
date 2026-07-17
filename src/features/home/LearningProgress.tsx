import { useEffect, useState } from "react";
import type { TagProgressDto } from "../../dtos/tagProgressDto";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import styles from "./LearningProgress.module.css";

export default function LearningProgress() {
  const [tags, setTags] = useState<TagProgressDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    categoryTagRepository.getTagsProgressWithCardCount().then((data) => {
      if (!cancelled) setTags(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`card glass ${styles.progressCard}`}>
      <div className={styles.progressInner}>
        <div className={styles.cardTitle}>Learning Progress</div>
        {tags.map((tag) => {
          const pct =
            tag.TotalCount > 0
              ? Math.round((tag.CurrentProgress / tag.TotalCount) * 100)
              : 0;
          return (
            <div key={tag.Id}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>{tag.Name}</span>
                <span className={styles.progressNumber}>
                  {tag.CurrentProgress}
                  <small>/{tag.TotalCount}</small>
                </span>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
