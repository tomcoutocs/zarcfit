type AiLogEntry = {
  endpoint: string;
  trainerId: string;
  clientId?: string;
  mode: 'rules' | 'llm';
  durationMs: number;
  sessionCount?: number;
  mealCount?: number;
};

export function logAiUsage(entry: AiLogEntry) {
  console.info('[ai]', JSON.stringify(entry));
}
