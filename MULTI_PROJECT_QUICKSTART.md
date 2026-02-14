# Quick Start: Multi-Project Orchestrator

## Commands

```bash
# List all configured projects
npx tsx src/cli.ts projects

# Check queue status for a project
npx tsx src/cli.ts queue --project api
npx tsx src/cli.ts queue --project ui
npx tsx src/cli.ts queue  # orchestrator (default)

# Propose tasks (preview only - safe)
npx tsx src/cli.ts propose preview --project api --agent openai
npx tsx src/cli.ts propose preview --project ui --agent openai

# Propose and queue tasks
npx tsx src/cli.ts propose queue --project api --agent openai

# Run autopilot (propose + execute)
npx tsx src/cli.ts autopilot --project api --agent openai
npx tsx src/cli.ts autopilot --project ui --agent openai

# Run existing workflow on a project
npx tsx src/cli.ts auto workflows/api-error-handling.yaml --project api --agent openai

# Run scheduler
npx tsx src/cli.ts schedule loop --project api --agent openai
```

## Project IDs

- `orchestrator` - The orchestrator itself (default)
- `api` - prompt-scorer-sls-api
- `ui` - prompt-scorer-ui

## Important Notes

1. **Running Instance**: Your running orchestrator will continue to work on itself. These new features require a restart to use.

2. **Separate Queues**: Each project maintains its own `tasks/queue.yaml`:
   - `agentic-workflow-orchestrator/tasks/queue.yaml`
   - `prompt-scorer-sls-api/tasks/queue.yaml`
   - `prompt-scorer-ui/tasks/queue.yaml`

3. **Git Isolation**: Changes are committed to the correct project's git repo.

4. **Safety**: The `--project` flag is optional. Without it, defaults to `orchestrator`.

## Testing (Safe - No Changes)

```bash
# 1. List projects
npx tsx src/cli.ts projects

# 2. Check API queue (currently empty)
npx tsx src/cli.ts queue --project api

# 3. Check UI queue (currently empty)
npx tsx src/cli.ts queue --project ui
```

## Go Live

When you're ready to let it work on your other projects:

```bash
# Stop your running orchestrator (Ctrl+C in the other terminal)

# Run autopilot on the API
npx tsx src/cli.ts autopilot --project api --agent openai

# Or run autopilot on the UI
npx tsx src/cli.ts autopilot --project ui --agent openai
```

## Configuration

Edit `projects.yaml` to customize:
- Scan directories
- Verification commands
- Project descriptions
- Add more projects

