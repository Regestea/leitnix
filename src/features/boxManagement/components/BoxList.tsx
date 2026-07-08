import {
  faPenToSquare,
  faTrashCan,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Box } from "../../../shared/types/entities";
import { formatRepeatPeriod } from "../types";

interface BoxListProps {
  boxes: Box[];
  cardCounts: Map<string, number>;
  onEdit: (box: Box) => void;
  onDelete: (id: string) => void;
}

export default function BoxList({
  boxes,
  cardCounts,
  onEdit,
  onDelete,
}: BoxListProps) {
  if (boxes.length === 0) {
    return <p className="no-boxes-text">No boxes created yet.</p>;
  }

  return (
    <div className="box-list">
      {boxes.map((box, index) => {
        const isFinishBox = box.RepeatIntervalSeconds === 0;
        const cardCount = cardCounts.get(box.Id) ?? 0;

        return (
          <div key={box.Id}>
            <div className={`box-item ${isFinishBox ? "box-item-finish" : ""}`}>
              <div className="box-item-info">
                <span className="box-card-count">{cardCount}</span>
                <div>
                  <h4>{box.Name ?? "Unnamed Box"}</h4>
                  <span className="box-period">
                    {formatRepeatPeriod(box.RepeatIntervalSeconds ?? 0)}
                  </span>
                </div>
              </div>
              <div className="box-control-menu">
                {!isFinishBox && (
                  <span
                    className="box-control-menu"
                    onClick={() => onEdit(box)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </span>
                )}
                {!isFinishBox && (
                  <span
                    className="box-control-menu"
                    onClick={() => onDelete(box.Id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </span>
                )}
              </div>
            </div>
            {index < boxes.length - 1 && (
              <div className="chain-arrow">
                <FontAwesomeIcon icon={faArrowDown} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
