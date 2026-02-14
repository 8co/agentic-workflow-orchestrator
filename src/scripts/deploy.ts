import { exec } from 'child_process';
import fs from 'fs/promises';

type DeploymentResult = {
  success: boolean;
  message: string;
};

const executeCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Command failed: ${stderr || error.message}`);
      } else {
        resolve(stdout);
      }
    });
  });
};

export const deploy = async (configPath: string): Promise<DeploymentResult> => {
  try {
    const configFile: Buffer = await fs.readFile(configPath);
    const config = JSON.parse(configFile.toString());

    if (!config || !config.deployScript) {
      return {
        success: false,
        message: 'Invalid configuration file',
      };
    }

    console.log('Starting deployment...');
    const result = await executeCommand(config.deployScript);
    console.log('Deployment completed: ', result);
    
    return {
      success: true,
      message: 'Deployment succeeded',
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('An error occurred during deployment:', error.message);
      return {
        success: false,
        message: `Deployment failed: ${error.message}`,
      };
    }

    return {
      success: false,
      message: 'An unknown error occurred',
    };
  }
};

(async () => {
  const result = await deploy('path/to/config.json');
  console.log('Deployment Result:', result);
})();
