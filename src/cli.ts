#!/usr/bin/env node

/**
 * CLI Entry Point
 * Usage:
 *   npx tsx src/cli.ts run <workflow.yaml> [--var key=value]
 *   npx tsx src/cli.ts list
 *   npx tsx src/cli.ts resume <executionId>
 */

import { createWorkflowRunner } from './workflow-runner.js';
import { createPromptResolver } from './prompt-resolver.js';
import { createStateManager } from './state-manager.js';
import { createCursorAdapter } from './adapters/cursor-adapter.js';

const basePath = process.cwd();

function parseArgs(args: string[]) {
  const command = args[0];
  const positional: string[] = [];
  const vars: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--var' && i + 1 < args.length) {
      const [key, ...rest] = args[i + 1].split('=');
      vars[key] = rest.join('=');
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  return { command, positional, vars };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const { command, positional, vars } = parseArgs(args);

  const stateManager = createStateManager(basePath);
  const promptResolver = createPromptResolver(basePath);
  const cursorAdapter = createCursorAdapter();

  const runner = createWorkflowRunner({
    stateManager,
    promptResolver,
    adapters: { cursor: cursorAdapter },
    basePath,
  });

  switch (command) {
    case 'run': {
      const workflowPath = positional[0];
      if (!workflowPath) {
        console.error('❌ Usage: run <workflow.yaml> [--var key=value]');
        process.exit(1);
      }
      await runner.run(workflowPath, vars);
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
  npx tsx src/cli.ts run <workflow.yaml> [--var key=value]   Run a workflow
  npx tsx src/cli.ts list                                    List executions
  npx tsx src/cli.ts resume <executionId>                    Resume failed workflow

Examples:
  npx tsx src/cli.ts run workflows/sample.yaml
  npx tsx src/cli.ts run workflows/sample.yaml --var feature_name="auth system"
  npx tsx src/cli.ts list
`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message ?? err);
  process.exit(1);
});

