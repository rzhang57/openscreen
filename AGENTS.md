# Repository Guidelines

## Project Structure & Module Organization
OpenScreen is a Vite + React + TypeScript renderer with an Electron main process.
- `src/`: renderer app code.
- `src/components/`: UI and feature components (`launch/`, `video-editor/`, `ui/`).
- `src/lib/`: export pipeline and shared library code (`exporter/`, helpers).
- `src/hooks/`, `src/utils/`: reusable hooks and utilities.
- `electron/`: Electron entry points (`main.ts`, `preload.ts`, IPC handlers).
- `public/`: static assets (preview images, wallpapers, icons used at runtime).
- `icons/`: packaging icons; `dist-electron/` is build output and should not be hand-edited.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run dev`: start local Vite dev server.
- `npm run build`: type-check, build renderer, then package with Electron Builder.
- `npm run build:win` / `build:mac` / `build:linux`: platform-specific packaging.
- `npm run preview`: preview production web build.
- `npm run lint`: run ESLint on `ts`/`tsx` files (warnings are treated strictly).
- `npm test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`), React function components.
- Follow existing ESLint config in `.eslintrc.cjs` (`@typescript-eslint`, `react-hooks`).
- Use 2-space indentation and match surrounding file style before introducing new patterns.
- Naming:
  - Components/files: `PascalCase` (for example `VideoEditor.tsx`).
  - Hooks: `useSomething` (for example `useScreenRecorder.ts`).
  - Utilities/modules: `camelCase` file names where appropriate.

## Testing Guidelines
- Framework: Vitest (`vitest.config.ts`) with tests located near code (for example `src/lib/exporter/gifExporter.test.ts`).
- Name test files `*.test.ts` or `*.test.tsx`.
- Add tests for bug fixes and non-trivial logic changes, especially in exporter/math/timeline behavior.
- Run `npm test` and `npm run lint` before opening a PR.

## Commit & Pull Request Guidelines
Recent history includes both concise subjects and Conventional Commit prefixes (`fix:`, `feat:`, `docs:`, `chore:`). Prefer:
- `type: short imperative summary` (for example `fix: prevent stale closure in timeline playback`).
- Keep commits focused; avoid mixing refactors with behavior changes.

For PRs:
- Describe what changed and why.
- Link related issues (for example `Closes #123`).
- Include screenshots/GIFs for UI changes.
- Call out platform-specific impact (Windows/macOS/Linux) when relevant.
