#!/bin/bash
echo "🔥 LET IT RIP! Running 40 autonomous cycles..."
echo ""
START_TIME=$(date +%s)

for i in {1..40}; do
  echo ""
  echo "═══════════════════════════════════════════"
  echo "   CYCLE $i/40 - $(date +%H:%M:%S)"
  echo "═══════════════════════════════════════════"
  echo ""
  
  npx tsx src/cli.ts autopilot --agent openai
  
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️  Cycle $i had issues (exit $EXIT_CODE), continuing..."
  else
    echo "✅ Cycle $i complete"
  fi
  
  # Progress checkpoint every 10 cycles
  if [ $((i % 10)) -eq 0 ]; then
    ELAPSED=$(($(date +%s) - START_TIME))
    MINS=$((ELAPSED / 60))
    echo ""
    echo "📊 CHECKPOINT: $i/40 cycles complete in ${MINS}m"
    git log --oneline -1
    echo ""
  fi
  
  echo ""
  echo "⏸️  Sleeping 10s..."
  sleep 10
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "🏁 ALL 40 CYCLES COMPLETE — $(date +%H:%M:%S)"
echo "   Total time: ${MINUTES}m ${SECONDS}s"
echo "   Average: $((DURATION / 40))s per cycle"
echo ""

# Final stats
echo "📊 FINAL STATS:"
git log --oneline --since="$((MINUTES + 1)) minutes ago" | wc -l | xargs echo "   Total commits:"
git log --oneline --since="$((MINUTES + 1)) minutes ago" | grep -c "create-\|add-.*-module\|add-.*-utils" | xargs echo "   Innovation commits:"
ls -la src/*.ts | wc -l | xargs echo "   TypeScript files:"
echo ""
