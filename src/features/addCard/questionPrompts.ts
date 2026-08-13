import type { QuestionType } from "./types";
import { TopicType } from "./topicPrompts";

export function buildQuestionCounts(
  questionTypes: readonly QuestionType[],
): Record<QuestionType, number> {
  const counts: Record<QuestionType, number> = {
    freeResponse: 0,
    fillTheBlank: 0,
    multipleChoice: 0,
  };

  const count = questionTypes.length;

  if (count === 3) {
    for (const type of questionTypes) {
      counts[type] = 6;
    }
  } else if (count === 2) {
    counts[questionTypes[0]] = 5;
    counts[questionTypes[1]] = 4;
  } else if (count === 1) {
    counts[questionTypes[0]] = 18;
  }

  return counts;
}

const GLOBAL_QUALITY_PROMPT = `
You are an expert educational question designer.

Your goal is NOT merely to generate questions.
Your goal is to generate high-quality questions that improve long-term learning and retrieval.

Use ONLY the provided study content as factual evidence.

## Grounding
- Never introduce facts, terminology, examples, dates, numbers, rules, or conclusions that are not supported by the study content.
- Do not use your outside knowledge to fill missing information.
- If the study content does not support a useful question, do not invent one.
- Every answer must be directly supported by the study content.

## Learning Value
Prefer concepts that are:
- important
- likely to be worth remembering
- central to the topic
- useful for understanding other concepts
- easy to confuse with related concepts

Avoid trivial or low-value details unless the content itself is primarily factual.

## Coverage
Distribute questions across different important parts of the study content.
Do not repeatedly test the same sentence, fact, or concept.

## Diversity
Questions must test different knowledge targets.

Avoid:
- paraphrasing the same question
- repeating the same answer
- testing the same fact multiple times
- using the same reasoning pattern for every question

## Difficulty
Aim for a useful mix of difficulty:
- some straightforward questions
- mostly moderate questions
- some challenging questions

Difficulty should come from thinking, comparison, application, explanation, or distinguishing similar concepts,
not from ambiguity or obscure wording.

## Clarity
Every question must:
- be clear
- have a well-defined expected answer
- avoid unnecessary wording
- avoid ambiguity
- avoid trick wording

## Self-check
Before returning the final result, internally validate every question:

1. Is it fully supported by the study content?
2. Is the answer correct?
3. Is the answer sufficiently specific?
4. Is the question unambiguous?
5. Does it test something worth learning?
6. Is it sufficiently different from the other questions?
7. Could a student answer it without relying on outside knowledge?

Discard and replace any question that fails these checks.

Return ONLY valid JSON.
Do not wrap the JSON in markdown fences.
`;

const QUESTION_TYPE_PROMPTS: Record<QuestionType, string> = {
  freeResponse: `
## Question Type: Free Response

Generate questions that require the learner to actively retrieve and explain knowledge.

Prefer:
- why questions
- how questions
- cause and effect
- comparison
- mechanism
- application
- explaining a concept in context

Avoid:
- questions answerable with a single trivial word when deeper understanding is possible
- questions requiring unsupported assumptions
- vague questions such as "Explain this topic."

### Answer requirements
The answer must:
- directly answer the question
- be self-contained
- use terminology from the study content
- contain enough explanation to teach the concept
- not contain unsupported information

The answer should be concise but educational.
`,

  fillTheBlank: `
## Question Type: Fill in the Blank

Each question must contain EXACTLY ONE blank:

_____

The blank must represent an important piece of knowledge.

Good targets include:
- key terminology
- concepts
- named principles
- formulas
- values
- relationships
- classifications
- important technical terms

Avoid:
- generic words
- words that can be guessed from grammar alone
- multiple possible answers
- blanks that remove too much context

The sentence must provide enough context for the learner to understand what knowledge is being tested.

### Answer requirements
- The answer must be the exact expected word or phrase.
- Do not provide alternatives.
- The answer must be directly supported by the study content.
`,

  multipleChoice: `
## Question Type: Multiple Choice

Each question must contain EXACTLY four options:
A, B, C, D.

Exactly ONE option must be correct.

### Question quality
Prefer questions requiring:
- understanding
- application
- comparison
- interpretation
- identification of the best explanation

Avoid questions that can be answered from wording clues.

### Distractors
Every distractor must be plausible to a learner who partially understands the concept.

Good distractors may represent:
- common misconceptions
- confusion between related concepts
- partially correct reasoning
- incorrect application of a known rule

Bad distractors:
- obviously absurd answers
- unrelated concepts
- joke answers
- answers with obviously different length/style
- duplicate meanings

### Option quality
- Keep options reasonably similar in length and grammatical structure.
- Do not make the correct option consistently longer or more detailed.
- Do not use "all of the above" or "none of the above".
- Do not make the answer obvious through wording.

### Correct answer distribution
Across the generated set, distribute correct answers reasonably across A/B/C/D.
Do not repeatedly put the correct answer in the same position.
`,
};

const TOPIC_QUESTION_FOCUS: Record<
  TopicType,
  Record<QuestionType, string>
> = {
  [TopicType.Science]: {
    freeResponse: `
Focus on:
- mechanisms
- cause and effect
- scientific reasoning
- interpreting evidence
- relationships between concepts
- explaining observable phenomena

Prefer "why" and "how" questions when supported by the content.
`,
    fillTheBlank: `
Target precise scientific vocabulary such as:
- laws
- principles
- quantities
- units
- equations
- structures
- processes
- classifications
- named compounds or elements
`,
    multipleChoice: `
Build distractors around realistic scientific misconceptions.
When supported by the content, distinguish:
- correlation vs causation
- hypothesis vs theory
- structure vs function
- cause vs consequence
`,
  },

  [TopicType.ComputerScience]: {
    freeResponse: `
Focus on:
- algorithm behavior
- data structures
- complexity
- code behavior
- system behavior
- architecture
- trade-offs
- debugging
- design decisions

Prefer questions that ask why an approach works or when one approach is preferable.
`,
    fillTheBlank: `
Target:
- algorithm names
- data structures
- API names
- protocols
- commands
- programming concepts
- complexity classes
- important syntax or terminology
`,
    multipleChoice: `
Prefer:
- code tracing
- complexity analysis
- behavior prediction
- architecture decisions
- technology trade-offs

Distractors should reflect realistic programming mistakes or conceptual misunderstandings.
`,
  },

  [TopicType.Medicine]: {
    freeResponse: `
Focus on:
- mechanisms
- pathophysiology
- symptom reasoning
- diagnostic reasoning
- treatment rationale
- relationships between findings

Do not introduce medical information that is absent from the study content.
`,
    fillTheBlank: `
Target precise:
- anatomical terms
- physiological terms
- disease names
- drug classes
- diagnostic tests
- pathological processes
`,
    multipleChoice: `
Use clinically plausible distractors.
Prefer questions involving:
- mechanisms
- findings
- differential reasoning
- diagnosis
- management decisions

Avoid ambiguous choices that could all be clinically reasonable.
`,
  },

  [TopicType.Engineering]: {
    freeResponse: `
Focus on:
- operating principles
- system behavior
- component interaction
- design decisions
- failure modes
- engineering trade-offs
`,
    fillTheBlank: `
Target:
- component names
- engineering terminology
- units
- parameters
- laws
- formulas
- standard concepts
`,
    multipleChoice: `
Prefer:
- design decisions
- failure analysis
- system behavior
- component selection
- engineering calculations when supported by the content

Distractors should represent realistic engineering errors.
`,
  },

  [TopicType.BusinessLaw]: {
    freeResponse: `
Focus on:
- principles
- decision making
- application of concepts
- risks
- trade-offs
- consequences
`,
    fillTheBlank: `
Target:
- legal doctrines
- business terminology
- financial metrics
- frameworks
- principles
- named models
`,
    multipleChoice: `
Prefer scenario-based questions when the study content supports them.

Distractors should represent realistic misapplications of the relevant principle.
`,
  },

  [TopicType.Humanities]: {
    freeResponse: `
Focus on:
- interpretation
- comparison
- historical context
- arguments
- causes and consequences
- relationships between ideas
`,
    fillTheBlank: `
Target important:
- concepts
- movements
- figures
- works
- events
- terminology
`,
    multipleChoice: `
Test understanding of:
- ideas
- context
- arguments
- differences between viewpoints
- causes and consequences

Avoid obscure trivia when a conceptual question is possible.
`,
  },

  [TopicType.Languages]: {
    freeResponse: `
Focus on practical language use.

Prefer:
- sentence construction
- grammar explanation
- contextual meaning
- word usage
- distinctions between similar expressions
`,
    fillTheBlank: `
The blank must test:
- vocabulary
- verb forms
- articles
- prepositions
- particles
- grammatical structures

The surrounding sentence must make the intended answer clear.
`,
    multipleChoice: `
Prefer:
- contextual vocabulary
- grammar
- collocations
- natural usage
- distinctions between similar forms

Only one option should sound correct in the given context.
`,
  },

  [TopicType.ExamsCertifications]: {
    freeResponse: `
Focus on exam-relevant understanding and problem solving.

Prefer:
- explaining concepts
- solving problems
- identifying the correct process
- understanding trade-offs
- common exam traps
`,
    fillTheBlank: `
Target:
- important terminology
- commands
- formulas
- configuration values
- protocol names
- exact concepts commonly required by the exam
`,
    multipleChoice: `
Use exam-style construction:
- one clearly best answer
- plausible distractors
- realistic scenarios
- no ambiguity
- no wording tricks
`,
  },

  [TopicType.Custom]: {
    freeResponse: `
Adapt the reasoning style to the domain.
Prefer questions that test understanding, application, comparison, and explanation.
`,
    fillTheBlank: `
Target high-value domain-specific terminology and concepts.
`,
    multipleChoice: `
Create domain-appropriate distractors based on realistic misunderstandings.
`,
  },
};

function getDifficultyDistribution(count: number): string {
  if (count <= 2) {
    return `
Use a natural mix of difficulty.
Do not force every difficulty level when the set is very small.
`;
  }

  const easy = Math.max(1, Math.round(count * 0.2));
  const hard = Math.max(1, Math.round(count * 0.2));
  const medium = count - easy - hard;

  return `
Difficulty target:
- Easy: approximately ${easy}
- Medium: approximately ${medium}
- Hard: approximately ${hard}

Medium questions should be the majority.
`;
}

function getOutputSchema(questionType: QuestionType): string {
  switch (questionType) {
    case "freeResponse":
      return `
Return:
{
  "questions": [
    {
      "markdownQuestion": "...",
      "markdownAnswer": "..."
    }
  ]
}
`;

    case "fillTheBlank":
      return `
Return:
{
  "questions": [
    {
      "markdownQuestion": "... _____ ...",
      "markdownAnswer": "..."
    }
  ]
}
`;

    case "multipleChoice":
      return `
Return:
{
  "questions": [
    {
      "markdownQuestion": "...",
      "markdownOptionA": "...",
      "markdownOptionB": "...",
      "markdownOptionC": "...",
      "markdownOptionD": "...",
      "correctOption": "A"
    }
  ]
}
`;
  }
}

export function buildQuestionPrompt(
  topicType: TopicType,
  questionType: QuestionType,
  count: number,
): string {
  return `
${GLOBAL_QUALITY_PROMPT}

${QUESTION_TYPE_PROMPTS[questionType]}

<topic_focus>
${TOPIC_QUESTION_FOCUS[topicType][questionType]}
</topic_focus>

${getDifficultyDistribution(count)}

## Generation Target
Generate exactly ${count} high-quality ${questionType} questions.

Before returning the JSON:
- remove duplicates
- remove low-value questions
- remove ambiguous questions
- remove questions not fully supported by the study content
- replace weak questions with stronger ones
- verify every answer
- verify the requested structure
- verify the exact question count

${getOutputSchema(questionType)}
`;
}