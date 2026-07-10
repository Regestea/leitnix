import { useEffect, useState } from "react";
import type { CategoryTag } from "../../../../db/entities";
import { categoryTagRepository } from "../../../../repositories/CategoryTagRepository";
import { cardRepository } from "../../../../repositories/CardRepository";
import type { ICardRepository } from "../../../../iRepositories/ICardRepository";
import type { ICategoryTagRepository } from "../../../../iRepositories/ICategoryTagRepository";

export function useCategoryTags() {
  const tagRepo: ICategoryTagRepository = categoryTagRepository;
  const cardRepo: ICardRepository = cardRepository;
  const [tags, setTags] = useState<CategoryTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    tagRepo.getAll().then((data) => {
      if (!cancelled) setTags(data);
    });
    return () => {
      cancelled = true;
    };
  }, [tagRepo]);

  const refresh = async () => {
    const data = await tagRepo.getAll();
    setTags(data);
  };

  const addTag = async (tag: CategoryTag) => {
    await tagRepo.create(tag);
    await refresh();
  };

  const updateTag = async (tag: CategoryTag) => {
    await tagRepo.update(tag);
    await refresh();
  };

  const deleteTag = async (
    id: string,
    reassignTagId?: string
  ) => {
    // If cards need reassignment, update them first
    if (reassignTagId) {
      const cards = await cardRepo.getByCategoryTagId(id);
      if (cards.length > 0) {
        const cardIds = cards.map((c) => c.Id);
        await cardRepo.updateCategoryTagId(cardIds, reassignTagId);
      }
    }
    await tagRepo.delete(id);
    await refresh();
  };

  return { tags, addTag, updateTag, deleteTag, refresh };
}
