import { useEffect, useState } from "react";
import { cardRepository } from "../../../repositories/CardRepository";
import type { ICardRepository } from "../../../iRepositories/ICardRepository";

export function useHome() {
  const repository: ICardRepository = cardRepository;
  const [learnedToday, setLearnedToday] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      repository.countStartedLearningLast24h(),
      repository.overallReviewToday(),
    ]).then(([learned, pending]) => {
      if (!cancelled) {
        setLearnedToday(learned);
        setPendingReview(pending);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  return { learnedToday, pendingReview };
}
