import type { SpatialTask } from './tasks';

const STORAGE_KEY = 'spatial-roommate-session-v1';

interface StoredSession {
  goal: string;
  tasks: Array<{ id: string; status: SpatialTask['status'] }>;
}

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getStoredGoal(): string {
  return readStoredSession()?.goal?.trim() ?? '';
}

export function saveSession(goal: string, tasks: SpatialTask[]): void {
  const session: StoredSession = {
    goal,
    tasks: tasks.map((task) => ({ id: task.id, status: task.status })),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
