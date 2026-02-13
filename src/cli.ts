#!/usr/bin/env node

/**
 * CLI Entry Point
 * Usage:
 *   npx tsx src/cli.ts run <workflow.yaml> [--var key=value] [--agent anthropic|openai|cursor]
 *   npx tsx src/cli.ts auto <workflow.yaml> [--var key=value] [--agent openai|anthropic]
 *   npx tsx src/cli.ts list
 *   npx tsx src/cli.ts resume <executionId>
 */

import { loadConfig, validateConfig } from './config.js';
import { createWorkflowRunner } from './workflow-runner.js';
import { createPromptResolver } from './prompt-resolver.js';
import { createStateManager } from './state-manager.js';
import { createCursorAdapter } from './adapters/cursor-adapter.js';
import { createAnthropicAdapter } from './adapters/anthropic-adapter.js';
import { createOpenAIAdapter } from './adapters/openai-adapter.js';
import { createAutonomousRunner } from './autonomous-runner.js';
import { createScheduler } from './scheduler.js';
import type { AgentAdapter, AgentType } from './types.js';

const basePath = process.cwd();

function parseArgs(args: string[]) {
  const command = args[0];
  const positional: string[] = [];
  const vars: Record<string, string> = {};
  let agent: AgentType | undefined;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--var' && i + 1 < args.length) {
      const [key, ...rest] = args[i + 1].split('=');
      vars[key] = rest.join('=');
      i++;
    } else if (args[i] === '--agent' && i + 1 < args.length) {
      agent = args[i + 1] as AgentType;
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  return { command, positional, vars, agent };
}

function buildAdapters(config: ReturnType<typeof loadConfig>): Record<string, AgentAdapter> {
  const adapters: Record<string, AgentAdapter> = {
    cursor: createCursorAdapter(),
  };

  if (config.anthropic.apiKey) {
    adapters.anthropic = createAnthropicAdapter({
      apiKey: config.anthropic.apiKey,
      model: config.anthropic.model,
    });
  }

  if (config.openai.apiKey) {
    adapters.openai = createOpenAIAdapter({
      apiKey: config.openai.apiKey,
      model: config.openai.model,
    });
    // Codex uses the same OpenAI API
    adapters.codex = createOpenAIAdapter(
      { apiKey: config.openai.apiKey, model: config.openai.model },
      'codex'
    );
  }

  return adapters;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const { command, positional, vars, agent } = parseArgs(args);
  const config = loadConfig();

  const stateManager = createStateManager(basePath);
  const promptResolver = createPromptResolver(basePath);
  const adapters = buildAdapters(config);

  // If agent override provided via CLI, validate its config
  if (agent) {
    validateConfig(config, agent);
  }

  const runner = createWorkflowRunner({
    stateManager,
    promptResolver,
    adapters,
    basePath,
    defaultAgent: agent ?? config.defaultAgent,
  });

  switch (command) {
    case 'run': {
      const workflowPath = positional[0];
      if (!workflowPath) {
        console.error('❌ Usage: run <workflow.yaml> [--var key=value] [--agent anthropic|openai|cursor]');
        process.exit(1);
      }

      // Validate that the agents used in the workflow have API keys
      console.log(`🔧 Available agents: ${Object.keys(adapters).join(', ')}`);
      if (agent) {
        console.log(`🎯 Agent override: ${agent}`);
      }

      await runner.run(workflowPath, vars);
      break;
    }

    case 'auto': {
      const workflowPath = positional[0];
      if (!workflowPath) {
        console.error('❌ Usage: auto <workflow.yaml> [--var key=value] [--agent openai|anthropic]');
        process.exit(1);
      }

      const agentToUse = agent ?? config.defaultAgent;
      if (agentToUse === 'cursor') {
        console.error('❌ Autonomous mode requires a real LLM agent (openai, anthropic). Use --agent openai');
        process.exit(1);
      }

      validateConfig(config, agentToUse);

      console.log(`🔧 Available agents: ${Object.keys(adapters).join(', ')}`);
      console.log(`🎯 Agent: ${agentToUse}`);

      const autoRunner = createAutonomousRunner({
        adapters,
        defaultAgent: agentToUse,
      });

      const result = await autoRunner.run(workflowPath, basePath, vars);

      // Exit with error code if workflow failed
      if (result.status === 'failed') {
        process.exit(1);
      }
      break;
    }

    case 'next': {
      const agentToUse = agent ?? config.defaultAgent;
      if (agentToUse === 'cursor') {
        console.error('❌ Scheduler requires a real LLM agent. Use --agent openai');
        process.exit(1);
      }
      validateConfig(config, agentToUse);

      const scheduler = createScheduler({
        basePath,
        adapters,
        defaultAgent: agentToUse,
      });

      const result = await scheduler.next();
      if (result && !result.success) {
        process.exit(1);
      }
      break;
    }

    case 'schedule': {
      const mode = positional[0] ?? 'loop';
      const agentToUse = agent ?? config.defaultAgent;
      if (agentToUse === 'cursor') {
        console.error('❌ Scheduler requires a real LLM agent. Use --agent openai');
        process.exit(1);
      }
      validateConfig(config, agentToUse);

      const scheduler = createScheduler({
        basePath,
        adapters,
        defaultAgent: agentToUse,
      });

      if (mode === 'watch') {
        await scheduler.watch();
      } else {
        const results = await scheduler.loop();
        const failed = results.some((r) => !r.success);
        if (failed) process.exit(1);
      }
      break;
    }

    case 'queue': {
      const scheduler = createScheduler({
        basePath,
        adapters,
        defaultAgent: agent ?? config.defaultAgent,
      });
      await scheduler.status();
      break;
    }

    case 'list': {
      await runner.list();
      break;
    }

    case 'resume': {
      const executionId = positional[0];
      if (!executionId) {
        console.error('❌ Usage: resume <executionId>');
        process.exit(1);
      }
      await runner.resume(executionId);
      break;
    }

    default:
      console.error(`❌ Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
🤖 Agentic Workflow Orchestrator

Usage:
  npx tsx src/cli.ts run <workflow.yaml> [options]     Run a prompt workflow (output to files)
  npx tsx src/cli.ts auto <workflow.yaml> [options]    Run autonomous workflow (writes → verifies → commits)
  npx tsx src/cli.ts next [--agent openai|anthropic]   Run next pending task from queue
  npx tsx src/cli.ts schedule [loop|watch] [--agent]   Run all pending tasks (loop) or poll continuously (watch)
  npx tsx src/cli.ts queue                             Show task queue status
  npx tsx src/cli.ts list                              List workflow executions
  npx tsx src/cli.ts resume <executionId>              Resume failed workflow

Options:
  --var key=value       Override workflow variable
  --agent <name>        Override agent (anthropic|openai|codex|cursor)

Scheduler:
  next                  Pick and run one pending task from tasks/queue.yaml
  schedule loop         Run all pending tasks sequentially, then stop
  schedule watch        Run all pending, then poll for new tasks every 5 min
  queue                 Print current queue status

Agents:
  anthropic             Claude API (requires ANTHROPIC_API_KEY)
  openai                GPT API (requires OPENAI_API_KEY)
  codex                 OpenAI Codex (requires OPENAI_API_KEY)
  cursor                Local log-only mode (no API key needed, run mode only)

Examples:
  npx tsx src/cli.ts run workflows/sample.yaml --agent openai
  npx tsx src/cli.ts auto workflows/auto-sample.yaml --agent openai
  npx tsx src/cli.ts next --agent openai
  npx tsx src/cli.ts schedule loop --agent openai
  npx tsx src/cli.ts schedule watch --agent openai
  npx tsx src/cli.ts queue

Setup:
  cp .env.example .env    # Then add your API keys
  Edit tasks/queue.yaml   # Add tasks to the queue
`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message ?? err);
  process.exit(1);
});
