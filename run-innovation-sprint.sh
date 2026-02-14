#!/bin/bash
echo "🚀 INNOVATION SPRINT: Building Full Autonomy Infrastructure"
echo ""
echo "Tasks to complete:"
echo "  1. 🔔 Webhook sender"
echo "  2. 📊 Metrics export"
echo "  3. 💰 Budget manager"
echo "  4. 🖥️  Metrics dashboard"
echo "  5. 🔄 Rollback manager"
echo "  6. 🚀 Auto-merge system"
echo "  7. ⏰ Scheduled autopilot"
echo ""
START_TIME=$(date +%s)

# Run until queue is empty (all 7 tasks done)
CYCLE=1
while [ $(grep -c "status: pending" tasks/queue.yaml) -gt 0 ]; do
  echo ""
  echo "═══════════════════════════════════════════"
  echo "   CYCLE $CYCLE - $(date +%H:%M:%S)"
  echo "   Pending: $(grep -c 'status: pending' tasks/queue.yaml) tasks"
  echo "═══════════════════════════════════════════"
  echo ""
  
  npx tsx src/cli.ts autopilot --agent openai
  
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️  Cycle $CYCLE had issues (exit $EXIT_CODE)"
  else
    echo "✅ Cycle $CYCLE complete"
  fi
  
  CYCLE=$((CYCLE + 1))
  
  # Safety limit: max 30 cycles
  if [ $CYCLE -gt 30 ]; then
    echo ""
    echo "⚠️  Reached 30 cycle limit, stopping."
    break
  fi
  
  echo ""
  echo "⏸️  Sleeping 5s..."
  sleep 5
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "🏁 INNOVATION SPRINT COMPLETE — $(date +%H:%M:%S)"
echo "   Total time: ${MINUTES}m ${SECONDS}s"
echo "   Total cycles: $((CYCLE - 1))"
echo ""

# Show results
echo "📊 FINAL STATUS:"
echo "   Completed: $(grep -c 'status: completed' tasks/queue.yaml) tasks"
echo "   Pending: $(grep -c 'status: pending' tasks/queue.yaml) tasks"
echo "   Failed: $(grep -c 'status: failed' tasks/queue.yaml) tasks"
echo ""

# List new modules
echo "🎉 NEW MODULES CREATED:"
git log --oneline --since="$((MINUTES + 1)) minutes ago" | grep -i "webhook\|metrics\|budget\|dashboard\|rollback\|merge\|scheduled" | head -10

echo ""
