import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PokeInteractable,
  RayInteractable,
  SphereGeometry,
  OneHandGrabbable,
  World,
} from '@iwsdk/core';
import {
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { getCompanionState } from './domain/companion';
import { planGoal } from './domain/planner';
import { getStoredGoal, loadSession, saveSession } from './domain/memory';
import { summarizeSession } from './domain/session';

const container = document.querySelector<HTMLDivElement>('#scene-container');

if (!container) {
  throw new Error('Missing #scene-container');
}

const runtimeStatus = document.querySelector<HTMLDivElement>('#runtime-status');
if (runtimeStatus) {
  runtimeStatus.textContent = 'Starting browser workspace…';
}

// GitHub Pages is also the public phone/desktop demo. IWSDK's full
// initialization is intended for XR browsers and can stall on some mobile
// WebGL environments. Use a tiny native Three.js preview there, while Quest
// browsers continue to use the real IWSDK runtime.
const isQuestBrowser =
  typeof navigator !== 'undefined' &&
  /OculusBrowser|Quest/i.test(navigator.userAgent);

let world: Awaited<ReturnType<typeof World.create>> | null = null;
let browserRenderer: WebGLRenderer | null = null;
let browserCamera: PerspectiveCamera | null = null;
let browserScene: Scene | null = null;

if (isQuestBrowser) {
  const runtimeOptions = {
    xr: false as const,
    input: { canvasPointerEvents: true },
    features: { spatialUI: false },
    render: {
      camera: {
        position: [0, 1.55, 3.8] as [number, number, number],
        lookAt: [0, 1.3, -1] as [number, number, number],
      },
    },
  };

  try {
    world = await Promise.race([
      World.create(container, runtimeOptions),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('IWSDK initialization timed out after 12 seconds')), 12000),
      ),
    ]);
  } catch (error) {
    console.error('Spatial Roommate IWSDK failed to initialize', error);
    if (runtimeStatus) {
      const details = error instanceof Error ? error.message : String(error);
      runtimeStatus.textContent = 'Quest runtime startup failed: ' + details;
      runtimeStatus.classList.add('error');
    }
    throw error;
  }
} else {
  browserScene = new Scene();
  browserCamera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  browserCamera.position.set(0, 1.55, 3.8);
  browserCamera.lookAt(0, 1.3, -1);

  browserRenderer = new WebGLRenderer({ antialias: true, alpha: false });
  browserRenderer.setClearColor(0x050a18, 1);
  browserRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  browserRenderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(browserRenderer.domElement);

  window.addEventListener('resize', () => {
    if (!browserCamera || !browserRenderer) return;
    browserCamera.aspect = window.innerWidth / window.innerHeight;
    browserCamera.updateProjectionMatrix();
    browserRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  browserRenderer.domElement.addEventListener('pointerdown', (event) => {
    if (!browserCamera || !browserRenderer || !browserScene) return;
    const rect = browserRenderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // On touch browsers, use screen-space hit testing for the main
    // companion/task targets before relying on WebGL ray intersections.
    const screenPoint = new Vector3();
    if (!sessionStarted && goal) {
      screenPoint.copy(companion.position).project(browserCamera);
      const companionX = rect.left + ((screenPoint.x + 1) / 2) * rect.width;
      const companionY = rect.top + ((1 - screenPoint.y) / 2) * rect.height;
      if (Math.hypot(event.clientX - companionX, event.clientY - companionY) < 110) {
        companion.userData.roommateAction?.();
        return;
      }
    }

    if (sessionStarted && plannedTasks.length > 0) {
      for (let index = 0; index < taskCards.length; index += 1) {
        const task = plannedTasks[index];
        const card = taskCards[index];
        if (!task || !card || !card.visible || task.status !== 'open') continue;

        screenPoint.copy(card.position).project(browserCamera);
        const taskX = rect.left + ((screenPoint.x + 1) / 2) * rect.width;
        const taskY = rect.top + ((1 - screenPoint.y) / 2) * rect.height;
        if (Math.hypot(event.clientX - taskX, event.clientY - taskY) < 95) {
          completeTask(index);
          return;
        }
      }
    }

    raycaster.setFromCamera(pointer, browserCamera);
    const hits = raycaster.intersectObjects(browserScene.children, true);
    // Decorative rings can be closer to the camera than the interactive
    // companion/task mesh. Select the nearest explicitly interactive object
    // rather than letting the decoration swallow the tap.
    const target = hits.find(
      (hit) => hit.object.userData.roommateInteractive === true,
    )?.object;
    if (target) {
      const action = (target.userData as { roommateAction?: () => void }).roommateAction;
      if (action) {
        action();
      } else {
        target.dispatchEvent({
          type: 'pointerdown',
          nativeEvent: event,
        } as never);
      }
    }
  });

  browserRenderer.setAnimationLoop(() => {
    if (browserRenderer && browserCamera && browserScene) {
      browserRenderer.render(browserScene, browserCamera);
    }
  });
  runtimeStatus?.remove();
}

const root = world ? world.getPersistentRoot() : browserScene!;

const floorMaterial = new MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.92,
});
const floor = new Mesh(new BoxGeometry(8, 0.05, 8), floorMaterial);
floor.position.set(0, 0.88, -1.0);
root.add(floor);

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
companion.userData.roommateInteractive = true;
companion.userData.roommateAction = () => {
  if (!goal || sessionStarted) return;
  sessionStarted = true;
  wakeRing.visible = false;
  companion.scale.setScalar(1.08);
  for (const card of taskCards) {
    card.visible = true;
  }
  console.log('Roommate: welcome. Your workspace is ready.');
  updateTaskFocus();
  updateCompanion();
  updateHud();
};
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

if (world) {
  const companionEntity = world.createTransformEntity(companion);
  companionEntity.addComponent(RayInteractable);
  companionEntity.addComponent(PokeInteractable);
}

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
let goalPanel: HTMLDivElement | null = null;
let hud: HTMLDivElement | null = null;

function updateHud(): void {
  if (!hud || !goal) return;
  const summary = summarizeSession(plannedTasks);
  const nextTask = plannedTasks.find((task) => task.status === 'open');
  const hint = summary.finished
    ? 'Goal complete'
    : sessionStarted
      ? memory.resumed && summary.completed > 0
        ? nextTask
          ? `Welcome back · Next: ${nextTask.title}`
          : 'Welcome back · Keep going'
        : nextTask
          ? `Next: ${nextTask.title}`
          : 'Keep going'
      : 'Tap Roommate to begin';

  hud.innerHTML = `
    <div class="roommate-hud-card">
      <div class="roommate-hud-goal">${goal}</div>
      <div class="roommate-hud-progress">Progress ${summary.completed}/${summary.total}</div>
    </div>
    <div class="roommate-hud-hint">${hint}</div>
  `;
}

function updateTaskFocus(): void {
  const nextOpenId = plannedTasks.find((task) => task.status === 'open')?.id;

  for (let index = 0; index < plannedTasks.length; index += 1) {
    const task = plannedTasks[index];
    const card = taskCards[index];
    if (!card) continue;

    const material = card.material as MeshStandardMaterial;
    const isNext = task.id === nextOpenId;
    const isComplete = task.status === 'complete';

    card.scale.setScalar(isComplete ? 1.08 : isNext ? 1.16 : 0.92);

    if (isComplete) {
      material.emissive.setHex(0x166534);
    } else if (isNext) {
      material.emissive.setHex(0x2563eb);
    } else {
      material.emissive.setHex(0x0f172a);
    }
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
  updateHud();

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

function showGoalPanel(): HTMLDivElement {
  if (!goalPanel) {
    goalPanel = document.createElement('div');
    goalPanel.className = 'goal-panel';
    document.body.appendChild(goalPanel);
  }

  goalPanel.innerHTML = `
    <div class="goal-panel-card">
      <div class="goal-panel-title">What comes next?</div>
      <div class="goal-panel-subtitle">You finished this workspace. Choose another direction and Roommate will build the next spatial plan.</div>
      <button data-goal="Build a portfolio project">Build something</button>
      <button data-goal="Learn a new skill">Learn a skill</button>
      <button data-goal="Plan a productive week">Plan something</button>
    </div>
  `;
  goalPanel.style.display = 'grid';

  goalPanel.querySelectorAll<HTMLButtonElement>('button[data-goal]').forEach((button) => {
    button.addEventListener('click', () => {
      goalPanel?.style.setProperty('display', 'none');
      returnBeacon.visible = false;
      void startWorkspace(button.dataset.goal ?? '');
    });
  });

  return goalPanel;
}

function completeTask(index: number): void {
  const task = plannedTasks[index];
  const card = taskCards[index];
  if (!task || !card || task.status !== 'open') return;

  task.status = 'complete';
  card.scale.setScalar(1.08);
  card.material = completeMaterial.clone();

  saveSession(goal, plannedTasks);

  completionPulse.visible = true;
  completionPulse.scale.setScalar(0.7);
  setTimeout(() => completionPulse.scale.setScalar(1.15), 120);
  setTimeout(() => completionPulse.scale.setScalar(1), 280);

  const summary = summarizeSession(plannedTasks);
  if (summary.finished) {
    sessionStarted = false;
    wakeRing.visible = false;
    returnBeacon.visible = true;
    returnBeacon.scale.setScalar(1.35);
    showGoalPanel();
    console.log('Roommate: you finished this goal. Choose another goal when you are ready to return.');
  } else {
    console.log(
      `Roommate: ${summary.remaining} step${summary.remaining === 1 ? '' : 's'} left${summary.nextTask ? ` — next: ${summary.nextTask}` : ''}.`,
    );
  }

  updateTaskFocus();
  updateCompanion();
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
    card.userData.roommateInteractive = true;
    card.userData.roommateAction = () => completeTask(index);
    card.rotation.y = index * 0.12;
    card.position.set(-1.1 + index * 1.1, 1.18, -1.05);
    card.visible = memory.resumed;

    if (task.status === 'complete') {
      card.material = completeMaterial.clone();
    } else if (index === plannedTasks.findIndex((candidate) => candidate.status === 'open')) {
      const nextMaterial = (activeTaskMaterial.clone() as MeshStandardMaterial);
      nextMaterial.emissive.setHex(0x172554);
      card.material = nextMaterial;
    }

    taskCards.push(card);

    // The browser preview has no IWSDK world to register the entity with,
    // so explicitly attach task meshes to the Three.js scene.
    if (!world) {
      root.add(card);
    }

    if (world) {
      const entity = world.createTransformEntity(card);
      entity.addComponent(RayInteractable);
      entity.addComponent(OneHandGrabbable, {
        translate: true,
        rotate: false,
      });
    }

    card.addEventListener('pointerdown', () => {
      completeTask(index);
    });
  }
}

async function startWorkspace(selectedGoal: string): Promise<void> {
  goal = selectedGoal.trim();
  if (!goal) return;

  plannedTasks = planGoal(goal);
  memory = loadSession(plannedTasks, goal);
  const restoredSummary = summarizeSession(plannedTasks);
  sessionStarted = memory.resumed && !restoredSummary.finished;
  if (restoredSummary.finished) {
    for (const task of plannedTasks) task.status = 'open';
    localStorage.removeItem('spatial-roommate-session-v1');
    memory = { goal: '', resumed: false };
  }
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

hud = document.createElement('div');
hud.className = 'roommate-hud';
document.body.appendChild(hud);

if (!goal) {
  const panel = showGoalPanel();
  const title = panel.querySelector('.goal-panel-title');
  const subtitle = panel.querySelector('.goal-panel-subtitle');
  if (title) title.textContent = 'What are we working on?';
  if (subtitle) {
    subtitle.textContent =
      'Choose a direction and Roommate will shape the spatial workspace around it.';
  }
  console.log('Roommate: choose a goal from the browser goal panel.');
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

  companion.userData.roommateAction?.();
});

let companionPulseTime = 0;

function animateCompanion(deltaSeconds: number): void {
  if (!goal || !companion.visible) return;

  companionPulseTime += deltaSeconds;
  const state = getCompanionState(plannedTasks);
  const baseScale =
    state.mood === 'celebrating'
      ? 1.35
      : state.mood === 'encouraging'
        ? 1.15
        : sessionStarted
          ? 1.08
          : 1;

  const breathing = 1 + Math.sin(companionPulseTime * 2.4) * 0.035;
  companion.scale.setScalar(baseScale * breathing);

  if (!sessionStarted && state.mood === 'ready') {
    const ringScale = 1 + Math.sin(companionPulseTime * 2.8) * 0.08;
    wakeRing.scale.setScalar(ringScale);
  }
}

if (browserRenderer) {
  let lastFrame = performance.now();
  browserRenderer.setAnimationLoop((time) => {
    const deltaSeconds = Math.min((time - lastFrame) / 1000, 0.05);
    lastFrame = time;
    animateCompanion(deltaSeconds);

    if (browserRenderer && browserCamera && browserScene) {
      browserRenderer.render(browserScene, browserCamera);
    }
  });
}

console.log('Spatial Roommate companion reasoning ready', {
  runtime: world ? 'IWSDK XR' : 'Three.js browser preview',
});
