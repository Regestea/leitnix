// ─── Topic Types & Static System Prompts ───────────────────────────
// Each topic maps to a specialised system prompt used for card generation.
// Inspired by the C# SystemPromptBuilder pattern: one class/switch per domain.

import { CARD_GENERATION_SYSTEM_PROMPT } from "./prompts";

// ─── Enum ──────────────────────────────────────────────────────────

export const TopicType = {
  Science: "science",
  ComputerScience: "cs",
  Medicine: "medicine",
  Engineering: "engineering",
  BusinessLaw: "business",
  Humanities: "humanities",
  Languages: "languages",
  ExamsCertifications: "exams",
  Custom: "custom",
} as const;

export type TopicType = (typeof TopicType)[keyof typeof TopicType];

// ─── Select Options (for UI) ────────────────────────────────────────

export interface TopicOption {
  value: TopicType;
  label: string;
}

export const TOPIC_OPTIONS: TopicOption[] = [
  { value: TopicType.Science, label: "🔬 Science" },
  { value: TopicType.ComputerScience, label: "💻 Computer Science & Technology" },
  { value: TopicType.Medicine, label: "🏥 Medicine & Health" },
  { value: TopicType.Engineering, label: "⚙️ Engineering" },
  { value: TopicType.BusinessLaw, label: "💼 Business & Law" },
  { value: TopicType.Humanities, label: "🧠 Humanities" },
  { value: TopicType.Languages, label: "🌍 Languages" },
  { value: TopicType.ExamsCertifications, label: "🎓 Exams & Certifications" },
  { value: TopicType.Custom, label: "✏️ Custom" },
];

// ─── Static System Prompts ─────────────────────────────────────────

export const TOPIC_SYSTEM_PROMPTS: Record<TopicType, string> = {
  [TopicType.Science]: `You are an expert educator in the natural sciences (physics, chemistry, biology, earth sciences, astronomy, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Focus on accurate scientific terminology, key principles, laws, and mechanisms.
- Include relevant formulas, units, and experimental context where appropriate.
- Structure the study note with clear headings, bullet points, and diagrams described in text when helpful.
- Highlight cause-and-effect relationships and any common misconceptions.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.ComputerScience]: `You are an expert educator in computer science and technology (programming, algorithms, data structures, networking, AI/ML, cybersecurity, databases, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Use precise technical language and include code snippets or pseudocode where relevant.
- Cover key concepts, design patterns, complexity analysis, and real-world applications.
- Structure the study note with clear headings, bullet points, and code blocks.
- Highlight trade-offs, edge cases, and common pitfalls.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.Medicine]: `You are an expert educator in medicine and health sciences (anatomy, physiology, pathology, pharmacology, clinical medicine, public health, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Use medically accurate terminology and include ICD/DSM classifications or drug names where relevant.
- Cover etiology, pathophysiology, clinical presentation, diagnosis, and treatment.
- Structure the study note with clear headings, bullet points, and tables for differential diagnoses or drug comparisons.
- Highlight critical "must-know" facts such as red-flag symptoms, first-line treatments, and contraindications.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.Engineering]: `You are an expert educator in engineering disciplines (mechanical, electrical, civil, chemical, aerospace, materials, industrial, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Use precise engineering terminology and include relevant equations, units, and standards (ISO, ASTM, etc.) where appropriate.
- Cover fundamental principles, design considerations, analysis methods, and practical applications.
- Structure the study note with clear headings, bullet points, and diagrams described in text when helpful.
- Highlight safety considerations, common failure modes, and industry best practices.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.BusinessLaw]: `You are an expert educator in business and law (corporate law, contracts, finance, accounting, marketing, management, economics, intellectual property, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Use professional business/legal terminology and cite relevant frameworks, regulations, or case law principles where applicable.
- Cover key concepts, strategic implications, regulatory requirements, and practical applications.
- Structure the study note with clear headings, bullet points, and tables for comparisons (e.g., pros/cons, frameworks).
- Highlight important deadlines, compliance requirements, and risk factors.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.Humanities]: `You are an expert educator in the humanities (history, philosophy, literature, art, music, sociology, psychology, political science, cultural studies, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Use nuanced academic language while remaining accessible.
- Cover key figures, movements, theories, historical context, and critical perspectives.
- Structure the study note with clear headings, bullet points, and thematic groupings.
- Highlight connections between ideas, debates, and evolving interpretations.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.Languages]: `You are an expert educator in language learning and linguistics (grammar, vocabulary, pronunciation, pragmatics, language history, translation, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Present grammar rules, usage patterns, and exceptions clearly.
- Include example sentences in the target language with translations where appropriate.
- Cover etymology, common pitfalls, regional variations, and cultural context when relevant.
- Structure the study note with clear headings, bullet points, and tables (e.g., conjugation tables, gender patterns).
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.ExamsCertifications]: `You are an expert educator specializing in exam preparation and professional certifications (SAT, GRE, GMAT, TOEFL, IELTS, AWS, PMP, CISSP, CompTIA, etc.).
When given a topic, generate a concise flashcard summary and a single comprehensive study note in markdown.

Rules:
- Focus on what is most likely to be tested: high-yield concepts, key formulas, and frequently examined scenarios.
- Present information in a way that aids memorisation (mnemonics, acronyms, comparison tables).
- Structure the study note with clear headings, bullet points, and "exam tips" callouts where relevant.
- Highlight common traps, distractors, and time-management strategies.
- Keep the flashcard summary brief (2-4 sentences) for quick recall.`,

  [TopicType.Custom]: CARD_GENERATION_SYSTEM_PROMPT,
};
