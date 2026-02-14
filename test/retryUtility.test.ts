import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { retryAsync } from '../src/retryUtility.js';

test('retryAsync should succeed on first attempt', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    return 'success';
  };
  const result = await retryAsync(operation, 3, 100);
  assert.equal(result, 'success');
  assert.equal(attempts, 1);
});

test('retryAsync should retry and eventually succeed', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('fail');
    }
    return 'success';
  };
  const result = await retryAsync(operation, 3, 100);
  assert.equal(result, 'success');
  assert.equal(attempts, 3);
});

test('retryAsync should fail after max retries', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    throw new Error('fail');
  };
  try {
    await retryAsync(operation, 3, 100);
    assert.fail('retryAsync did not throw expected error');
  } catch (error) {
    assert(error instanceof Error);
    assert.equal(error.message, 'Operation failed after 3 attempts: fail');
    assert.equal(attempts, 3);
  }
});

test('retryAsync should handle delay function failures', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    throw new Error('fail');
  };
  try {
    await retryAsync(operation, 3, -100);
    assert.fail('retryAsync did not throw expected error');
  } catch (error) {
    assert(error instanceof Error);
    assert.equal(error.message, 'Delay failed at attempt 1: Delay duration must be non-negative');
    assert.equal(attempts, 1);
  }
});

test('retryAsync should not retry if retries is set to 0', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    throw new Error('fail');
  };
  try {
    await retryAsync(operation, 0, 100);
    assert.fail('retryAsync did not throw expected error');
  } catch (error) {
    assert(error instanceof Error);
    assert.equal(error.message, 'Operation failed after 0 attempts: fail');
    assert.equal(attempts, 1);
  }
});
