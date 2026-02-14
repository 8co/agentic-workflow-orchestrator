import assert from 'node:assert';
import { formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails, NetworkDetails } from '../src/aiAgents.js';
import { networkInterfaces } from 'os';
import { describe, it } from 'node:test';

describe('AI Agents Error Handling Tests', () => {

  describe('formatError', () => {
    it('should return the same error if input is an Error instance', () => {
      const error = new Error('Test error');
      const result = formatError(error);
      assert.strictEqual(result, error);
    });

    it('should return an Error object if input is a string', () => {
      const errorMessage = 'Test error string';
      const result = formatError(errorMessage);
      assert.ok(result instanceof Error);
      assert.strictEqual(result?.message, errorMessage);
    });

    it('should return null for non-error and non-string inputs', () => {
      const result = formatError(123);
      assert.strictEqual(result, null);
    });
  });

  describe('formatErrorWithDetails', () => {
    it('should format error with host and port details', () => {
      const error = new Error('Connection failed');
      const host = 'test-host';
      const port = 8080;
      const result = formatErrorWithDetails(error, host, port);
      const expectedMessage = `Host: ${host}, Port: ${port}, Error: ${error.message}`;
      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, expectedMessage);
    });
  });

  describe('handleConnectionError', () => {
    it('should log an error message with network details', () => {
      const error = new Error('Test connection error');
      const originalConsoleError = console.error;
      let loggedMessage = '';
      
      console.error = (message: string) => {
        loggedMessage = message;
      };
      
      try {
        handleConnectionError(error);
        assert.ok(loggedMessage.includes('❌ Error connecting to AI agent APIs: Test connection error'));
        assert.ok(loggedMessage.includes('Network Details:'));
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('getNetworkDetails', () => {
    it('should return network details with non-internal IPv4 addresses', () => {
      const netDetails = getNetworkDetails();
      const nets = networkInterfaces();

      const expectedDetails: NetworkDetails = {};

      for (const name of Object.keys(nets)) {
        const netInfos = nets[name];
        if (netInfos) {
          for (const net of netInfos) {
            if (net.family === 'IPv4' && !net.internal) {
              if (!expectedDetails[name]) {
                expectedDetails[name] = [];
              }
              expectedDetails[name].push(net.address);
            }
          }
        }
      }
      assert.deepStrictEqual(netDetails, expectedDetails);
    });
  });

});
