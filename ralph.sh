#!/bin/bash
# USAGE: ralph.sh <specs_dir>
SPECS_DIR=$1

PLAN="${SPECS_DIR}/plan.md"
PROGRESS_FILE="${SPECS_DIR}/progress.txt"
PROMPT_FILE="ralph-prompt.md"
PROMPT="@${PLAN} @${PROGRESS_FILE}. $(cat $PROMPT_FILE)"

claude -p  --output-format stream-json "$PROMPT" --permission-mode acceptEdits --verbose