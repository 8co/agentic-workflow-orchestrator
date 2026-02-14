/**
 * Agentic Workflow Orchestrator
 * Entry point for the orchestration system
 */

import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

export function main(): void {
  console.log('🤖 Agentic Workflow Orchestrator - Starting...');

  try {
    initializeOrchestrationEngine();
  } catch (error) {
    console.error('❌ Error during orchestration engine initialization:', error instanceof Error ? error.message : String(error));
    return;
  }

  try {
    loadWorkflowConfigurations();
  } catch (error) {
    console.error('❌ Error during workflow configurations loading:', error instanceof Error ? error.message : String(error));
    return;
  }

  try {
    connectToAIAgents();
  } catch (error) {
    console.error('❌ Error during AI agents connection:', error instanceof Error ? error.message : String(error));
    return;
  }

  console.log('✅ System initialized');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
