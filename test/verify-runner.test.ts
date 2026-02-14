import { test, describe } from 'node:test';
import assert from 'node:assert';
import { runVerification, defaultVerifyCommands, fullVerifyCommands } from '../src/verify-runner.js';

describe('runVerification', () => {
  test('all commands pass', async () => {
    const commands = [{
      label: 'Echo Test',
      command: 'echo',
      args: ['Hello, World!'],
    }];

    const result = await runVerification(commands, '.');
    assert.strictEqual(result.allPassed, true);
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].passed, true);
    assert.strictEqual(result.results[0].stdout, 'Hello, World!');
  });

  test('command fails', async () => {
    const commands = [{
      label: 'Fail Test',
      command: 'command_that_does_not_exist',
      args: [],
    }];

    const result = await runVerification(commands, '.');
    assert.strictEqual(result.allPassed, false);
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].passed, false);
    assert.strictEqual(result.results[0].exitCode, null);
  });

  test('optional command fails', async () => {
    const commands = [{
      label: 'Optional Fail Test',
      command: 'command_that_does_not_exist',
      args: [],
      optional: true,
    }];

    const result = await runVerification(commands, '.');
    assert.strictEqual(result.allPassed, true);
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].passed, false);
  });

  test('first required command fails', async () => {
    const commands = [
      {
        label: 'Fail Test 1',
        command: 'command_that_fails',
        args: [],
      },
      {
        label: 'Should Not Run',
        command: 'echo',
        args: ['Hello'],
      },
    ];

    const result = await runVerification(commands, '.');
    assert.strictEqual(result.allPassed, false);
    assert.strictEqual(result.results.length, 1);
  });
});

describe('Verification Command Sets', () => {
  test('defaultVerifyCommands', () => {
    const commands = defaultVerifyCommands();
    assert.strictEqual(commands.length, 1);
    assert.strictEqual(commands[0].label, 'TypeScript Build');
  });

  test('fullVerifyCommands', () => {
    const commands = fullVerifyCommands();
    assert.strictEqual(commands.length, 2);
    assert.strictEqual(commands[1].label, 'Tests');
    assert.strictEqual(commands[1].optional, true);
  });
});
