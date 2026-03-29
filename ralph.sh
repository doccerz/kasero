#!/bin/bash
# USAGE: ralph.sh <specs_dir>
SPECS_DIR=$1

PLAN="${SPECS_DIR}/plan.md"
PROGRESS_FILE="${SPECS_DIR}/progress.txt"

PROMPT="Read @${PLAN} and @${PROGRESS_FILE}. \
Find the next incomplete TASK GROUP, TEST, VERIFICATION and implement it. \
For every complete task, tag task as complete in the plan.md, git commit. \
Clear context after every task. \
After completing the whole TASK GROUP, TEST, VERIFICATION, \
improve the memory files (CLAUDE.md rules) and README.md with any relevant learnings or changes from this task, \
Update progress.txt with what you did. \
ONLY DO ONE TASK GROUP, TEST, VERIFICATION AT A TIME AND EXIT ONCE DONE WITH THE TASK GROUP, TEST, VERIFICATION. \
You MUST still follow the memory files policies. \
If all tasks are complete, write <promise>COMPLETE</promise> into plan.md, \
then create a PR to staging. \
"

claude -p  --output-format stream-json "$PROMPT" --permission-mode acceptEdits --verbose