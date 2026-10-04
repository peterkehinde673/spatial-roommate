import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PokeInteractable,
  RayInteractable,
  SphereGeometry,
  UIKitMLAsset,
  OneHandGrabbable,
  World,
} from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { getCompanionState } from './domain/companion';
import { planGoal } from './domain/planner';
import { getStoredGoal, loadSession, saveSession } from './domain/memory';
import { summarizeSession } from './domain/session';

const container = document.querySelector<HTMLDivElement>('#scene-container');

if (!container) {
  throw new Error('Missing #scene-container');
}

const supportsWebXR = 'xr' in navigator;
const runtimeOptions = supportsWebXR
  ? projectOptions
  : {
      ...projectOptions,
      xr: false,
      input: {
        canvasPointerEvents: true,
      },
      features: {
        grabbing: true,
        locomotion: {
          browserControls: true,
        },
      },
      render: {
        camera: {
          position: [0, 1.55, 0],
          lookAt: [0, 1.35, -1],
        },
      },
    };

const runtimeStatus = document.querySelector<HTMLDivElement>('#runtime-status');
if (runtimeStatus) {
  runtimeStatus.textContent = supportsWebXR
    ? 'Loading Spatial Roommate…'
    : 'Loading browser workspace…';
}

let world;
try {
  world = await World.create(container, runtimeOptions);
  runtimeStatus?.remove();
} catch (error) {
  console.error('Spatial Roommate failed to initialize', error);
  if (runtimeStatus) {
    runtimeStatus.textContent =
      'Spatial Roommate could not start on this browser. Try Chrome or Meta Quest Browser.';
    runtimeStatus.classList.add('error');
  }
  throw error;
}
const root = world.getPersistentRoot();

const deskMaterial = new MeshStandardMaterial({ color: 0x243047 });
const desk = new Mesh(new BoxGeometry(3.2, 0.12, 2.0), deskMaterial);
desk.position.set(0, 1.0, -1.0);
root.add(desk);

const companionMaterial = new MeshStandardMaterial({
  color: 0x7dd3fc,
  emissive: 0x164e63,
});
const companion = new Mesh(
  new SphereGeometry(0.22, 24, 16),
  companionMaterial,
);
companion.position.set(0, 1.55, -1.0);
root.add(companion);

const completionRing = new Mesh(
  new SphereGeometry(0.48, 24, 16),
  new MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x14532d,
    wireframe: true,
  }),
);
completionRing.position.copy(companion.position);
completionRing.visible = false;
root.add(completionRing);

const wakeRing = new Mesh(
  new SphereGeometry(0.34, 24, 16),
  new MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0c4a6e,
    wireframe: true,
  }),
);
wakeRing.position.copy(companion.position);
root.add(wakeRing);

const completionPulse = new Mesh(
  new SphereGeometry(0.58, 24, 16),
  new MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x166534,
    wireframe: true,
  }),
);
completionPulse.position.copy(companion.position);
completionPulse.visible = false;
root.add(completionPulse);

const progressMarkers = [0, 1, 2].map((index) => {
  const marker = new Mesh(
    new SphereGeometry(0.055, 16, 12),
    new MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x0f172a,
    }),
  );
  marker.position.set(-0.18 + index * 0.18, 1.68, -1.0);
  root.add(marker);
  return marker;
});

const returnBeacon = new Mesh(
  new SphereGeometry(0.1, 18, 12),
  new MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0c4a6e,
    wireframe: true,
  }),
);
returnBeacon.position.set(0, 1.88, -1.0);
returnBeacon.visible = false;
root.add(returnBeacon);

const companionEntity = world.createTransformEntity(companion);
companionEntity.addComponent(RayInteractable);
companionEntity.addComponent(PokeInteractable);

const light = new AmbientLight(0xffffff, 2);
root.add(light);

const taskMaterial = new MeshStandardMaterial({ color: 0x334155 });
const completeMaterial = new MeshStandardMaterial({
  color: 0x22c55e,
  emissive: 0x14532d,
});

const categoryMaterial = {
  build: new MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1e3a8a }),
  learn: new MeshStandardMaterial({ color: 0xc084fc, emissive: 0x581c87 }),
  plan: new MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x78350f }),
  general: new MeshStandardMaterial({ color: 0x94a3b8, emissive: 0x334155 }),
};

let goal = new URLSearchParams(window.location.search).get('goal')?.trim() || getStoredGoal();
let plannedTasks = planGoal(goal || 'Choose a goal');
let memory = goal ? loadSession(plannedTasks, goal) : { goal: '', resumed: false };
let sessionStarted = memory.resumed;
const taskCards: Mesh[] = [];
let goalPanel: UIKitMLAsset | null = null;

function updateTaskFocus(): void {
  const nextOpenId = plannedTasks.find((task) => task.status === 'open')?.id;

  for (let index = 0; index < plannedTasks.length; index += 1) {
    const task = plannedTasks[index];
    const card = taskCards[index];
    if (!card) continue;

    card.scale.setScalar(
      task.status === 'complete' ? 0.9 : task.id === nextOpenId ? 1.12 : 1,
    );
  }
}

function updateProgressMarkers(): void {
  const summary = summarizeSession(plannedTasks);
  for (let index = 0; index < progressMarkers.length; index += 1) {
    const marker = progressMarkers[index];
    const task = plannedTasks[index];
    const material = marker.material as MeshStandardMaterial;
    const complete = task?.status === 'complete';

    material.color.setHex(complete ? 0x4ade80 : 0x475569);
    material.emissive.setHex(complete ? 0x166534 : 0x0f172a);
    marker.scale.setScalar(complete ? 1.35 : 1);
  }

  const completedMarkers = Math.round(summary.progress * progressMarkers.length);
  progressMarkers.forEach((marker, index) => {
    if (index < completedMarkers) {
      marker.position.y = 1.68 + summary.progress * 0.08;
    } else {
      marker.position.y = 1.68;
    }
  });
}

function updateCompanion(): void {
  const state = getCompanionState(plannedTasks);
  updateProgressMarkers();

  companion.scale.setScalar(
    state.mood === 'celebrating'
      ? 1.35
      : state.mood === 'encouraging'
        ? 1.15
        : 1,
  );

  if (state.mood === 'celebrating') {
    companionMaterial.color.setHex(0x4ade80);
    companionMaterial.emissive.setHex(0x166534);
    deskMaterial.color.setHex(0x183b2b);
    completionRing.visible = true;
    completionPulse.visible = true;
  } else if (state.mood === 'encouraging') {
    companionMaterial.color.setHex(0xfacc15);
    companionMaterial.emissive.setHex(0x713f12);
    deskMaterial.color.setHex(0x3b3518);
    completionRing.visible = false;
    completionPulse.visible = false;
  } else {
    companionMaterial.color.setHex(0x7dd3fc);
    companionMaterial.emissive.setHex(0x164e63);
    deskMaterial.color.setHex(0x243047);
    completionRing.visible = false;
    completionPulse.visible = false;
  }

  console.log(
    `Roommate [${state.mood}] ${state.message} Progress: ${state.completed}/${state.total}`,
  );

  if (state.mood === 'encouraging') {
    returnBeacon.visible = false;
  }
}

function clearTaskCards(): void {
  for (const card of taskCards) {
    card.removeFromParent();
  }
  taskCards.length = 0;
}

function createTaskCards(): void {
  clearTaskCards();

  const normalizedGoal = goal.toLowerCase();
  const taskCategory = normalizedGoal.includes('learn') || normalizedGoal.includes('skill')
    ? 'learn'
    : normalizedGoal.includes('plan') || normalizedGoal.includes('week')
      ? 'plan'
      : normalizedGoal.includes('build') || normalizedGoal.includes('project')
        ? 'build'
        : 'general';
  const activeTaskMaterial = categoryMaterial[taskCategory];
  const taskGeometry = taskCategory === 'learn'
    ? new SphereGeometry(0.28, 20, 14)
    : normalizedGoal.includes('plan') || normalizedGoal.includes('week')
      ? new BoxGeometry(0.62, 0.62, 0.16)
      : new BoxGeometry(0.72, 0.42, 0.12);

  for (const [index, task] of plannedTasks.entries()) {
    const card = new Mesh(
      taskGeometry.clone(),
      activeTaskMaterial.clone(),
    );
    card.rotation.y = index * 0.18;
    card.position.set(...task.position);
    card.visible = memory.resumed;

    if (task.status === 'complete') {
      card.material = completeMaterial.clone();
    }

    taskCards.push(card);

    const entity = world.createTransformEntity(card);
    entity.addComponent(RayInteractable);
    entity.addComponent(OneHandGrabbable, {
      translate: true,
      rotate: false,
    });

    card.addEventListener('pointerdown', () => {
      const wasOpen = task.status === 'open';
      task.status = wasOpen ? 'complete' : 'open';

      if (wasOpen) {
        card.scale.setScalar(1.18);
        setTimeout(() => updateTaskFocus(), 180);
      }
      card.material = task.status === 'complete'
        ? completeMaterial.clone()
        : activeTaskMaterial.clone();

      saveSession(goal, plannedTasks);
      if (wasOpen) {
        const pulse = completionPulse;
        pulse.visible = true;
        pulse.scale.setScalar(0.7);
        setTimeout(() => {
          pulse.scale.setScalar(1.15);
        }, 120);
        setTimeout(() => {
          pulse.scale.setScalar(1);
        }, 280);
      }
      const summary = summarizeSession(plannedTasks);
      if (summary.finished && goalPanel) {
        goalPanel.visible = true;
        sessionStarted = false;
        wakeRing.visible = false;
        returnBeacon.visible = true;
        returnBeacon.scale.setScalar(1.35);
        console.log('Roommate: you finished this goal. Choose another goal when you are ready to return.');
      }
      console.log(
        summary.finished
          ? 'Roommate: session complete. Come back when you are ready for the next goal.'
          : `Roommate: ${summary.remaining} step${summary.remaining === 1 ? '' : 's'} left${summary.nextTask ? ` — next: ${summary.nextTask}` : ''}.`,
      );
      updateTaskFocus();
      updateCompanion();
    });
  }
}

async function startWorkspace(selectedGoal: string): Promise<void> {
  goal = selectedGoal.trim();
  if (!goal) return;

  plannedTasks = planGoal(goal);
  memory = loadSession(plannedTasks, goal);
  sessionStarted = memory.resumed;
  createTaskCards();

  wakeRing.visible = !sessionStarted;
  if (sessionStarted) {
    updateTaskFocus();
    updateCompanion();
    console.log(
      `Roommate: welcome back. Resuming your ${memory.goal || goal} workspace. ${summarizeSession(plannedTasks).completed}/${plannedTasks.length} steps complete.`,
    );
  } else {
    console.log(`Roommate: goal accepted — ${goal}`);
    console.log('Roommate: touch the companion to begin your spatial workspace.');
  }
}

goalPanel = !goal
  ? await world.assets.instantiate<UIKitMLAsset>('goal-panel')
  : null;

if (goalPanel) {
  const goalPanelEntity = world.createTransformEntity(goalPanel);
  goalPanelEntity.object3D!.position.set(0, 1.55, -1.65);
  goalPanelEntity.object3D!.scale.setScalar(0.25);
  goalPanelEntity.addComponent(RayInteractable);
  goalPanelEntity.addComponent(PokeInteractable);

  const selectGoal = (selectedGoal: string) => {
    goalPanel.visible = false;
    returnBeacon.visible = false;
    void startWorkspace(selectedGoal);
  };

  goalPanel.requireElementById('build-goal').addEventListener('click', () => {
    selectGoal('Build a portfolio project');
  });
  goalPanel.requireElementById('learn-goal').addEventListener('click', () => {
    selectGoal('Learn a new skill');
  });
  goalPanel.requireElementById('plan-goal').addEventListener('click', () => {
    selectGoal('Plan a productive week');
  });

  console.log('Roommate: choose a goal from the spatial panel.');
} else {
  await startWorkspace(goal);
}

companion.addEventListener('pointerover', () => {
  if (!sessionStarted) {
    wakeRing.scale.setScalar(1.15);
  }
});

companion.addEventListener('pointerout', () => {
  wakeRing.scale.setScalar(1);
});

companion.addEventListener('pointerdown', () => {
  if (!goal) {
    console.log('Roommate: choose a goal before starting.');
    return;
  }

  if (sessionStarted) {
    console.log('Roommate: tasks are already in the room.');
    return;
  }

  sessionStarted = true;
  wakeRing.visible = false;
  companion.scale.setScalar(1.08);

  for (const card of taskCards) {
    card.visible = true;
  }

  console.log('Roommate: welcome. Your workspace is ready.');
  updateTaskFocus();
  updateCompanion();
});

console.log('Spatial Roommate companion reasoning ready', world);
