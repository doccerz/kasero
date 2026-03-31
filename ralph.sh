#!/bin/bash
# USAGE: ralph.sh <specs_dir> [agent]
# AGENT: claude (default), qwen, opencode

SPECS_DIR="$1"
AGENT="${2:-claude}"

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