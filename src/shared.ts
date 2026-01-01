// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied."
} as const;

// Central Groq model selection so backend services stay in sync
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
