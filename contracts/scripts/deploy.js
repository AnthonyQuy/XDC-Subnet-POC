// Hardhat deployment script for NetworkManager contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment of NetworkManager contract...");

  try {
    // Get the contract factory
    const NetworkManager = await ethers.getContractFactory("NetworkManager");
    console.log("Deploying contract...");

    // Deploy contract
    const gasPrice = await ethers.provider.getFeeData()
      .then(data => data.gasPrice)
      .catch(() => {
        // Use fallback price from config if provider doesn't support it
        console.log("Using fallback gas price from config");
        return undefined; // Hardhat will use the config's gas price
      });
    
    const networkManager = await NetworkManager.deploy({
      gasPrice: gasPrice
    });

    // Wait for deployment to finish
    await networkManager.deploymentTransaction().wait();
    
    const contractAddress = await networkManager.getAddress();
    console.log(`Contract deployed at address: ${contractAddress}`);
    
    // Get network information
    const network = await ethers.provider.getNetwork();
    const networkId = network.chainId;
    
    // Save deployment information
    const fs = require("fs-extra");
    const path = require("path");
    
    // Create deployed directory if it doesn't exist
    const deployedDir = path.resolve(__dirname, "../deployed");
    fs.ensureDirSync(deployedDir);
    
    // Read ABI from artifacts
    const artifact = await hre.artifacts.readArtifact("NetworkManager");
    
    // Save deployment info
    const deploymentInfo = {
      contractName: "NetworkManager",
      address: contractAddress,
      network: `xdc-subnet-${networkId}`,
      deployedAt: new Date().toISOString(),
      deployTransaction: networkManager.deploymentTransaction().hash,
      abi: artifact.abi
    };
    
    const deploymentPath = path.join(deployedDir, `NetworkManager-${networkId}.json`);
    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`Deployment information saved to ./deployed/NetworkManager-${networkId}.json`);
    console.log("Deployment completed successfully!");
    
    // Log instructions for interaction
    console.log("\nTo interact with the contract:");
    console.log("1. Use the address:", contractAddress);
    console.log("2. Connect to the subnet RPC URL:", process.env.SUBNET_URL || "http://192.168.25.11:8545");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
