import { ethers } from 'ethers';
import * as fs from 'fs-extra';

type NetworkConfig = {
  url: string;
  accounts: string[];
};

type DeployConfig = {
  contractName: string;
  artifactPath: string;
};

const loadConfig = (): { networks: Record<string, NetworkConfig>, deploys: DeployConfig[] } => {
  return JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
};

const connectToNetwork = (networkConfig: NetworkConfig): ethers.providers.JsonRpcProvider => {
  return new ethers.providers.JsonRpcProvider(networkConfig.url, {
    chainId: 1,
    name: 'mainnet'
  });
};

const getWallet = (provider: ethers.providers.JsonRpcProvider, accountKey: string): ethers.Wallet => {
  return new ethers.Wallet(accountKey, provider);
};

const deployContract = async (
  contractName: string,
  artifactPath: string,
  wallet: ethers.Wallet,
) => {
  const artifact = fs.readJSONSync(artifactPath);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log(`Deploying ${contractName}...`);
  const contract = await factory.deploy();

  await contract.deployed();
  console.log(`${contractName} deployed at ${contract.address}`);

  return contract;
};

export const main = async () => {
  const { networks, deploys } = loadConfig();

  for (const [networkName, networkConfig] of Object.entries(networks)) {
    const provider = connectToNetwork(networkConfig);
    const deployments: Promise<ethers.Contract>[] = [];

    for (const deployConfig of deploys) {
      const wallet = getWallet(provider, networkConfig.accounts[0]);
      const deployment = deployContract(deployConfig.contractName, deployConfig.artifactPath, wallet);
      deployments.push(deployment);
    }

    await Promise.all(deployments);
    console.log(`All contracts deployed on ${networkName}`);
  }
};

main().catch(error => {
  console.error('Error deploying contracts:', error);
  process.exit(1);
});
