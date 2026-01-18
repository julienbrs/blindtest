# Blindtest Project - Ralph Development Instructions

You are implementing a music blindtest web application, one issue at a time.

## Your Workflow

For each iteration:

1. **Read PRD.md** - Find the first unchecked task (line starting with `- [ ]`)
2. **Read the epic file** - Get detailed specifications from `docs/epics/{epic-file}.md`
3. **Implement the issue** - Follow acceptance criteria exactly
4. **Run feedback loops** - Execute: `npm run typecheck && npm run test && npm run lint`
5. **Commit changes** - Use the format below
6. **Update PRD.md** - Change `- [ ]` to `- [x]` for the completed task
7. **Append to progress.txt** - Document what was done

## Bootstrap Phase (Issues 1.1-1.7 + BOOTSTRAP.FEEDBACK)

During bootstrap, feedback loops are NOT available. Skip step 4.

After completing issue 1.7, you MUST complete BOOTSTRAP.FEEDBACK:

- Install vitest: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`
- Install husky: `npm install -D husky && npx husky init`
- Install lint-staged: `npm install -D lint-staged prettier`
- Add to package.json scripts:
  - `"typecheck": "tsc --noEmit"`
  - `"test": "vitest run"`
- Create `.husky/pre-commit`:
  ```bash
  npx lint-staged
  npm run typecheck
  npm run test
  ```
- Create `.lintstagedrc`:
  ```json
  {
    "*": "prettier --ignore-unknown --write"
  }
  ```
- Create `vitest.config.ts`
- Create `src/test/setup.ts` (empty or with jsdom setup)

After BOOTSTRAP.FEEDBACK, all subsequent issues run with full feedback loops.

## Commit Message Format

```
feat(epic-N): Issue N.M - Short description

- What was implemented
- Key files changed

Acceptance criteria verified:
- [x] Criterion 1
- [x] Criterion 2
```

## Progress Entry Format

```
=== Issue X.Y: Title ===
Timestamp: [ISO date]
Status: COMPLETED
Commit: [hash]
Notes: Brief description of what was done
Files: List of key files created/modified
```

## Important Rules

1. **One issue per iteration** - Never do multiple issues in one run
2. **Read the epic file** - Always check docs/epics/ for detailed specs
3. **Follow acceptance criteria** - Each issue lists what must be true when done
4. **Run feedback loops** - After bootstrap, always run typecheck/test/lint before commit
5. **Fix before commit** - If feedback loops fail, fix issues first
6. **Update PRD.md** - Mark task complete by changing `[ ]` to `[x]`
7. **Append to progress.txt** - Never overwrite, only append

## Environment Setup

The project uses:

- `AUDIO_FOLDER_PATH` env variable pointing to audio files
- Create `.env.local` (gitignored) with the actual path
- Create `.env.example` (committed) as template

## File Structure (Target)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── game/page.tsx
│   └── api/
│       ├── songs/route.ts
│       ├── audio/[id]/route.ts
│       └── cover/[id]/route.ts
├── components/
│   ├── ui/
│   └── game/
├── hooks/
├── lib/
│   ├── audioScanner.ts
│   ├── types.ts
│   └── utils.ts
└── test/
    └── setup.ts
```

## When All Tasks Complete

If all tasks in PRD.md are checked `[x]`, output:

```
<promise>COMPLETE</promise>
```

## Reference Documents

- `docs/PLAN.md` - Project overview
- `docs/AI_CODING_GUIDELINES.md` - Feedback loop configuration
- `docs/epics/*.md` - Detailed issue specifications
