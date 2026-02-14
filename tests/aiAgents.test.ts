import { test } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, getNetworkDetails, NetworkDetails } from '../src/aiAgents.js';
import { networkInterfaces } from 'os';

test('connectToAIAgents should log connection errors correctly', () => {
  const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
  const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

  connectToAIAgents();

  assert(consoleLogMock.mock.calls[0][0] === "🔗 Connecting to AI agent APIs...");
  assert(consoleErrorMock.mock.calls.length > 0);
  assert(consoleErrorMock.mock.calls[0][0].includes("❌ Error connecting to AI agent APIs: Simulation of a connection error."));

  consoleErrorMock.mockRestore();
  consoleLogMock.mockRestore();
});

test('formatError should correctly format known errors and return null for unknown types', () => {
  const errorInstance = new Error('Test Error');
  const formattedError = formatError(errorInstance);
  
  assert(formattedError instanceof Error);
  assert.strictEqual(formattedError?.message, 'Test Error');

  const stringError = formatError('String Error');
  assert(stringError instanceof Error);
  assert.strictEqual(stringError?.message, 'String Error');

  const unknownError = formatError(123);
  assert.strictEqual(unknownError, null);
});

test('getNetworkDetails should return non-internal IPv4 interfaces', () => {
  const originalNetworkInterfaces = networkInterfaces;
  const mockNetworkInterfaces = jest.fn(() => ({
    eth0: [{ family: 'IPv4', internal: false, address: '192.168.1.1', cidr: null, mac: '', netmask: '', scopeid: 0 }],
    lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1', cidr: null, mac: '', netmask: '', scopeid: 0 }]
  }));
  jest.spyOn(os, 'networkInterfaces').mockImplementation(mockNetworkInterfaces);

  const networkDetails: NetworkDetails = getNetworkDetails();
  assert.deepStrictEqual(networkDetails, { eth0: ['192.168.1.1'] });

  jest.mocked(networkInterfaces).mockRestore();
});
