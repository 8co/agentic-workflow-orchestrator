import { strict as assert } from 'node:assert';
import test from 'node:test';
import { defaultVerifyCommands, VerifyCommand } from '../src/verify-runner.js';

test('defaultVerifyCommands returns correct set of verification commands', () => {
  // Arrange
  const expected: VerifyCommand[] = [
    {
      label: 'TypeScript Build',
      command: 'npx',
      args: ['tsc', '--noEmit'],
      optional: undefined,
    },
  ];

  // Act
  const result = defaultVerifyCommands();

  // Assert
  assert.deepEqual(result, expected);
});

test('defaultVerifyCommands handles edge cases correctly', () => {
  // No specific edge case to test as defaultVerifyCommands has fixed return; validate structure instead
  const result = defaultVerifyCommands();

  result.forEach((cmd) => {
    assert.ok(typeof cmd.label === 'string' && cmd.label.length > 0, 'Command label should be a non-empty string');
    assert.ok(typeof cmd.command === 'string' && cmd.command.length > 0, 'Command should be a non-empty string');
    assert.ok(Array.isArray(cmd.args), 'Command args should be an array');
    cmd.args.forEach(arg => {
      assert.ok(typeof arg === 'string', 'Each command argument should be a string');
    });
    assert.ok(typeof cmd.optional === 'boolean' || typeof cmd.optional === 'undefined', 'Optional should be a boolean or undefined');
  });
});
