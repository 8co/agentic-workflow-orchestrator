/**
 * Agentic Workflow Orchestrator
 * Entry point for the orchestration system
 */

import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

function logError(context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

  console.error(`
  ⛔️ Error Context: ${context}
  🔍 Message: ${errorMessage}
  🖼️ Stack Trace: ${errorStack}
  `);
}

export function main(): void {
  console.log('🤖 Agentic Workflow Orchestrator - Starting...');

  try {
    initializeOrchestrationEngine();
  } catch (error) {
    logError('orchestration engine initialization', error);
    return;
  }

  try {
    loadWorkflowConfigurations();
  } catch (error) {
    logError('workflow configurations loading', error);
    return;
  }

  try {
    connectToAIAgents();
  } catch (error) {
    logError('AI agents connection', error);
    return;
  }

  console.log('✅ System initialized');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
