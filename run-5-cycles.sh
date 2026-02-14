#!/bin/bash
echo "🚀 Running 5 autonomous cycles..."
for i in {1..5}; do
  echo ""
  echo "═════════════════════════════════════"
  echo "   CYCLE $i/5"
  echo "═════════════════════════════════════"
  echo ""
  npx tsx src/cli.ts autopilot --agent openai
  echo ""
  echo "✅ Cycle $i complete. Sleeping 5s..."
  sleep 5
done
echo ""
echo "🏁 All 5 cycles complete!"
