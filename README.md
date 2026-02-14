# Agentic Workflow Orchestrator

An autonomous AI agent system that enables continuous software development through LLM-driven code generation, verification, and self-correction in a closed loop.

The system proposes its own development tasks, generates code through LLM adapters, writes files, runs verification (TypeScript compilation, security scanning), feeds errors back to the LLM for self-correction, and commits verified changes — all without human intervention.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         CLI                             │
│  run · auto · schedule · propose · autopilot · queue    │
└─────────────┬───────────────────────────────┬───────────┘
              │                               │
     ┌────────▼────────┐            ┌─────────▼──────────┐
     │   Scheduler      │            │  Task Proposer     │
     │  next/loop/watch │            │  + Self-Review     │
     └────────┬─────────┘            └─────────┬──────────┘
              │                                │
     ┌────────▼────────────────────────────────▼──────────┐
     │                 Task Queue (YAML)                   │
     └────────────────────┬───────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Autonomous Runner    │
              │                       │
              │  ┌──────────────────┐ │
              │  │ 1. Resolve Prompt│ │
              │  │ 2. Call LLM      │ │
              │  │ 3. Write Files   │ │
              │  │ 4. Verify Code   │◄├─── Error Feedback Loop
              │  │ 5. Git Commit    │ │
              │  └──────────────────┘ │
              └───────────┬───────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Anthropic │    │  OpenAI  │    │  Cursor  │
   │  Adapter  │    │  Adapter │    │  Adapter │
   └──────────┘    └──────────┘    └──────────┘
```

### Core Loop

1. **Task Proposer** scans the codebase and asks an LLM to propose new tasks, then self-reviews them for quality and safety before adding to the queue
2. **Scheduler** pulls tasks from the YAML queue and dispatches them to the autonomous runner
3. **Autonomous Runner** resolves prompt templates, calls the LLM, writes generated code to disk, and runs verification
4. **Verification** compiles TypeScript, runs security scanning, and captures errors
5. **Error Feedback** — if verification fails, errors are fed back to the LLM for self-correction (up to N retries)
6. **Git Operations** — verified code is committed on a feature branch, optionally auto-merged to main

### Safety & Security

- **Security Scanner** — static analysis blocks dangerous patterns (`eval()`, `exec()`, `rm -rf`, infinite loops) at three severity levels
- **Protected Files** — file writer enforces a protected file list that the LLM cannot overwrite
- **Self-Review** — proposed tasks are reviewed by the LLM itself before being queued
- **Auto-Rollback** — checkpoint-based rollback system reverts failed changes automatically
- **Budget Manager** — tracks API spending with configurable daily limits

### Observability

- Real-time memory, CPU, and disk metrics
- Web dashboard with Chart.js visualization
- Metrics export with trend analysis
- CLI commands for job monitoring and log inspection

## Quick Start

```bash
# Install dependencies
npm install

# Configure API keys
cp .env.example .env
# Edit .env with your Anthropic and/or OpenAI API keys

# Run a single workflow
npm run cli -- run workflows/sample.yaml

# Run one task from the queue
npm run cli -- next

# Run all queued tasks
npm run cli -- schedule --mode loop

# Propose new tasks autonomously
npm run cli -- propose

# Full autopilot (propose + execute in a loop)
npm run cli -- autopilot

# Launch the monitoring dashboard
npm run dashboard
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `run <workflow>` | Execute a YAML workflow file |
| `auto <prompt>` | One-shot autonomous task |
| `next` | Run the next pending task from the queue |
| `schedule` | Run tasks with `--mode next\|loop\|watch` |
| `propose` | Scan codebase and propose new tasks |
| `autopilot` | Continuous propose-and-execute loop |
| `queue` | Inspect and manage the task queue |
| `list` | List available workflows |
| `projects` | Manage multi-project targets |

## Project Structure

```
src/
├── adapters/              # LLM provider adapters
│   ├── anthropic-adapter.ts
│   ├── openai-adapter.ts
│   └── cursor-adapter.ts
├── autonomous-runner.ts   # Closed-loop code generation
├── scheduler.ts           # Task execution orchestrator
├── task-proposer.ts       # Autonomous task proposal + self-review
├── queue-manager.ts       # YAML task queue management
├── cli.ts                 # CLI entry point
├── workflow-runner.ts     # Step-based workflow engine
├── prompt-resolver.ts     # Template variable injection
├── file-writer.ts         # LLM output → disk with protection
├── verify-runner.ts       # Build/test/security verification
├── git-ops.ts             # Git branch/commit/revert operations
├── security-scanner.ts    # Static analysis for dangerous patterns
├── auto-merge.ts          # Safe branch merging with health checks
├── rollback-manager.ts    # Checkpoint-based rollback system
├── budget-manager.ts      # API spending tracker
├── observabilityUtil.ts   # System metrics collection
├── metrics-export.ts      # Metrics persistence and analysis
├── dashboard-server.ts    # Web dashboard server
└── scheduled-autopilot.ts # Cron-compatible autopilot wrapper
prompts/                   # Prompt templates for autonomous tasks
workflows/                 # Example YAML workflow definitions
tasks/queue.yaml           # Task queue
docs/                      # Architecture and usage documentation
```

## Stack

- **Runtime:** Node.js with TypeScript (strict mode, ES2022)
- **LLMs:** Anthropic Claude, OpenAI GPT, Cursor (adapter pattern)
- **Infrastructure:** AWS Lambda (planned), DynamoDB, S3, EventBridge
- **IaC:** SST
- **Visualization:** Chart.js

## License

MIT
