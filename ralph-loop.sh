#!/bin/bash
# USAGE: ralph-loop.sh <specs_dir> <iteration_count>
set -e

# 1. Assignment: No '$' on the left side
SPECS_DIR="$1"
ITERATION="$2"

PLAN="${SPECS_DIR}/plan.md"
PROGRESS_FILE="${SPECS_DIR}/progress.txt"
PROMPT_FILE="ralph-prompt.md"

# 2. Quoting prompt properly
PROMPT="@${PLAN} @${PROGRESS_FILE}. $(cat $PROMPT_FILE)"

# 3. Use the variable name in the loop
for ((i=1; i<=ITERATION; i++)); do
  echo "--- Iteration $i of $ITERATION ---"
  
  # 4. Quote "$PROMPT" so it's passed as a single string
  claude -p  --output-format stream-json "$PROMPT" --permission-mode acceptEdits --verbose

  if grep -q "<promise>COMPLETE</promise>" ${PLAN}; then
    echo "${PLAN} complete after $i iterations."
    exit 0
  else
    echo "${PLAN} not complete after $i iterations."
  fi
done