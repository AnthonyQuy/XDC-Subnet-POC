const path = require('path');
const fs = require('fs-extra');
const Web3 = require('web3');
require('dotenv').config();

// Helper function to get appropriate gas price
const getGasPrice = async (web3) => {
  try {
    const suggestedGasPrice = await web3.eth.getGasPrice();
    
    // Ensure minimum value and add safety margin
    const minGasPrice = web3.utils.toWei('10', 'gwei'); // 10 Gwei minimum
    const finalGasPrice = BigInt(suggestedGasPrice) > BigInt(minGasPrice) 
      ? suggestedGasPrice 
      : minGasPrice;
      
    console.log(`Using gas price: ${web3.utils.fromWei(finalGasPrice, 'gwei')} Gwei`);
    return finalGasPrice;
  } catch (error) {
    // Second try: Use environment variable
    if (process.env.GAS_PRICE) {
      console.log(`Using GAS_PRICE from environment: ${process.env.GAS_PRICE} wei`);
      return process.env.GAS_PRICE;
    }
    
    // Fallback: Use 10 Gwei as safe default
    return web3.utils.toWei('10', 'gwei');
  }
};

// Helper function to deploy with retry mechanism for gas price issues
const deployWithRetry = async (deployTx, account, gas, web3) => {
  // Gas price options to try (in Gwei)
  const gasPriceOptions = [10, 25, 50, 100];
  
  for (const gwei of gasPriceOptions) {
    const gasPrice = web3.utils.toWei(gwei.toString(), 'gwei');
    console.log(`Attempting deployment with ${gwei} Gwei gas price...`);
    
    try {
      return await deployTx.send({
        from: account.address,
        gas: Math.floor(gas * 1.2), // Add 20% buffer for gas estimation
        gasPrice: gasPrice
      })
      .on('transactionHash', (hash) => {
        console.log(`Transaction hash: ${hash}`);
      })
      .on('receipt', (receipt) => {
        console.log(`Contract deployed at address: ${receipt.contractAddress}`);
      });
    } catch (error) {
      if (error.message.includes('min gas price') || error.message.includes('under min')) {
        continue;
      }
      throw error; // Re-throw if it's not a gas price error
    }
  }
  
  throw new Error(`Deployment failed: All gas price options (${gasPriceOptions.join(', ')} Gwei) were rejected as too low`);
};

// Deployment script for NetworkManager contract
async function deployContract() {
  try {
    console.log('Starting deployment of NetworkManager contract...');
    
    // Connect to XDC subnet
    const subnetUrl = process.env.SUBNET_URL || 'http://192.168.25.11:8545';
    const web3 = new Web3(subnetUrl);
    
    // Load compiled contract
    const compiledPath = path.resolve(__dirname, '../compiled/NetworkManager.json');
    if (!fs.existsSync(compiledPath)) {
      console.error('Compiled contract not found! Run "npm run compile" first.');
      process.exit(1);
    }
    
    const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    
    // Get private key for deployment
    const privateKey = process.env.SUBNET_PK;
    if (!privateKey) {
      console.error('Private key not found! Set SUBNET_PK environment variable.');
      process.exit(1);
    }
    
    // Create account from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    console.log(`Deploying from address: ${account.address}`);
    
    // Get network ID
    const networkId = await web3.eth.net.getId();
    
    // Create contract instance
    const contract = new web3.eth.Contract(compiled.abi);
    
    // Deploy contract
    console.log('Deploying contract...');
    const deployTx = contract.deploy({
      data: '0x' + compiled.bytecode,
      arguments: []
    });
    
    // Estimate gas
    const gas = await deployTx.estimateGas({
      from: account.address
    });
    
    // Use the retry mechanism for deployment
    const deployedContract = await deployWithRetry(deployTx, account, gas, web3)
      .catch(error => {
        console.error('Deployment error:', error);
        process.exit(1);
      });
    
    // Save deployment info
    const deploymentPath = path.resolve(__dirname, '../deployed');
    fs.ensureDirSync(deploymentPath);
    
    const deploymentInfo = {
      contractName: 'NetworkManager',
      address: deployedContract.options.address,
      network: `xdc-subnet-${networkId}`,
      deployedAt: new Date().toISOString(),
      deployTransaction: deployedContract.transactionHash,
      abi: compiled.abi
    };
    
    fs.writeFileSync(
      path.resolve(deploymentPath, `NetworkManager-${networkId}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`Deployment information saved to ./deployed/NetworkManager-${networkId}.json`);
    console.log('Deployment completed successfully!');
    
    // Log instructions for interaction
    console.log('\nTo interact with the contract:');
    console.log('1. Use the address:', deployedContract.options.address);
    console.log('2. Connect to the subnet RPC URL:', subnetUrl);
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Execute deployment
deployContract();
