import { exec } from 'child_process';
import fs from 'fs/promises';

type DeploymentResult = {
  success: boolean;
  message: string;
};

type Config = {
  deployScript: string;
};

const executeCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${stderr || error.message}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

const parseConfig = (configFileContent: Buffer): Config => {
  try {
    const config: unknown = JSON.parse(configFileContent.toString());
    if (
      typeof config === 'object' &&
      config !== null &&
      'deployScript' in config &&
      typeof (config as Config).deployScript === 'string'
    ) {
      return config as Config;
    } else {
      throw new Error('Invalid configuration structure');
    }
  } catch (error) {
    throw new Error('Error parsing configuration file');
  }
};

export const deploy = async (configPath: string): Promise<DeploymentResult> => {
  try {
    const configFile: Buffer = await fs.readFile(configPath);
    const config: Config = parseConfig(configFile);

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
