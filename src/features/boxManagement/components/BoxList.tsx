import {
  faPenToSquare,
  faTrashCan,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Box } from "../../../db/entities";
import { formatRepeatPeriod } from "../types";
import styles from "../BoxManagement.module.css";

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
    return <p className={styles.noBoxesText}>No boxes created yet.</p>;
  }

  return (
    <div className={styles.boxList}>
      {boxes.map((box, index) => {
        const isFinishBox = box.RepeatIntervalSeconds === 0;
        const cardCount = cardCounts.get(box.Id) ?? 0;

        return (
          <div key={box.Id}>
            <div className={`${styles.boxItem} ${isFinishBox ? styles.boxItemFinish : ""}`}>
              <div className={styles.boxItemInfo}>
                <span className={styles.boxCardCount}>{cardCount}</span>
                <div>
                  <h4>{box.Name ?? "Unnamed Box"}</h4>
                  <span className={styles.boxPeriod}>
                    {formatRepeatPeriod(box.RepeatIntervalSeconds ?? 0)}
                  </span>
                </div>
              </div>
              <div className={styles.boxControlMenu}>
                {!isFinishBox && (
                  <span
                    className={styles.boxControlMenu}
                    onClick={() => onEdit(box)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </span>
                )}
                {!isFinishBox && (
                  <span
                    className={styles.boxControlMenu}
                    onClick={() => onDelete(box.Id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </span>
                )}
              </div>
            </div>
            {index < boxes.length - 1 && (
              <div className={styles.chainArrow}>
                <FontAwesomeIcon icon={faArrowDown} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
