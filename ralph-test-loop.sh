#!/bin/bash
# USAGE: ralph-test-loop.sh <specs_dir> <iteration_count> [agent]
# AGENT: claude (default), qwen, opencode
set -e

SPECS_DIR="$1"
ITERATION="$2"
AGENT="${3:-claude}"

# Validate agent
case "$AGENT" in
  claude|qwen|opencode)
    ;;
  *)
    echo "Error: Invalid agent '$AGENT'. Must be one of: claude, qwen, opencode"
    exit 1
    ;;
esac

PROGRESS_FILE="${SPECS_DIR}/progress.txt"
PROMPT="Run all tests: npm, playwright, and any other relevant tests. Pick the first issue/error encountered and only fix that one. Run tests again and make sure no additional issues are added by the fix. Update @${PROGRESS_FILE} on what you did. If all tests passed, write <promise>COMPLETE</promise> into @${PROGRESS_FILE}."

run_agent() {
  case "$AGENT" in
    claude)
      claude -p --output-format stream-json "$PROMPT" --permission-mode acceptEdits --verbose
      ;;
    qwen)
      qwen -p --output-format stream-json "$PROMPT" --approval-mode yolo --debug
      ;;
    opencode)
      opencode run --prompt "$PROMPT" --print-logs
      ;;
  esac
}

for ((i=1; i<=ITERATION; i++)); do
  echo "--- Iteration $i of $ITERATION ---"

  run_agent

  if grep -q "<promise>COMPLETE</promise>" "@${PROGRESS_FILE}"; then
    echo "Test fixes complete after $i iterations."
    exit 0
  else
    echo "Test fixes not complete after $i iterations."
  fi
done