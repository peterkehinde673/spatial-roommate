# ROOMMATE — Spatial AI Companion

**A goal-driven spatial productivity workspace built for the Meta VR Start Developer Competition 2026.**

ROOMMATE explores a simple idea: what if getting things done felt less like managing a flat checklist and more like entering a workspace that responds to you?

**[Open the live demo](https://peterkehinde673.github.io/spatial-roommate/) · [Watch the demo](https://youtube.com/shorts/9YBgDu8ZCFU) · [Source code](https://github.com/peterkehinde673/spatial-roommate)**

## The experience

ROOMMATE turns a chosen goal into a small sequence of spatial task objects. The companion directs attention to the next step, objects change as tasks are completed, and the workspace responds to progress. Saved session state lets users return to an unfinished goal.

```text
Choose a goal → Enter the workspace → Act on spatial tasks
     ↑                                            ↓
Return to continue ← Remember progress ← See the room respond
```

## What the prototype includes

- **Goal-led onboarding:** choose a build, learn, or plan direction.
- **Goal-aware task planning:** maps the goal to a three-step sequence.
- **Spatial interaction:** task objects are placed in the scene and have distinct active and completed states.
- **Progress feedback:** task materials, emphasis, progress markers, companion mood, and workspace color respond to progress.
- **Session continuity:** unfinished progress is stored locally in the browser.
- **Return loop:** completing a goal offers a new direction rather than ending the experience.
- **Browser demo path:** touch/click interaction makes the core loop easy to inspect on a phone or desktop.

## Try the demo

Open the [live ROOMMATE demo](https://peterkehinde673.github.io/spatial-roommate/).

You can open a goal directly with one of these URLs:

- [Build a portfolio project](https://peterkehinde673.github.io/spatial-roommate/?goal=Build%20a%20portfolio%20project)
- [Learn a new skill](https://peterkehinde673.github.io/spatial-roommate/?goal=Learn%20a%20new%20skill)
- [Plan a productive week](https://peterkehinde673.github.io/spatial-roommate/?goal=Plan%20a%20productive%20week)

### Suggested judge walkthrough

1. Open the live demo and select **Build something**.
2. Tap the blue Roommate companion to begin.
3. Notice the task objects and the highlighted next step.
4. Complete the tasks one by one and observe the changing object states and progress feedback.
5. Finish the goal and inspect the **What comes next?** return loop.
6. For a persistence check, start a goal, complete one or two tasks, then reload the same goal URL in the same browser.

## Why this is spatial

ROOMMATE is an exploration of productivity where the workspace is part of the interface—not just a conventional task list rendered over a 3D background.

- Tasks are represented as objects in a shared spatial scene.
- Spatial emphasis signals what to focus on next.
- Direct object interaction is the main task-completion metaphor.
- Completion changes the companion and surrounding workspace.
- Returning to an unfinished goal restores task state instead of starting from zero.

## Built with

- Meta Immersive Web SDK (IWSDK)
- WebXR configuration and Three.js scene objects
- TypeScript
- Vite
- GitHub Actions
- GitHub Pages

## Runtime notes

The public GitHub Pages URL provides a Three.js browser preview with touch/click interaction for easy access and judging. The repository also contains IWSDK/WebXR configuration for the intended immersive path. The public browser demo should not be interpreted as proof of a tested physical-headset hand-tracking session; immersive behavior must be verified on a compatible Meta Quest browser/headset.

Session progress is stored locally in the current browser and is not synced across devices.

## Development and verification

Requirements: Node.js and npm.

```bash
npm install
npm run typecheck
npm run build
```

GitHub Actions runs typechecking and a production build on pushes and pull requests. The Pages workflow builds and deploys the public demo.

## Competition positioning

**Primary track:** Productivity

ROOMMATE explores how spatial computing can make goal setting, task focus, environmental feedback, and returning to unfinished work feel more embodied and continuous.

## Project status

This is a competition prototype focused on demonstrating the core interaction loop. The next development priorities are validating the immersive Quest path end-to-end, improving goal-specific task semantics, expanding automated tests, and continuing accessibility and performance checks.
