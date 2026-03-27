#!/bin/bash
SPECS_DIR=$1

PLAN="${SPECS_DIR}/plan.md"
PROGRESS_FILE="${SPECS_DIR}/progress.txt"

PROMPT="Read @${PLAN} and @${PROGRESS_FILE}. \
Find the next incomplete GROUP or VERIFICATION and implement it. \
For every complete task, tag task as complete in the plan.md, git commit. \
After completing the whole GROUP or VERIFICATION, \
improve the memory files (CLAUDE.md rules) and README.md with any relevant learnings or changes from this task, \
Update progress.txt with what you did. \
ONLY DO ONE GROUP or VERIFICATION AT A TIME AND EXIT ONCE DONE WITH THE GROUP or VERIFICATION. \
You MUST still follow the memory files policies. \
If all tasks are complete, write <promise>COMPLETE</promise> into plan.md \
then create a PR to staging. \
"

claude -p  --output-format stream-json "$PROMPT" --permission-mode bypassPermissions --verbose --remote-control