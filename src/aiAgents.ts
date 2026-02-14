// AI Agent Connection
import { networkInterfaces, NetworkInterfaceInfo } from 'os';
import { createConnection, Socket, TcpSocketConnectOpts } from 'net';

export function connectToAIAgents(): void {
  logConnectionEvent('info', "Initiating connection to AI agent APIs...", {});

  try {
    const aiAgentHost: string = 'ai-agent-api.example.com';
    const aiAgentPort: number = 443;

    const connectionOptions: TcpSocketConnectOpts = {
      host: aiAgentHost,
      port: aiAgentPort,
    };

    const socket: Socket = createConnection(connectionOptions, (): void => {
      logConnectionEvent('success', 'Successfully connected to AI agent APIs.', { host: aiAgentHost, port: aiAgentPort });
      socket.end();
    });

    socket.on('error', (error: Error): void => {
      const formattedError: Error = formatErrorWithDetails(error, aiAgentHost, aiAgentPort);
      handleConnectionError(formattedError);
    });

    socket.on('timeout', (): void => {
      const timeoutError: Error = new Error(`Connection timed out to Host: ${aiAgentHost}, Port: ${aiAgentPort}`);
      handleConnectionError(timeoutError);
      socket.end();
    });

    socket.on('close', (hadError: boolean): void => {
      if (!hadError) {
        logConnectionEvent('info', 'Connection closed gracefully.', { host: aiAgentHost, port: aiAgentPort });
      }
    });

  } catch (error: unknown) {
    const formattedError: Error = formatError(error) || new Error("An unknown error occurred while initiating connection.");
    handleConnectionError(formattedError);
  }
}

function logConnectionEvent(level: 'info' | 'success' | 'error', message: string, context: Record<string, unknown>): void {
  const timestamp: string = new Date().toISOString();
  const networkDetails: string = JSON.stringify(getNetworkDetails(), null, 2);
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message} Context:`, context, 'Network Details:', networkDetails);
}

export function formatError(error: unknown): Error | null {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return null;
}

export function formatErrorWithDetails(error: Error, host: string, port: number): Error {
  const detailedMessage: string = `Host: ${host}, Port: ${port}, Error: ${error.message}`;
  return new Error(detailedMessage);
}

export function handleConnectionError(error: Error): void {
  const errorMessage: string = `Error connecting to AI agent APIs: ${error.message}`;
  const errorStack: string = error.stack ? ` Stack trace: ${error.stack}` : '';
  logConnectionEvent('error', errorMessage, { stack: errorStack });
}

export type NetworkDetails = Record<string, string[]>;

export function getNetworkDetails(): NetworkDetails {
  const nets: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces();
  const results: NetworkDetails = {};

  for (const name of Object.keys(nets)) {
    const netInfos: NetworkInterfaceInfo[] | undefined = nets[name];
    if (netInfos) {
      netInfos.forEach((net: NetworkInterfaceInfo): void => {
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      });
    }
  }
  return results;
}
