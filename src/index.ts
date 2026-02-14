/**
 * Agentic Workflow Orchestrator
 * Entry point for the orchestration system
 */

import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

interface ErrorDetails {
  context: string;
  error: unknown;
}

function logError({ context, error }: ErrorDetails): void {
  const errorMessage: string = error instanceof Error ? error.message : String(error);
  const errorStack: string = error instanceof Error ? error.stack ?? 'No stack trace available' : 'No stack trace available';
  const timestamp: string = new Date().toISOString();

  console.error(`
  ⛔️ [${timestamp}] Error Context: ${context}
  🔍 Message: ${errorMessage}
  🖼️ Stack Trace: ${errorStack}
  `);
}

function terminateProcess(): void {
  console.error('🔥 Critical initialization failure. Terminating process.');
  process.exit(1);
}

export function main(): void {
  console.log('🤖 Agentic Workflow Orchestrator - Starting...');
  let criticalFailure: boolean = false;

  const tryInitialize = (task: () => void, context: string): void => {
    try {
      task();
    } catch (error) {
      logError({ context, error });
      criticalFailure = true;
    }
  };

  tryInitialize(initializeOrchestrationEngine, 'orchestration engine initialization');

  if (!criticalFailure) {
    tryInitialize(loadWorkflowConfigurations, 'workflow configurations loading');
  }

  if (!criticalFailure) {
    tryInitialize(connectToAIAgents, 'AI agents connection');
  }

  if (criticalFailure) {
    terminateProcess();
  } else {
    console.log('✅ System initialized');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
