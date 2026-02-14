import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, getNetworkDetails, NetworkDetails } from '../src/aiAgents.js';
import { networkInterfaces } from 'os';
import sinon from 'sinon';

// Helper function to capture console.error output
function captureConsoleError(callback: () => void): string {
  let errorOutput = '';
  const originalConsoleError = console.error;

  console.error = (message?: any, ...optionalParams: any[]) => {
    errorOutput += `${message} ${optionalParams.join(' ')}`;
  };

  try {
    callback();
  } finally {
    console.error = originalConsoleError;
  }

  return errorOutput;
}

describe('AI Agent Connection', () => {
  describe('connectToAIAgents', () => {
    it('should log connection errors with network details', () => {
      const errorOutput = captureConsoleError(() => {
        connectToAIAgents();
      });

      assert.match(errorOutput, /❌ Error connecting to AI agent APIs: Simulation of a connection error/);
      assert.match(errorOutput, /Network Details:/);
    });
  });

  describe('formatError', () => {
    it('should format Error objects correctly', () => {
      const error = new Error('Test Error');
      const formattedError = formatError(error);
      assert.strictEqual(formattedError, error);
    });

    it('should convert string errors to Error objects', () => {
      const errorString = 'Test Error String';
      const formattedError = formatError(errorString);
      assert.strictEqual(formattedError?.message, errorString);
    });

    it('should return null for unknown error types', () => {
      const formattedError = formatError({});
      assert.strictEqual(formattedError, null);
    });
  });

  describe('getNetworkDetails', () => {
    let mockedNetworkInterfaces: sinon.SinonStub;

    beforeEach(() => {
      mockedNetworkInterfaces = sinon.stub(networkInterfaces);
    });

    afterEach(() => {
      mockedNetworkInterfaces.restore();
    });

    it('should return network details with IPv4 addresses', () => {
      mockedNetworkInterfaces.returns({
        eth0: [
          { address: '192.168.1.5', family: 'IPv4', internal: false }
        ]
      });

      const networkDetails = getNetworkDetails();
      const expected: NetworkDetails = { eth0: ['192.168.1.5'] };
      assert.deepStrictEqual(networkDetails, expected);
    });

    it('should not include internal or non-IPv4 addresses', () => {
      mockedNetworkInterfaces.returns({
        eth0: [
          { address: '192.168.1.5', family: 'IPv4', internal: false },
          { address: '10.0.0.1', family: 'IPv4', internal: true }, // internal
          { address: 'fe80::1', family: 'IPv6', internal: false }, // IPv6
        ]
      });

      const networkDetails = getNetworkDetails();
      const expected: NetworkDetails = { eth0: ['192.168.1.5'] };
      assert.deepStrictEqual(networkDetails, expected);
    });

    it('should return an empty object if no networks are available', () => {
      mockedNetworkInterfaces.returns({});
      const networkDetails = getNetworkDetails();
      assert.deepStrictEqual(networkDetails, {});
    });
  });
});
