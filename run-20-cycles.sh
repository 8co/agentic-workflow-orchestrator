#!/bin/bash
echo "🚀 LFG! Running 20 autonomous cycles..."
echo ""
START_TIME=$(date +%s)

for i in {1..20}; do
  echo ""
  echo "═════════════════════════════════════"
  echo "   CYCLE $i/20 - $(date +%H:%M:%S)"
  echo "═════════════════════════════════════"
  echo ""
  
  npx tsx src/cli.ts autopilot --agent openai
  
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️  Cycle $i had issues (exit $EXIT_CODE), continuing..."
  else
    echo "✅ Cycle $i complete"
  fi
  
  echo ""
  echo "⏸️  Sleeping 10s before next cycle..."
  sleep 10
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "🏁 ALL 20 CYCLES COMPLETE — $(date +%H:%M:%S)"
echo "   Total time: ${MINUTES}m ${SECONDS}s"
echo ""
