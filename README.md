# Spatial Roommate

A spatial AI productivity experience built for the Meta VR Start Developer Competition 2026.

## Current direction

Spatial Roommate turns a user's workspace into an interactive spatial task environment. The experience is being designed around hands-first interaction, spatial objects, an AI companion, and persistent progression.

## Technology

- Meta Immersive Web SDK (IWSDK)
- WebXR
- Three.js
- TypeScript
- Vite
- GitHub Actions
- GitHub Pages

## Development model

The repository is intentionally GitHub-first. Dependency installation, typechecking, production builds, and deployment run in GitHub Actions so the local Termux environment stays lightweight.

## Local development

Node.js 24+ is recommended by the current IWSDK documentation.

```bash
npm install
npm run dev
```

For CI, GitHub Actions installs dependencies and runs:

```bash
npm run typecheck
npm run build
```

## Competition

Target division: Productivity.

Potential special-award alignment:

- Best Agentic Interaction
- Best Reason to Come Back
- Best First Five Minutes
- Boldest Original Concept

This repository is an original project for the competition.
