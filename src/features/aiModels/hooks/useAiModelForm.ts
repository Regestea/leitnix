import { useState } from "react";
import { EMPTY_MODEL, validateFormModel } from "../types";
import type { AiModelFormErrors } from "../types";
import type { AiModel } from "../../../db/entities.ts";
import { resolveProviderBaseUrl } from "../../../services/aiProviderConfig.ts";
import { testApi } from "../../../services/aiClient.ts";

export interface GeminiModelOption {
  value: string;
  label: string;
}

export function useAiModelForm() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModel, setFormModel] = useState<AiModel>(EMPTY_MODEL);

  const [testApiSuccess, setTestApiSuccess] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testApiError, setTestApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<AiModelFormErrors>({});

  const [geminiModels, setGeminiModels] = useState<GeminiModelOption[]>([]);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false);
  const [geminiModelsError, setGeminiModelsError] = useState<string | null>(null);

  const resetTestState = () => {
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors({});
  };

  const fetchGeminiModels = async (apiKey: string) => {
    if (!apiKey) {
      setGeminiModels([]);
      setGeminiModelsError(null);
      return;
    }

    setIsLoadingGeminiModels(true);
    setGeminiModelsError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch models. Please check your API key.");
      }

      const data = await response.json();
      const models: GeminiModelOption[] = (data.models || [])
        .filter(
          (m: { supportedGenerationMethods?: string[] }) =>
            m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string; displayName?: string }) => ({
          value: m.name.replace("models/", ""),
          label: m.displayName || m.name.replace("models/", ""),
        }));

      setGeminiModels(models);
    } catch (err) {
      setGeminiModelsError(
        err instanceof Error ? err.message : "Failed to fetch models"
      );
      setGeminiModels([]);
    } finally {
      setIsLoadingGeminiModels(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormModel(EMPTY_MODEL);
    resetTestState();
    setGeminiModels([]);
    setGeminiModelsError(null);
  };

  const openEdit = (model: AiModel) => {
    setEditingId(model.Id);
    setFormModel(model);
    setTestApiSuccess(true);
    setTestApiError(null);
    setFormErrors({});

    if (model.Provider === "GoogleGemini" && model.APIKey) {
      fetchGeminiModels(model.APIKey);
    }
  };

  const reset = () => {
    setEditingId(null);
    setFormModel(EMPTY_MODEL);
    resetTestState();
    setGeminiModels([]);
    setGeminiModelsError(null);
  };

  const handleFieldChange = (
    field: Exclude<keyof AiModel, "Provider">,
    value: string,
  ) => {
    setFormModel((prev: AiModel) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors((prev: AiModelFormErrors) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof AiModelFormErrors];
      return next;
    });
  };

  const handleProviderChange = (provider: AiModel["Provider"]) => {
    setFormModel((prev) => ({
      ...prev,
      Provider: provider,
      URL: provider === "OpenAiCompatible" ? prev.URL : null,
    }));
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors((prev) => {
      if (!("URL" in prev)) return prev;
      const next = { ...prev };
      delete next.URL;
      return next;
    });
  };

  const testApiKey = async () => {
    const { success, errors } = validateFormModel(formModel);
    setFormErrors(errors);
    if (!success) {
      setTestApiError(null);
      return;
    }

    setIsTestingApi(true);
    setTestApiError(null);

    try {
      const url = resolveProviderBaseUrl(formModel);
      const result = await testApi(
        url,
        formModel.APIKey as string,
        formModel.ModelName as string,
      );
      setTestApiSuccess(result);
      if (!result) {
        setTestApiError("Test failed");
      }
    } catch (err) {
      setTestApiSuccess(false);
      setTestApiError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsTestingApi(false);
    }
  };

  const validate = () => {
    const { success, errors } = validateFormModel(formModel);
    setFormErrors(errors);
    if (!success) {
      setTestApiSuccess(false);
    }
    return success;
  };

  return {
    editingId,
    formModel,
    testApiSuccess,
    isTestingApi,
    testApiError,
    formErrors,
    geminiModels,
    isLoadingGeminiModels,
    geminiModelsError,
    openAdd,
    openEdit,
    reset,
    handleFieldChange,
    handleProviderChange,
    testApiKey,
    fetchGeminiModels,
    validate,
  };
}
