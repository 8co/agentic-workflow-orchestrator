import { strict as assert } from 'node:assert';
import test from 'node:test';
import { retryAsync } from '../src/retryUtility.js';

test('retryAsync - successful operation', async () => {
  let attempt = 0;
  const operation = async () => {
    attempt++;
    if (attempt < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };

  const result = await retryAsync(operation, 5, 10);
  assert.equal(result, 'success');
  assert.equal(attempt, 3);
});

test('retryAsync - exceeds max retries', async () => {
  let throwError = () => { throw new Error('Fail'); };

  await assert.rejects(() => retryAsync(throwError, 2, 10), /Operation failed after 2 attempts: Fail/);
});

test('retryAsync - delay between retries', async () => {
  let attempt = 0;
  const timestamps: number[] = [];
  const operation = async () => {
    timestamps.push(Date.now());
    attempt++;
    if (attempt < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };

  await retryAsync(operation, 5, 100);

  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];

  assert.ok(delay1 >= 100, `First delay was only ${delay1}ms`);
  assert.ok(delay2 >= 100, `Second delay was only ${delay2}ms`);
});

test('retryAsync - operation never succeeds', async () => {
  let attempt = 0;
  const operation = async () => {
    attempt++;
    throw new Error('Always fails');
  };

  await assert.rejects(() => retryAsync(operation, 3, 10), /Operation failed after 3 attempts: Always fails/);
  assert.equal(attempt, 3);
});

test('retryAsync - delay throws on negative value', async () => {
  const operation = async () => 'success';
  
  await assert.rejects(() => retryAsync(operation, 1, -10), /Delay duration must be non-negative/);
});
