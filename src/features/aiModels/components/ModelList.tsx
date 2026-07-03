import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AiModel } from "../../../shared/types/entities";

interface ModelListProps {
  models: AiModel[];
  onEdit: (model: AiModel) => void;
  onDelete: (id: string) => void;
}

export default function ModelList({ models, onEdit, onDelete }: ModelListProps) {
  if (models.length === 0) {
    return <p className="no-models-text">No AI models added yet.</p>;
  }

  return (
    <div className="ai-model-form">
      {models.map((model) => (
        <div className="model-item" key={model.Id}>
          <h4>
            {model.DisplayName ?? model.ModelName ?? "Untitled Model"}
          </h4>
          <div className="model-control-menu">
            <span
              className="model-control-menu"
              onClick={() => onEdit(model)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className="model-control-menu"
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
