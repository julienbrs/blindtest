#!/bin/bash
# ralph-once.sh - Human-in-the-loop Ralph (single iteration)
# Usage: ./ralph-once.sh
#
# Run this script to execute ONE task from PRD.md.
# Review the changes, then run again for the next task.

set -e

cd "$(dirname "$0")"

echo "=== Ralph Once - Single Iteration ==="
echo ""

# Find the next incomplete task
next_task=$(grep -n '^\- \[ \]' PRD.md | head -1 | cut -d: -f2- || echo "")

if [ -z "$next_task" ]; then
  echo "All tasks complete! Project finished."
  exit 0
fi

echo "Next task: $next_task"
echo ""

# Run Claude with permission to edit files automatically
claude --permission-mode acceptEdits \
  "@CLAUDE.md @PRD.md @progress.txt \
Execute the next incomplete task from PRD.md NOW. Do not ask for confirmation. \
1. The next task is: $next_task \
2. Read the referenced epic file in docs/epics/ for detailed specs. \
3. Implement the issue following acceptance criteria exactly. \
4. Skip feedback loops during bootstrap phase (issues 1.1-1.7). \
5. Commit your changes with format: feat(epic-N): Issue N.M - description \
6. Mark the task complete in PRD.md by changing [ ] to [x]. \
7. Append your progress to progress.txt. \
DO THIS NOW. ONLY DO ONE TASK. Do not ask questions, just implement."

echo ""
echo "=== Iteration complete ==="
echo "Review the changes, then run again for the next task."
