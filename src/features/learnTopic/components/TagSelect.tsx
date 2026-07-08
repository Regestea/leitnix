import type { CategoryTag } from "../../../shared/types/entities";

interface TagSelectProps {
  tags: CategoryTag[];
  pendingCounts: Map<string, number>;
  onSelect: (tagId: string) => void;
}

export default function TagSelect({ tags, pendingCounts, onSelect }: TagSelectProps) {
  const tagsWithPending = tags.filter((t) => (pendingCounts.get(t.Id) ?? 0) > 0);

  if (tagsWithPending.length === 0) {
    return (
      <div className="tag-select-empty">
        <p>No pending topics to learn.</p>
        <p className="tag-select-hint">Add new cards first, then come back to learn them.</p>
      </div>
    );
  }

  return (
    <div className="tag-select">
      <p className="tag-select-title">Choose a category to study</p>
      <div className="tag-select-list">
        {tagsWithPending.map((tag) => (
          <button
            key={tag.Id}
            className="card glass tag-select-item"
            type="button"
            onClick={() => onSelect(tag.Id)}
          >
            <span className="tag-select-name">{tag.Name ?? "Untitled"}</span>
            <span className="tag-select-count">{pendingCounts.get(tag.Id) ?? 0} remaining</span>
          </button>
        ))}
      </div>
    </div>
  );
}
