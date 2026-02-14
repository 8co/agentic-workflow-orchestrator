/**
 * Agentic Workflow Orchestrator
 * Entry point for the orchestration system
 */

import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`❌ Error during ${context}:`, error.message);
    console.error('Stack trace:', error.stack);
  } else {
    console.error(`❌ Error during ${context}:`, String(error));
  }
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
