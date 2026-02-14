// AI Agent Connection
import { networkInterfaces, NetworkInterfaceInfo } from 'os';

export function connectToAIAgents(): void {
  console.log("🔗 Connecting to AI agent APIs...");
  try {
    // Placeholder for real connection logic
    throw new Error("Simulation of a connection error."); // Example error for demonstration
  } catch (error: unknown) {
    const formattedError = formatError(error);
    if (formattedError) {
      handleConnectionError(formattedError);
    } else {
      console.error("❌ An unknown error occurred while connecting to AI agent APIs.");
    }
  }
}

export function formatError(error: unknown): Error | null {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return null;
}

export function handleConnectionError(error: Error): void {
  const errorMessage = `❌ Error connecting to AI agent APIs: ${error.message}`;
  const errorStack = error.stack ? ` Stack trace: ${error.stack}` : '';
  const networkDetails = JSON.stringify(getNetworkDetails(), null, 2);

  console.error(`${errorMessage}\n${errorStack}\nNetwork Details: ${networkDetails}`);
}

export type NetworkDetails = Record<string, string[]>;

export function getNetworkDetails(): NetworkDetails {
  const nets = networkInterfaces();
  const results: NetworkDetails = {};

  for (const name of Object.keys(nets)) {
    const netInfos = nets[name] || [];
    netInfos.forEach((net: NetworkInterfaceInfo) => {
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    });
  }
  return results;
}
