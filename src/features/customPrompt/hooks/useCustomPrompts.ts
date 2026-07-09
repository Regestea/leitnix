import { useEffect, useState } from "react";
import type { CustomPrompt } from "../../../shared/types/entities";
import { customPromptRepository } from "../../../repositories/CustomPromptRepository";
import type { ICustomPromptRepository } from "../../../iRepositories/ICustomPromptRepository";

export function useCustomPrompts() {
  const repository: ICustomPromptRepository = customPromptRepository;
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);

  useEffect(() => {
    let cancelled = false;
    repository.getAll().then((data) => {
      if (!cancelled) setPrompts(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const deletePrompt = async (id: string) => {
    await repository.delete(id);
    setPrompts((prev) => prev.filter((p) => p.Id !== id));
  };

  const updatePrompt = async (prompt: CustomPrompt) => {
    await repository.update(prompt);
    setPrompts((prev) => prev.map((p) => (p.Id === prompt.Id ? prompt : p)));
  };

  const addPrompt = async (prompt: CustomPrompt) => {
    await repository.create(prompt);
    setPrompts((prev) => [...prev, prompt]);
  };

  return { prompts, deletePrompt, updatePrompt, addPrompt };
}
