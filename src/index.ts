/**
 * Agentic Workflow Orchestrator
 * Entry point for the orchestration system
 */

import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

export function main(): void {
  console.log('🤖 Agentic Workflow Orchestrator - Starting...');
  
  initializeOrchestrationEngine();
  loadWorkflowConfigurations();
  connectToAIAgents();
  
  console.log('✅ System initialized');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
