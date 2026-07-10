import { useEffect, useState } from "react";
import type { AiModel } from "../../../db/entities";
import { aiModelRepository } from "../../../repositories/AiModelRepository";
import type { IAiModelRepository } from "../../../iRepositories/IAiModelRepository";

export function useAiModels() {
  const repository: IAiModelRepository = aiModelRepository;
  const [models, setModels] = useState<AiModel[]>([]);

  useEffect(() => {
    let cancelled = false;
    repository.getAll().then((data) => {
      if (!cancelled) setModels(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const deleteModel = async (id: string) => {
    await repository.delete(id);
    setModels((prev) => prev.filter((m) => m.Id !== id));
  };

  const updateModel = async (model: AiModel) => {
    await repository.update(model);
    setModels((prev) => prev.map((m) => (m.Id === model.Id ? model : m)));
  };

  const addModel = async (model: AiModel) => {
    await repository.create(model);
    setModels((prev) => [...prev, model]);
  };

  return { models, deleteModel, updateModel, addModel };
}
