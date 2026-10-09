import type { SpatialTask, TaskStatus } from './tasks';

const STORAGE_KEY = 'spatial-roommate-session-v1';

interface StoredSession {
  goal: string;
  tasks: Array<{ id: string; status: TaskStatus }>;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'open' || value === 'complete';
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('goal' in parsed) ||
      typeof parsed.goal !== 'string' ||
      !('tasks' in parsed) ||
      !Array.isArray(parsed.tasks)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const tasks = parsed.tasks.filter(
      (item): item is { id: string; status: TaskStatus } =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'string' &&
        'status' in item &&
        isTaskStatus(item.status),
    );

    return { goal: parsed.goal, tasks };
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
    return null;
  }
}

export function getStoredGoal(): string {
  return readStoredSession()?.goal.trim() ?? '';
}

export function saveSession(goal: string, tasks: SpatialTask[]): void {
  const session: StoredSession = {
    goal,
    tasks: tasks.map((task) => ({ id: task.id, status: task.status })),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The app remains usable when browser storage is blocked or full.
  }
}

export function loadSession(
  tasks: SpatialTask[],
  currentGoal?: string,
): { goal: string; resumed: boolean } {
  const stored = readStoredSession();
  if (!stored) {
    return { goal: '', resumed: false };
  }

  if (currentGoal && stored.goal !== currentGoal) {
    return { goal: '', resumed: false };
  }

  for (const task of tasks) {
    const saved = stored.tasks.find((item) => item.id === task.id);
    if (saved) {
      task.status = saved.status;
    }
  }

  return {
    goal: stored.goal,
    resumed: true,
  };
}
