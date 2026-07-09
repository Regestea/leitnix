import { useEffect, useState } from "react";
import { reviewService } from "../../../services/ReviewService";
import type { IReviewService } from "../../../services/IReviewService";
import { cardRepository } from "../../../repositories/CardRepository";
import type { ICardRepository } from "../../../iRepositories/ICardRepository.ts";
import { categoryTagRepository } from "../../../repositories/CategoryTagRepository";
import type { ICategoryTagRepository } from "../../../iRepositories/ICategoryTagRepository.ts";
import type { Card, CategoryTag } from "../../../shared/types/entities";

export function useLearnTopic() {
  const reviewServiceInstance: IReviewService = reviewService;
  const cardRepo: ICardRepository = cardRepository;
  const tagRepo: ICategoryTagRepository = categoryTagRepository;

  const [tags, setTags] = useState<CategoryTag[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Map<string, number>>(new Map());
  const [learnedLast24h, setLearnedLast24h] = useState(0);

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load tags and pending counts on mount
  useEffect(() => {
    Promise.all([
      tagRepo.getAll(),
      cardRepo.getTagPendingCounts(),
      cardRepo.countStartedLearningLast24h(Math.floor(Date.now() / 1000)),
    ]).then(([allTags, counts, learned]) => {
      setTags(allTags);
      setPendingCounts(counts);
      setLearnedLast24h(learned);
    });
  }, [tagRepo, cardRepo]);

  // Load pending cards when a tag is selected
  useEffect(() => {
    if (!selectedTagId) {
      setQueue([]);
      setCurrentIndex(0);
      return;
    }
    setIsLoading(true);
    cardRepo.getPendingByTag(selectedTagId).then((cards) => {
      setQueue(cards);
      setCurrentIndex(0);
      setIsLoading(false);
    });
  }, [selectedTagId, cardRepo]);

  const selectTag = (tagId: string) => {
    setSelectedTagId(tagId);
  };

  const goBackToTags = () => {
    setSelectedTagId(null);
  };

  const startLearning = async () => {
    const card = queue[currentIndex];
    if (!card) return;
    await reviewServiceInstance.startLearning(card.Id);
    refreshAfterAction();
  };

  const markAsKnown = async () => {
    const card = queue[currentIndex];
    if (!card) return;
    await reviewServiceInstance.markAsKnown(card.Id);
    refreshAfterAction();
  };

  /** Refresh queue and counts after an action, then advance or go back. */
  function refreshAfterAction() {
    Promise.all([
      cardRepo.getPendingByTag(selectedTagId!),
      cardRepo.getTagPendingCounts(),
      cardRepo.countStartedLearningLast24h(Math.floor(Date.now() / 1000)),
    ]).then(([cards, counts, learned]) => {
      setPendingCounts(counts);
      setLearnedLast24h(learned);
      if (cards.length === 0) {
        // Queue empty — return to tag selection
        setSelectedTagId(null);
      } else {
        setQueue(cards);
        // If we removed the last card, wrap to 0
        setCurrentIndex((prev) =>
          prev >= cards.length ? 0 : prev,
        );
      }
    });
  }

  const currentCard = queue[currentIndex] ?? null;
  const totalPending = selectedTagId ? queue.length : 0;

  return {
    tags,
    pendingCounts,
    learnedLast24h,
    selectedTagId,
    selectTag,
    goBackToTags,
    currentCard,
    totalPending,
    currentIndex,
    startLearning,
    markAsKnown,
    isLoading,
  };
}
