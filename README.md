# Spatial Roommate

A spatial AI productivity companion built for the **Meta VR Start Developer Competition 2026**.

## The idea

ROOMMATE turns the user's physical environment into a living task workspace.

Instead of opening a conventional productivity app, the user:

1. Chooses what they want to accomplish.
2. Meets the Roommate companion.
3. Gets a goal-shaped spatial plan.
4. Manipulates physical task objects with hands or ray interaction.
5. Sees the room react as progress is made.
6. Returns later and continues where they left off.
7. Starts a new goal after completing a session.

The core loop is:

**Goal → Understand → Plan → Spatial action → Progress → Remember → Return**

## What is implemented

### Spatial onboarding

The first experience presents three goal directions:

- **Build** — make something concrete.
- **Learn** — practice a skill.
- **Plan** — organize what comes next.

### Goal-aware planning

Roommate classifies natural goal language into Build, Learn, Plan, or General intent and generates a three-step spatial sequence.

Examples:

- Build → Focus → Build → Ship
- Learn → Question → Practice → Recall
- Plan → Define → Organize → Next step

### Hands-first interaction

In the Quest/IWSDK runtime, task objects support hand/poke interaction, ray interaction, and one-hand grabbing and translation.

The public GitHub Pages demo provides a browser-compatible interaction path with large direct touch/click targets, so the same spatial task loop can be demonstrated on phones and desktops without a headset.

### Reactive environment

Progress changes the spatial environment: task objects change state, the next task is emphasized, progress markers respond, the companion changes mood, the desk changes appearance, completion produces a spatial pulse, and a return beacon appears after finishing.

### Persistent memory

The current goal and task completion state are stored locally so the experience can resume a previous workspace when the same goal returns.

### Return loop

Completing a workspace does not end the experience. Roommate presents the goal selector again, creating a repeatable **complete → choose again → return** loop.

## Technology

- Meta Immersive Web SDK (IWSDK)
- WebXR
- Three.js
- TypeScript
- Vite
- GitHub Actions
- GitHub Pages

## Development and verification

The repository is intentionally GitHub-first. CI handles dependency installation, typechecking, and production builds.

Commands verified by CI:

- `npm install`
- `npm run typecheck`
- `npm run build`

The project also has a dedicated Phase 3 verification workflow and automatic GitHub Pages deployment.

## Competition positioning

**Primary division:** Productivity

Strong potential alignment:

- **Best Agentic Interaction** — goal interpretation drives planning and spatial behavior.
- **Best Reason to Come Back** — persistent progress and a new-goal return loop.
- **Best First Five Minutes** — spatial onboarding quickly gets the user into the core interaction.
- **Boldest Original Concept** — productivity work becomes part of the physical/spatial environment.


### Judge/demo shortcuts

The public GitHub Pages demo accepts a goal directly through the URL:

- Build: `?goal=Build%20a%20portfolio%20project`
- Learn: `?goal=Learn%20a%20new%20skill`
- Plan: `?goal=Plan%20a%20productive%20week`

This preserves the normal onboarding experience while giving judges and demo recordings a fast way to enter a specific goal-driven workspace.


### Recommended judge walkthrough

For the fastest evaluation of the core experience:

1. Open the public demo and choose **Build something**.
2. Tap the blue Roommate companion to enter the spatial workspace.
3. Notice the three spatial task objects and the highlighted next step.
4. Complete each task object and watch the object, progress markers, companion, desk, and HUD react.
5. Finish all three steps to see the completion state and **What comes next?** return loop.
6. Reload an unfinished goal to demonstrate persistent progress and the **Welcome back** state.
7. For a direct demo, use a documented `?goal=` shortcut to start with a specific goal.

The browser path is the public demonstration surface; the Quest/IWSDK path is the intended immersive interaction experience.

## Project status

Core development is approaching feature freeze. The next stage is final QA, production/demo verification, visual capture, video preparation, and Devpost submission.

This repository is an original project for the competition.
