import { test } from 'node:test';
import assert from 'node:assert';
import { formatDuration } from './format-duration.js';

test('formatDuration should return "0s" for 0ms', () => {
    assert.strictEqual(formatDuration(0), '0s');
});

test('formatDuration should return "0s" for sub-second inputs', () => {
    assert.strictEqual(formatDuration(500), '0s');
    assert.strictEqual(formatDuration(999), '0s');
});

test('formatDuration should handle seconds only', () => {
    assert.strictEqual(formatDuration(1000), '1s');
    assert.strictEqual(formatDuration(30000), '30s');
    assert.strictEqual(formatDuration(59000), '59s');
});

test('formatDuration should handle minutes and seconds', () => {
    assert.strictEqual(formatDuration(60000), '1m');
    assert.strictEqual(formatDuration(61000), '1m 1s');
    assert.strictEqual(formatDuration(90000), '1m 30s');
    assert.strictEqual(formatDuration(3540000), '59m');
});

test('formatDuration should handle hours, minutes, and seconds', () => {
    assert.strictEqual(formatDuration(3600000), '1h');
    assert.strictEqual(formatDuration(3661000), '1h 1m 1s');
    assert.strictEqual(formatDuration(5400000), '1h 30m');
    assert.strictEqual(formatDuration(86399000), '23h 59m 59s');
});

test('formatDuration should return "0s" for negative input', () => {
    assert.strictEqual(formatDuration(-1000), '0s');
});

test('formatDuration should handle large values correctly', () => {
    assert.strictEqual(formatDuration(86400000), '24h');
    assert.strictEqual(formatDuration(90061000), '25h 1m 1s');
    assert.strictEqual(formatDuration(172800000), '48h');
});
