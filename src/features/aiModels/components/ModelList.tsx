import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AiModel } from "../../../shared/types/entities";
import styles from "../AiModels.module.css";

interface ModelListProps {
  models: AiModel[];
  onEdit: (model: AiModel) => void;
  onDelete: (id: string) => void;
}

export default function ModelList({ models, onEdit, onDelete }: ModelListProps) {
  if (models.length === 0) {
    return <div className={styles.aiModelForm}><p className={styles.noModelsText}>No AI models added yet.</p></div>;
  }

  return (
    <div className={styles.aiModelForm}>
      {models.map((model) => (
        <div className={styles.modelItem} key={model.Id}>
          <h4>
            {model.DisplayName ?? model.ModelName ?? "Untitled Model"}
          </h4>
          <div className={styles.modelControlMenu}>
            <span
              className={styles.modelControlMenu}
              onClick={() => onEdit(model)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className={styles.modelControlMenu}
              onClick={() => onDelete(model.Id)}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
