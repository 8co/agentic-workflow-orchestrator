# AGENTS.MD - Global Agent Instructions

## System

- **Machine:** MacBook Pro, Apple Silicon (arm64)
- **OS:** macOS 14.6 (Sonoma)
- **Shell:** zsh
- **Node.js:** v20.19.4
- **npm:** 10.8.2
- **Editor:** Cursor IDE
- **Models:** Claude Opus 4.6, GPT Codex 5.3

## Owner

- **GitHub:** github.com/8co
- **Working Directory:** /Users/8con/documents-non-icloud/

## Active Projects

### athlete-mono-app (Primary)

Full-stack web application for athlete/coach/team management.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (`apps/web/`)
- **Backend:** AWS Lambda handlers in TypeScript (`infra/src/handlers/`)
- **Infrastructure:** SST v2 (`infra/`) migrating to SST v3 (`infra-v3/`)
- **Database:** DynamoDB single-table design (`MainDatabase`)
- **Auth:** AWS Cognito (JWT tokens)
- **Local Dev:** Express.js API (`local/local-api/`) + LocalStack DynamoDB
- **Storage:** S3 (profile images, videos, receipts)
- **Email:** AWS SES
- **Payments:** Stripe Connect
- **Domain:** playeraid.org (app.playeraid.org / dev.playeraid.org)
- **Docs:** `docs/` folder with implementation plans and architecture decisions

### athlete-mobile

React Native / Expo mobile app for PlayerAid.

- **Stack:** React Native, Expo, TypeScript
- **Design System:** `docs/design-system/PLAYERAID_V2_DESIGN.md`

### agentic-workflow-orchestrator

Autonomous AI agent system for continuous development.

- **Stack:** TypeScript, Node.js, AWS Lambda (planned)
- **Repo:** github.com/8co/agentic-workflow-orchestrator

## Conventions

### Code Style

- TypeScript strict mode, always
- ES2022+ syntax (async/await, optional chaining, nullish coalescing)
- Functional over class-based unless state management requires it
- No default exports — use named exports
- Error handling: try/catch with typed errors, never swallow silently

### Naming

- Files: kebab-case (`managed-players.ts`)
- Functions/variables: camelCase
- Types/interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE
- Database keys: `ENTITY#id` pattern (e.g. `USER#123`, `ACCOUNT#abc`)

### API Patterns

- REST over HTTPS with standard HTTP methods
- Lambda handlers: one exported `handler` per file, internal routing by path/method
- Response format: `{ success: boolean, data?: any, error?: string }`
- Auth: JWT in Authorization header, extract userId via `extractUserId()`
- Local dev mirrors Lambda logic via Express routes

### Database Patterns

- DynamoDB single-table design with pk/sk composite keys
- GSI indexes (gsi1pk-gsi4pk) for alternate access patterns
- Transactions for atomic multi-record operations
- Condition expressions for idempotency and race condition prevention

### Infrastructure

- SST for infrastructure-as-code
- Each Lambda gets explicit IAM permissions (least privilege)
- Environment variables for configuration, SSM Parameter Store for secrets
- Stages: local → dev → production

## Rules for Agents

1. **Read before writing.** Explore relevant files and docs before making changes.
2. **Match existing patterns.** Look at how similar things are already done in the codebase.
3. **Don't create documentation unless asked.** No README.md, no CHANGELOG, no markdown files unless explicitly requested.
4. **Commit messages are imperative.** "Add feature" not "Added feature" or "Adding feature".
5. **Test locally first.** Use the local API and local DynamoDB before touching cloud resources.
6. **Keep it simple.** One model setting, one approach. Don't over-engineer.
7. **CLI first.** When building new capabilities, start with a CLI that can verify output directly.
8. **Write docs to docs/.** When asked to document, write to the project's docs/ folder. Let the model pick the filename.
9. **Short prompts work.** Don't pad responses. Be direct.
10. **When stuck, read more code.** Don't guess — search the codebase.

