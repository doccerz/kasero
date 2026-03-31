#!/bin/bash
# USAGE: ralph-loop.sh <specs_dir> <iteration_count> [agent]
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

PLAN="${SPECS_DIR}/plan.md"
PROGRESS_FILE="${SPECS_DIR}/progress.txt"
PROMPT_FILE="ralph-prompt.md"
PROMPT="@${PLAN} @${PROGRESS_FILE}. $(cat $PROMPT_FILE)"

run_agent() {
  case "$AGENT" in
    claude)
      claude -p --output-format stream-json "$PROMPT" --permission-mode acceptEdits --verbose
      ;;
    qwen)
      qwen -p --output-format stream-json "$PROMPT" --approval-mode auto-edit --debug
      ;;
    opencode)
      opencode run --prompt "$PROMPT" --print-logs
      ;;
  esac
}

for ((i=1; i<=ITERATION; i++)); do
  echo "--- Iteration $i of $ITERATION ---"

  run_agent

  if grep -q "<promise>COMPLETE</promise>" "${PLAN}"; then
    echo "${PLAN} complete after $i iterations."
    exit 0
  else
    echo "${PLAN} not complete after $i iterations."
  fi
done