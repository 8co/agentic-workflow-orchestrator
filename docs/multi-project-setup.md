# Multi-Project Setup Complete! 🎉

## What Changed

The agentic workflow orchestrator now supports working on multiple projects. Here's what was added:

### 1. **projects.yaml** Configuration

Defines all projects the orchestrator can work on:

```yaml
projects:
  - id: orchestrator    # Self-improvement
  - id: api            # Serverless API backend
  - id: ui             # React frontend
```

### 2. **Project Registry** (`src/project-registry.ts`)

- Loads and manages project configurations
- Resolves project paths and settings
- Provides validation and defaults

### 3. **CLI `--project` Flag**

All commands now accept `--project <id>`:

```bash
# List all projects
npx tsx src/cli.ts projects

# Work on API
npx tsx src/cli.ts propose preview --project api --agent openai
npx tsx src/cli.ts autopilot --project api --agent openai

# Work on UI
npx tsx src/cli.ts autopilot --project ui --agent openai

# Work on orchestrator itself (default)
npx tsx src/cli.ts autopilot --agent openai
```

### 4. **Updated Components**

- **task-proposer**: Scans project-specific directories
- **scheduler**: Uses project-specific verification
- **CLI**: Routes all operations to target project

## Usage Examples

### Propose Tasks for API

```bash
npx tsx src/cli.ts propose preview --project api --agent openai
```

This will:
- Scan `prompt-scorer-sls-api/src` and `prompt-scorer-sls-api/resources`
- Analyze the serverless API codebase
- Propose 5 high-value tasks
- Show preview without queuing

### Run Autopilot on UI

```bash
npx tsx src/cli.ts autopilot --project ui --agent openai
```

This will:
- Scan `prompt-scorer-ui/src`
- Propose tasks for the React app
- Queue them in `prompt-scorer-ui/tasks/queue.yaml`
- Execute all tasks autonomously
- Commit to `prompt-scorer-ui` git repo

### Check Queue Status

```bash
# API project queue
npx tsx src/cli.ts queue --project api

# UI project queue
npx tsx src/cli.ts queue --project ui

# Orchestrator queue (default)
npx tsx src/cli.ts queue
```

## Safety Features

✅ **File Locking**: Each project has its own queue.yaml  
✅ **Git Isolation**: Changes committed to correct repo  
✅ **Path Resolution**: All operations scoped to project directory  
✅ **Backward Compatible**: Works without projects.yaml (defaults to self)

## Running Instance

Since you have the orchestrator running in another terminal:

1. **It won't break** - changes are backward compatible
2. **Restart when ready** - new features available after restart
3. **Test separately** - can test with `--project api` immediately
4. **No conflicts** - different projects = different queues

## Next Steps

### Test the Setup (Safe)

```bash
# 1. List projects (read-only)
npx tsx src/cli.ts projects

# 2. Dry run - propose but don't queue (safe)
npx tsx src/cli.ts propose preview --project api --agent openai

# 3. Check API's queue (should be empty initially)
npx tsx src/cli.ts queue --project api
```

### Go Live (When Ready)

```bash
# Restart your running orchestrator
# Then run autopilot on the API
npx tsx src/cli.ts autopilot --project api --agent openai
```

## How It Works

```
┌─────────────────────────────────────────┐
│  Agentic Workflow Orchestrator (here)   │
│  - Prompts: prompts/                    │
│  - Registry: projects.yaml              │
│  - Engine: src/                         │
└──────────────┬──────────────────────────┘
               │
               ├──► orchestrator (default)
               │    └─ tasks/queue.yaml
               │
               ├──► prompt-scorer-sls-api
               │    ├─ src/ (scanned)
               │    ├─ resources/ (scanned)
               │    └─ tasks/queue.yaml
               │
               └──► prompt-scorer-ui
                    ├─ src/ (scanned)
                    └─ tasks/queue.yaml
```

## Example Workflows

Created example workflows for external projects:

- `workflows/api-error-handling.yaml` - Add error handling to API
- `workflows/ui-loading-component.yaml` - Create loading spinner for UI

Run them with:

```bash
npx tsx src/cli.ts auto workflows/api-error-handling.yaml --project api --agent openai
npx tsx src/cli.ts auto workflows/ui-loading-component.yaml --project ui --agent openai
```

## Configuration

Edit `projects.yaml` to:
- Add more projects
- Change scan directories
- Customize verification commands
- Set project-specific options

---

**Status**: ✅ Implementation complete and tested  
**Breaking Changes**: None (backward compatible)  
**Ready to Use**: Yes

