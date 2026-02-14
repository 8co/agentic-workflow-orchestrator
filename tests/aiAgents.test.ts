import { connectToAIAgents } from '../src/aiAgents.js';
import assert from 'node:assert';
import { test } from 'node:test';
import { createServer, Server } from 'net';

test('connectToAIAgents should retry on failure and eventually succeed', (t) => {
  let server: Server | undefined;

  const startTestServer = (port: number, shouldFailFirstTime: boolean) => {
    let firstAttempt = !shouldFailFirstTime;
    server = createServer((socket) => {
      if (firstAttempt) {
        socket.destroy();
      } else {
        socket.end();
      }
      firstAttempt = false;
    }).listen(port);
  };

  t.test('succeed after retry', (t) => {
    const aiAgentPort = 444;
    startTestServer(aiAgentPort, true);

    try {
      connectToAIAgents();
      assert.ok(true, "connectToAIAgents should succeed after retry");
    } catch (error) {
      assert.fail(`Unexpected error: ${error}`);
    } finally {
      server?.close();
    }
  });

  t.test('fail without retry when network permission is denied', (t) => {
    let originalAccessSync: typeof import('fs').accessSync;
    originalAccessSync = import('fs').accessSync;

    // Override the function to simulate permission error
    import('fs').accessSync = () => {
      throw new Error("Permission denied");
    };

    try {
      let didThrow = false;
      try {
        connectToAIAgents();
      } catch (error) {
        didThrow = true;
        assert.strictEqual(error.message, "Network permission error: Permission denied");
      }
      assert.ok(didThrow, "connectToAIAgents should fail due to permission issue");
    } finally {
      import('fs').accessSync = originalAccessSync; // Restore original function
    }
  });

  t.test('logs appropriate errors on timeout', (t) => {
    let originalConsoleLog = console.log;
    let logOutput = '';

    console.log = (message: string, ...optionalParams: any[]) => {
      logOutput += message + ' ' + optionalParams.join(' ');
    };

    const aiAgentPort = 445;
    startTestServer(aiAgentPort, false);

    const currentLogOutput = logOutput;
    connectToAIAgents();
    assert.ok(logOutput.includes('Connection timed out'), "A timeout message should be logged");

    console.log = originalConsoleLog; // Restore original console.log
  });

});
