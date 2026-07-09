import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CategoryTag } from "../../../../shared/types/entities";
import styles from "../../AddCard.module.css";

interface CategoryTagListProps {
  tags: CategoryTag[];
  onEdit: (tag: CategoryTag) => void;
  onDelete: (id: string) => void;
}

export default function CategoryTagList({
  tags,
  onEdit,
  onDelete,
}: CategoryTagListProps) {
  if (tags.length === 0) {
    return (
      <div className={styles.customTaglist}>
        <p className={styles.noTagsText}>No category tags added yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.customTaglist}>
      {tags.map((tag) => (
        <div className={styles.tagItem} key={tag.Id}>
          <h4>{tag.Name ?? "Untitled Tag"}</h4>
          <div className={styles.tagControlMenu}>
            <span
              className={styles.tagControlMenu}
              onClick={() => onEdit(tag)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className={styles.tagControlMenu}
              onClick={() => onDelete(tag.Id)}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
