import { describe, expect, it, beforeEach, vi } from 'vitest';
import { parseGoal } from '../src/domain/goal';
import { planGoal } from '../src/domain/planner';
import { summarizeSession } from '../src/domain/session';
import type { SpatialTask } from '../src/domain/tasks';
import { getStoredGoal, loadSession, saveSession } from '../src/domain/memory';

const memoryStore = new Map<string, string>();
const fakeStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => { memoryStore.set(key, value); },
  removeItem: (key: string) => { memoryStore.delete(key); },
  clear: () => memoryStore.clear(),
};

function tasks(): SpatialTask[] {
  return planGoal('Build a portfolio project');
}

describe('goal parsing and planning', () => {
  it('normalizes whitespace and detects learning goals', () => {
    expect(parseGoal('  Learn   TypeScript  ').raw).toBe('Learn TypeScript');
    expect(parseGoal('Learn TypeScript').category).toBe('learn');
  });

  it('limits the displayed focus length for long goals', () => {
    const result = parseGoal('x'.repeat(100));
    expect(result.focus.length).toBeLessThanOrEqual(72);
    expect(result.raw).toHaveLength(100);
  });

  it('creates three open spatial tasks with stable identifiers', () => {
    const result = planGoal('Plan my week');
    expect(result).toHaveLength(3);
    expect(result.map((task) => task.id)).toEqual(['focus', 'build', 'ship']);
    expect(result.every((task) => task.status === 'open')).toBe(true);
  });
});

describe('session summaries', () => {
  it('reports empty progress safely', () => {
    expect(summarizeSession([])).toMatchObject({
      completed: 0, total: 0, remaining: 0, nextTask: null, finished: false, progress: 0,
    });
  });

  it('tracks partial and completed progress', () => {
    const list = tasks();
    list[0]!.status = 'complete';
    expect(summarizeSession(list)).toMatchObject({
      completed: 1, total: 3, remaining: 2, finished: false, progress: 1 / 3,
    });
    list.forEach((task) => { task.status = 'complete'; });
    expect(summarizeSession(list).finished).toBe(true);
  });
});

describe('session persistence', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', fakeStorage);
  });

  it('saves and restores valid progress for the same goal', () => {
    const original = tasks();
    original[0]!.status = 'complete';
    saveSession('Build a portfolio project', original);
    expect(getStoredGoal()).toBe('Build a portfolio project');

    const restored = tasks();
    expect(loadSession(restored, 'Build a portfolio project').resumed).toBe(true);
    expect(restored[0]!.status).toBe('complete');
    expect(restored[1]!.status).toBe('open');
  });

  it('does not apply progress to a different goal', () => {
    saveSession('Build a portfolio project', tasks());
    const other = planGoal('Learn TypeScript');
    expect(loadSession(other, 'Learn TypeScript').resumed).toBe(false);
  });

  it('recovers from malformed stored JSON', () => {
    fakeStorage.setItem('spatial-roommate-session-v1', '{broken');
    expect(getStoredGoal()).toBe('');
    expect(fakeStorage.getItem('spatial-roommate-session-v1')).toBeNull();
  });

  it('does not throw when storage writes are blocked', () => {
    vi.stubGlobal('localStorage', {
      ...fakeStorage,
      setItem: () => { throw new Error('blocked'); },
    });
    expect(() => saveSession('Build a portfolio project', tasks())).not.toThrow();
  });
});
