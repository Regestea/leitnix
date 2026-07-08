import { useEffect, useMemo, useState } from "react";
import { CategoryTagRepository } from "../../repository/CategoryTagRepository";
import { CardRepository } from "../../repository/CardRepository";
import type { CategoryTag } from "../../../../shared/types/entities";

export function useCategoryTags() {
  const tagRepo = useMemo(() => new CategoryTagRepository(), []);
  const cardRepo = useMemo(() => new CardRepository(), []);
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
