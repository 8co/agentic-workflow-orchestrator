import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const scriptPath = join(__dirname, '../src/index.js');

function executeMainScript(callback: (error: Error | null, stdout: string, stderr: string) => void): void {
  const process = spawn('node', [scriptPath]);
  
  let stdout = '';
  let stderr = '';
  
  process.stdout.on('data', (data) => {
    stdout += data;
  });

  process.stderr.on('data', (data) => {
    stderr += data;
  });

  process.on('close', (code) => {
    callback(code === 0 ? null : new Error(`Process exited with code ${code}`), stdout, stderr);
  });
}

interface FakeModules {
  initializeOrchestrationEngine?: () => void;
  loadWorkflowConfigurations?: () => void;
  connectToAIAgents?: () => void;
}

function mockModules({ initializeOrchestrationEngine, loadWorkflowConfigurations, connectToAIAgents }: FakeModules): void {
  jest.mock('../src/orchestrationEngine.js', () => ({
    initializeOrchestrationEngine: initializeOrchestrationEngine || jest.fn(() => {})
  }));
  
  jest.mock('../src/workflowConfig.js', () => ({
    loadWorkflowConfigurations: loadWorkflowConfigurations || jest.fn(() => {})
  }));
  
  jest.mock('../src/aiAgents.js', () => ({
    connectToAIAgents: connectToAIAgents || jest.fn(() => {})
  }));
}

test('runs successfully when no errors occur', (done) => {
  mockModules({});
  
  executeMainScript((error, stdout, stderr) => {
    assert.strictEqual(error, null);
    assert.ok(stdout.includes('✅ System initialized'));
    assert.strictEqual(stderr, '');
    done();
  });
});

test('handles errors in initializeOrchestrationEngine', (done) => {
  mockModules({
    initializeOrchestrationEngine: () => { throw new Error('Engine Initialization Error'); }
  });

  executeMainScript((error, stdout, stderr) => {
    assert.strictEqual(error, null);
    assert.ok(stderr.includes('❌ Error during orchestration engine initialization'));
    assert.ok(stderr.includes('Engine Initialization Error'));
    assert.ok(!stdout.includes('✅ System initialized'));
    done();
  });
});

test('handles errors in loadWorkflowConfigurations', (done) => {
  mockModules({
    loadWorkflowConfigurations: () => { throw new Error('Configuration Load Error'); }
  });

  executeMainScript((error, stdout, stderr) => {
    assert.strictEqual(error, null);
    assert.ok(stderr.includes('❌ Error during workflow configurations loading'));
    assert.ok(stderr.includes('Configuration Load Error'));
    assert.ok(!stdout.includes('✅ System initialized'));
    done();
  });
});

test('handles errors in connectToAIAgents', (done) => {
  mockModules({
    connectToAIAgents: () => { throw new Error('AI Agent Connection Error'); }
  });

  executeMainScript((error, stdout, stderr) => {
    assert.strictEqual(error, null);
    assert.ok(stderr.includes('❌ Error during AI agents connection'));
    assert.ok(stderr.includes('AI Agent Connection Error'));
    assert.ok(!stdout.includes('✅ System initialized'));
    done();
  });
});
