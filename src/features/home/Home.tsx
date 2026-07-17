import ProgressCircle from "./ProgressCircle";
import LearningProgress from "./LearningProgress";
import { useHome } from "./hooks/useHome";
import styles from "./Home.module.css";

export default function Home() {
  const { learnedToday, pendingReview } = useHome();

  return (
    <>
      <div className={styles.titleSection}>
        <h1 className={styles.styledTitle}>Leitnix</h1>
      </div>
      <div className={styles.contentStack}>
        <div className={styles.cardsLayout}>
          <div className={styles.cardsRow}>
            <div className={styles.cardColumn}>
              <div className={`card glass ${styles.learnCard}`}>
                <div className={styles.cardInner}>
                  <ProgressCircle current={learnedToday} />
                </div>
              </div>
              <div className={`card glass ${styles.cardCaption}`}>
                <p className={styles.cardCaptionText}>Today Learned</p>
              </div>
            </div>

            <div className={styles.cardColumn}>
              <div className={`card glass ${styles.learnCard}`}>
                <div className={styles.cardInner}>
                  <ProgressCircle current={pendingReview} />
                </div>
              </div>
              <div className={`card glass ${styles.cardCaption}`}>
                <p className={styles.cardCaptionText}>Pending Review</p>
              </div>
            </div>
          </div>

          <LearningProgress />
        </div>
      </div>
    </>
  );
}
