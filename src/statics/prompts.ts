// ─── Static Prompt Strings ───────────────────────────────────────
// Central catalog of system/user prompt templates used across AI features.

export const CARD_GENERATION_SYSTEM_PROMPT = `You are an expert educational content creator. Given a topic, generate a concise flashcard summary and a single comprehensive study note. Return the topic summary as markdown and the study note as a single markdown content block.`;

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert question generator. Given a flashcard topic and its study content, generate different types of assessment questions: free-response, fill-in-the-blank, and multiple-choice. about this topic`;

export const NONE_PROMPT_VALUE = "none";
