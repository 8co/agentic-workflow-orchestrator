import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from '../src/format-duration.js';

test('formatDuration: edge case with 0 milliseconds', () => {
  assert.equal(formatDuration(0), '0s');
});

test('formatDuration: edge case with negative milliseconds', () => {
  assert.equal(formatDuration(-1000), '0s');
});

test('formatDuration: less than 1 second', () => {
  assert.equal(formatDuration(500), '0s');
});

test('formatDuration: exactly 1 second', () => {
  assert.equal(formatDuration(1000), '1s');
});

test('formatDuration: less than 1 minute but more than a second', () => {
  assert.equal(formatDuration(45000), '45s');
});

test('formatDuration: exactly 1 minute', () => {
  assert.equal(formatDuration(60000), '1m 0s');
});

test('formatDuration: 1 minute and some seconds', () => {
  assert.equal(formatDuration(75000), '1m 15s');
});

test('formatDuration: exactly 1 hour', () => {
  assert.equal(formatDuration(3600000), '1h 0m');
});

test('formatDuration: 1 hour and some minutes, no seconds', () => {
  assert.equal(formatDuration(3660000), '1h 1m');
});

test('formatDuration: 1 hour, 1 minute and some seconds', () => {
  assert.equal(formatDuration(3665000), '1h 1m 5s');
});

test('formatDuration: large duration of multiple hours', () => {
  assert.equal(formatDuration(73220000), '20h 20m 20s');
});

test('formatDuration: less than 1 hour but more than a few minutes', () => {
  assert.equal(formatDuration(3599000), '59m 59s');
});

test('formatDuration: large milliseconds exactly on boundaries', () => {
  assert.equal(formatDuration(86400000), '24h 0m 0s'); // exactly one day
});

test('formatDuration: rounding boundaries for seconds', () => {
  assert.equal(formatDuration(1000 * 120 + 999), '2m 0s'); // 2 minutes exactly
});
