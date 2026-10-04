export interface GoalIntent {
  raw: string;
  focus: string;
  category: 'build' | 'learn' | 'plan' | 'general';
}

export function parseGoal(goal: string): GoalIntent {
  const raw = goal.trim().replace(/\s+/g, ' ');
  const normalized = raw.toLowerCase();

  const category =
    /learn|study|understand|practice|read|course|skill/.test(normalized)
      ? 'learn'
      : /plan|organize|schedule|prepare|week|project plan|roadmap/.test(normalized)
        ? 'plan'
        : /build|create|make|ship|launch|design|code|app|website|prototype|project/.test(normalized)
          ? 'build'
          : 'general';

  const focus = raw
    ? raw.length > 72
      ? `${raw.slice(0, 69).trimEnd()}...`
      : raw
    : 'Make progress on something meaningful';

  return {
    raw,
    focus,
    category,
  };
}
