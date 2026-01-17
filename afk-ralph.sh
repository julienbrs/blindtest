#!/bin/bash
# afk-ralph.sh - Autonomous Ralph loop
# Usage: ./afk-ralph.sh [max_iterations]
#
# Run this script to let Ralph work autonomously.
# Default: 50 iterations. Adjust as needed.

set -e

MAX_ITERATIONS=${1:-50}

cd "$(dirname "$0")"

echo "=== AFK Ralph - Autonomous Mode ==="
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for ((i=1; i<=$MAX_ITERATIONS; i++)); do
  echo "=== Iteration $i of $MAX_ITERATIONS ==="
  echo "Started: $(date -Iseconds)"

  # Find the next incomplete task
  next_task=$(grep -n '^\- \[ \]' PRD.md | head -1 | cut -d: -f2- || echo "")

  if [ -z "$next_task" ]; then
    echo ""
    echo "=== ALL TASKS COMPLETE ==="
    echo "Finished at iteration $i"
    exit 0
  fi

  echo "Working on: $next_task"
  echo ""

  # Run Claude in print mode with auto-accept permissions
  result=$(claude -p --permission-mode acceptEdits \
    "@CLAUDE.md @PRD.md @progress.txt \
Execute the next incomplete task from PRD.md NOW. Do not ask for confirmation. \
1. The next task is: $next_task \
2. Read the referenced epic file in docs/epics/ for detailed specs. \
3. Implement the issue following acceptance criteria exactly. \
4. Skip feedback loops during bootstrap phase (issues 1.1-1.7). \
5. Commit your changes with format: feat(epic-N): Issue N.M - description \
6. Mark the task complete in PRD.md by changing [ ] to [x]. \
7. Append your progress to progress.txt. \
DO THIS NOW. ONLY DO ONE TASK. Do not ask questions, just implement. \
If all tasks in PRD.md are complete, output <promise>COMPLETE</promise>.")

  echo "$result"

  # Check for completion signal
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "=== PRD COMPLETE ==="
    echo "All tasks finished after $i iterations."
    exit 0
  fi

  # Brief pause to avoid rate limiting
  sleep 5

  echo ""
done

echo "=== Max iterations reached ==="
echo "Stopped at iteration $MAX_ITERATIONS"
echo "Run again to continue."
