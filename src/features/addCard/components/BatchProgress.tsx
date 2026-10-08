import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import { Button } from "../../../shared/components/controls/Button";
import styles from "../AddCard.module.css";

interface BatchProgressProps {
  currentTopic: string;
  completed: number;
  total: number;
  isPaused: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function BatchProgress({
  currentTopic,
  completed,
  total,
  isPaused,
  error,
  onRetry,
}: BatchProgressProps) {
  return (
    <div className={styles.stepLoading}>
      <ThinkingSphere />
      <p className={styles.loadingText}>
        {isPaused ? "Processing paused" : "Processing topics..."}
      </p>
      <div className={styles.batchStatus}>
        <p className={styles.batchTopic}>{currentTopic}</p>
        <p className={styles.batchCounter}>
          {completed} of {total} topics completed
        </p>
        {isPaused && error && <p className="field-error">{error}</p>}
        {isPaused && (
          <Button
            label="Retry"
            onClick={onRetry}
            style={{ width: "100%", maxWidth: "16rem" }}
          />
        )}
      </div>
    </div>
  );
}
