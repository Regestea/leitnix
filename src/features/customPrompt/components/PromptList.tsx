import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CustomPrompt } from "../../../db/entities";
import styles from "../Prompt.module.css";

interface PromptListProps {
  prompts: CustomPrompt[];
  onEdit: (prompt: CustomPrompt) => void;
  onDelete: (id: string) => void;
}

export default function PromptList({
  prompts,
  onEdit,
  onDelete,
}: PromptListProps) {
  if (prompts.length === 0) {
    return  <div className={styles.customPromptForm}><p className={styles.noPromptsText}>No custom prompts added yet.</p></div>;
  }

  return (
    <div className={styles.customPromptForm}>
      {prompts.map((prompt) => (
        <div className={styles.promptItem} key={prompt.Id}>
          <h4>{prompt.Name ?? "Untitled Prompt"}</h4>
          <div className={styles.promptControlMenu}>
            <span
              className={styles.promptControlMenu}
              onClick={() => onEdit(prompt)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className={styles.promptControlMenu}
              onClick={() => onDelete(prompt.Id)}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
