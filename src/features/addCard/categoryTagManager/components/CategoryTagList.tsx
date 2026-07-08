import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CategoryTag } from "../../../../shared/types/entities";

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
      <div className="custom-taglist">
        <p className="no-tags-text">No category tags added yet.</p>
      </div>
    );
  }

  return (
    <div className="custom-taglist">
      {tags.map((tag) => (
        <div className="tag-item" key={tag.Id}>
          <h4>{tag.Name ?? "Untitled Tag"}</h4>
          <div className="tag-control-menu">
            <span
              className="tag-control-menu"
              onClick={() => onEdit(tag)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </span>
            <span
              className="tag-control-menu"
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
