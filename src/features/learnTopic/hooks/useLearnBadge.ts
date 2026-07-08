import { useEffect, useMemo, useState } from "react";
import { CardRepository } from "../../addCard/repository/CardRepository";

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function useLearnBadge(): number {
  const cardRepo = useMemo(() => new CardRepository(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    cardRepo.countStartedLearningLast24h(nowUnix()).then(setCount);
  }, [cardRepo]);

  return count;
}
