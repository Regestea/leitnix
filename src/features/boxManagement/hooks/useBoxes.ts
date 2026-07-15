import { useCallback, useEffect, useState } from "react";
import type { Box } from "../../../db/entities";
import { boxRepository } from "../../../repositories/BoxRepository";
import type { IBoxRepository } from "../../../iRepositories/IBoxRepository";

export function useBoxes() {
  const repository: IBoxRepository = boxRepository;
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [cardCounts, setCardCounts] = useState<Map<string, number>>(new Map());

  const loadBoxes = useCallback(() => {
    Promise.all([repository.getChainOrdered(), repository.getCardCounts()]).then(
      ([data, counts]) => {
        setBoxes(data);
        setCardCounts(counts);
      },
    );
  }, [repository]);

  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  const deleteBox = async (id: string) => {
    await repository.delete(id);
    loadBoxes();
  };

  const updateBox = async (box: Box) => {
    await repository.update(box);
    loadBoxes();
  };

  const addBox = async (box: Box) => {
    await repository.create(box);
    loadBoxes();
  };

  return { boxes, cardCounts, deleteBox, updateBox, addBox };
}
