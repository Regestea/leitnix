import styles from "../AddCard.module.css";

export default function StepComplete() {
  return (
    <div className={styles.stepComplete}>
      <div className={styles.completeIcon}>✓</div>
      <h2>Card Created!</h2>
      <p className={styles.completeMessage}>
        Your flashcard with study content and questions has been saved successfully.
      </p>
    </div>
  );
}
