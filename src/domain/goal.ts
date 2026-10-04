export interface GoalIntent {
  raw: string;
  focus: string;
  category: 'build' | 'learn' | 'plan' | 'general';
}

export function parseGoal(goal: string): GoalIntent {
  const raw = goal.trim().replace(/\s+/g, ' ');
  const normalized = raw.toLowerCase();

  const category =
    /learn|study|understand|practice/.test(normalized)
      ? 'learn'
      : /plan|organize|schedule|prepare/.test(normalized)
        ? 'plan'
        : /build|create|make|ship|launch|design|code/.test(normalized)
          ? 'build'
          : 'general';

  return {
    raw,
    focus: raw || 'Make progress on something meaningful',
    category,
  };
}
