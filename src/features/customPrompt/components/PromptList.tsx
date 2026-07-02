import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CustomPrompt } from "../../../db/schema";

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
    return <p className="no-prompts-text">No custom prompts added yet.</p>;
  }

  return (
    <div className="custom-prompt-form">
      {prompts.map((prompt) => (
        <div className="prompt-item" key={prompt.Id}>
          <h4>{prompt.Name ?? "Untitled Prompt"}</h4>
          <div className="prompt-control-menu">
            <span
              className="prompt-control-menu"
              onClick={() => onEdit(prompt)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className="prompt-control-menu"
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
