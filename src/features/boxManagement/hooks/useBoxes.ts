import { useEffect, useMemo, useState } from "react";
import { BoxRepository } from "../repository/BoxRepository";
import type { Box } from "../../../shared/types/entities";

export function useBoxes() {
  const repository = useMemo(() => new BoxRepository(), []);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [cardCounts, setCardCounts] = useState<Map<string, number>>(new Map());

  const loadBoxes = () => {
    Promise.all([repository.getChainOrdered(), repository.getCardCounts()]).then(
      ([data, counts]) => {
        setBoxes(data);
        setCardCounts(counts);
      },
    );
  };

  useEffect(() => {
    loadBoxes();
  }, [repository]);

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
