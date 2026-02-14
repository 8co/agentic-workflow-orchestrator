import assert from 'node:assert';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, '../src/cli.ts');

function runCLI(args: string[]): Promise<{ stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(`npx tsx ${cliPath} ${args.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        reject({ stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

process.env.NODE_ENV = 'test';

async function testCLI() {

  // Test 'list' command
  try {
    const { stdout: listOutput, stderr: listError } = await runCLI(['list']);
    assert.strictEqual(listError, '');
    assert.match(listOutput, /List workflow executions/);
  } catch (error) {
    assert.fail(`'list' command test failed: ${error}`);
  }

  // Test 'resume' command with missing executionId
  try {
    const { stderr: resumeError } = await runCLI(['resume']);
    assert.match(resumeError, /Usage: resume <executionId>/);
  } catch (error) {
    assert.fail(`'resume' command with missing executionId test failed: ${error}`);
  }

  // Test 'run' command with missing workflow.yaml
  try {
    const { stderr: runError } = await runCLI(['run']);
    assert.match(runError, /Usage: run <workflow.yaml>/);
  } catch (error) {
    assert.fail(`'run' command with missing workflow.yaml test failed: ${error}`);
  }

  // Test 'auto' command with missing workflow.yaml
  try {
    const { stderr: autoError } = await runCLI(['auto']);
    assert.match(autoError, /Usage: auto <workflow.yaml>/);
  } catch (error) {
    assert.fail(`'auto' command with missing workflow.yaml test failed: ${error}`);
  }

  // Add more tests for other commands and scenarios here...

}

testCLI().then(() => {
  console.log('All tests passed.');
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
