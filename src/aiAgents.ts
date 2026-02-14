// AI Agent Connection
import { networkInterfaces } from 'os';

export function connectToAIAgents(): void {
  console.log("🔗 Connecting to AI agent APIs...");
  try {
    // Placeholder for real connection logic
    throw new Error("Simulation of a connection error."); // Example error for demonstration
  } catch (error: unknown) {
    if (error instanceof Error) {
      handleConnectionError(error);
    } else {
      console.error("❌ An unknown error occurred while connecting to AI agent APIs.");
    }
  }
}

function handleConnectionError(error: Error): void {
  const errorMessage = `❌ Error connecting to AI agent APIs: ${error.message}`;
  const errorStack = error.stack ? ` Stack trace: ${error.stack}` : '';
  const networkDetails = JSON.stringify(getNetworkDetails());

  console.error(`${errorMessage}\n${errorStack}\nNetwork Details: ${networkDetails}`);
}

function getNetworkDetails(): Record<string, string[]> {
  const nets = networkInterfaces();
  const results: Record<string, string[]> = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  return results;
}
