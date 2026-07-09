import { useEffect, useState } from "react";
import { cardRepository } from "../../../repositories/CardRepository";
import type { ICardRepository } from "../../../iRepositories/ICardRepository";

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function useLearnBadge(): number {
  const cardRepo: ICardRepository = cardRepository;
  const [count, setCount] = useState(0);

  useEffect(() => {
    cardRepo.countStartedLearningLast24h(nowUnix()).then(setCount);
  }, [cardRepo]);

  return count;
}
