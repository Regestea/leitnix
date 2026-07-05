// ─── Static Prompt Strings ───────────────────────────────────────
// Central catalog of system/user prompt templates used across AI features.

export const CARD_GENERATION_SYSTEM_PROMPT = `You are an expert educational content creator. Given a topic, generate a concise flashcard summary and multiple detailed study notes. Return the topic summary as markdown and a list of detailed notes as markdown content blocks.`;

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert question generator. Given a flashcard topic and its study notes, generate different types of assessment questions: free-response, fill-in-the-blank, and multiple-choice. All content in markdown.`;

export const NONE_PROMPT_VALUE = "none";
