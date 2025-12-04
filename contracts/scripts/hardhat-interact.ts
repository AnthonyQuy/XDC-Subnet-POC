import hre from "hardhat"
import "hardhat/config";
import "@nomicfoundation/hardhat-viem";

import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { hexToString, type Address, type Hex, type GetContractReturnType, type PublicClient, type WalletClient } from "viem";
import type { NodeMember, NodeMemberDisplay } from "../types/NetworkManager.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interact with the NetworkManager contract using Hardhat + Viem
 * 
 * Usage (via environment variables):
 *   COMMAND=commandName [ARGS=arg1|arg2|...] npx hardhat run scripts/hardhat-interact.ts --network subnet
 * 
 * Examples:
 *   COMMAND=getAllMembers npx hardhat run scripts/hardhat-interact.ts --network subnet
 *   COMMAND=getMember ARGS=0x123... npx hardhat run scripts/hardhat-interact.ts --network subnet
 *   COMMAND=addMember ARGS=0x123...|NodeName|pubkey|1001|1|host|30303 npx hardhat run scripts/hardhat-interact.ts --network subnet
 * 
 * Commands:
 *  - getManager: Get the current manager address
 *  - addMember: Add a new member (args: address|x500Name|publicKey|serial|platformVersion|host|port)
 *  - removeMember: Remove a member (args: address)
 *  - getMember: Get member details (args: address)
 *  - getAllMembers: List all member addresses
 *  - updateStatus: Update member status (args: address|isActive)
 *  - updateDetails: Update member details (args: address|x500Name|publicKey|serial|platformVersion|host|port)
 *  - transferManager: Transfer manager role to new address (args: newManagerAddress)
 *  - isMember: Check if an address is a member (args: address)
 *  - updateSubnetMemberDetail: Update subnet details (args: address|serial|platformVersion|host|port)
 *  - help: Display this help message
 */

// Define valid commands
const validCommands = [
  "getManager",
  "addMember",
  "removeMember",
  "getMember",
  "getAllMembers",
  "updateStatus",
  "updateDetails",
  "transferManager",
  "isMember",
  "updateSubnetMemberDetail",
  "help"
] as const;

type Command = typeof validCommands[number];

// Process arguments - check environment variable first, then fall back to process.argv
let command: string = process.env.COMMAND || "help";
let args: string[] = [];

// If command came from environment variable, read args from environment as well
if (process.env.COMMAND) {
  // Parse pipe-separated arguments from ARGS environment variable (using | to avoid conflicts with commas in X500 names)
  if (process.env.ARGS) {
    args = process.env.ARGS.split('|').map(arg => arg.trim());
  }
} else {
  // Fall back to command-line arguments
  const processArgs = process.argv;
  // Look for any valid command in the arguments
  for (let i = 0; i < processArgs.length; i++) {
    const arg = processArgs[i];
    if (validCommands.includes(arg as Command)) {
      command = arg;
      args = processArgs.slice(i + 1);
      break;
    }
  }
}

async function main() {
  try {
    // Find latest deployment from ignition/deployments directory
    const ignitionDeploymentsDir = path.resolve(__dirname, "../ignition/deployments");
    if (!fs.existsSync(ignitionDeploymentsDir)) {
      console.error("Ignition deployments directory not found! Deploy contract first using Hardhat Ignition.");
      process.exit(1);
    }

    // Find all chain directories
    const chainDirs = fs.readdirSync(ignitionDeploymentsDir)
      .filter(f => fs.statSync(path.join(ignitionDeploymentsDir, f)).isDirectory())
      .filter(f => f.startsWith("chain-"));

    if (chainDirs.length === 0) {
      console.error("No chain deployments found! Deploy contract first.");
      process.exit(1);
    }

    // Sort by modified time (newest first)
    const sortedChainDirs = chainDirs.map(dir => ({
      name: dir,
      time: fs.statSync(path.join(ignitionDeploymentsDir, dir)).mtime.getTime()
    }))
      .sort((a, b) => b.time - a.time);

    const latestChainDir = path.join(ignitionDeploymentsDir, sortedChainDirs[0].name);
    
    // Read deployed addresses
    const deployedAddressesPath = path.join(latestChainDir, "deployed_addresses.json");
    if (!fs.existsSync(deployedAddressesPath)) {
      console.error("deployed_addresses.json not found in deployment directory!");
      process.exit(1);
    }

    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
    
    // Find NetworkManager contract address
    const networkManagerKey = Object.keys(deployedAddresses).find(key => key.includes("NetworkManager"));
    if (!networkManagerKey) {
      console.error("NetworkManager contract not found in deployment!");
      process.exit(1);
    }

    const contractAddress = deployedAddresses[networkManagerKey];

    console.log(`✓ Found NetworkManager at address: ${contractAddress}`);

    // Read contract ABI from artifacts
    const artifactsPath = path.join(latestChainDir, "artifacts", `${networkManagerKey}.json`);
    if (!fs.existsSync(artifactsPath)) {
      console.error("Contract artifact not found!");
      process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
    
    const deployment = {
      address: contractAddress,
      abi: artifact.abi
    };
    
    console.log(`✓ Loaded deployment from ${latestChainDir}`);
    console.log(`✓ Chain: ${sortedChainDirs[0].name}`);
    
    const { createPublicClient, createWalletClient, http, getContract } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    
    const rpcUrl = process.env.SUBNET_URL || "http://192.168.25.11:8545";
    const privateKey = process.env.SUBNET_PK || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    
    const publicClient = createPublicClient({
      transport: http(rpcUrl)
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      transport: http(rpcUrl)
    });

    type NetworkManagerContract = GetContractReturnType<
      typeof deployment.abi,
      { public: PublicClient; wallet: WalletClient },
      Address
    >;

    const networkManager: NetworkManagerContract = getContract({
      address: deployment.address as Address,
      abi: deployment.abi,
      client: { public: publicClient, wallet: walletClient }
    });

    console.log(`\nInteracting with NetworkManager at address: ${deployment.address}\n`);

    // Process command
    switch (command) {
      case "getManager":
        const manager = await networkManager.read.owner([]) as Address;
        console.log(`Current manager: ${manager}`);
        break;

      case "addMember":
        if (args.length < 7) {
          console.error("Usage: COMMAND=addMember ARGS=address|x500Name|certSerialHex|platformVersion|host|port npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address, x500Name, certSerialHex, platformVersion, host, port");
          process.exit(1);
        }

        const [memberAddress, x500Name, certSerialHex, platformVersion, host, port] = args;

        const addHash = await networkManager.write.addMember(
          [
            memberAddress as Address,
            x500Name,
            certSerialHex as Hex,
            parseInt(platformVersion),
            host,
            parseInt(port)
          ],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: addHash });

        console.log(`Member added successfully`);
        break;

      case "removeMember":
        if (args.length < 1) {
          console.error("Usage: COMMAND=removeMember ARGS=address npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        const removeHash = await networkManager.write.removeMember(
          [args[0] as Address],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: removeHash });

        console.log(`Member removed successfully`);
        break;

      case "getMember":
        console.log("getMember called with address:", args[0]);
        if (args.length < 1) {
          console.error("Usage: COMMAND=getMember ARGS=address npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        const getMemberAddress = args[0].trim() as Address;

        const members = await networkManager.read.getAllMembers([]) as Address[];
        console.log("Current members in the network:", members);

        console.log(`Fetching details for member: ${getMemberAddress}`);
        const member = await networkManager.read.getMember([getMemberAddress]) as NodeMember;

        // Convert bigints to numbers for display
        const memberDisplay: NodeMemberDisplay = {
          x500Name: member.x500Name,
          memberAddress: member.memberAddress,
          certSerialHex: member.certSerialHex,
          isActive: member.isActive,
          joinedAt: Number(member.joinedAt),
          lastUpdated: Number(member.lastUpdated),
          platformVersion: member.platformVersion,
          host: member.host,
          port: member.port,
        };

        let certSerialDisplay: string;
        try {
          certSerialDisplay = member.certSerialHex ? hexToString(member.certSerialHex).replace(/\0/g, "") : "(empty)";
        } catch (error) {
          certSerialDisplay = `(hex) ${member.certSerialHex}`;
        }

        console.log("Member details:");
        console.log(JSON.stringify(memberDisplay, null, 2));
        console.log(`Certificate Serial (decoded): ${certSerialDisplay}`);
        break;

      case "getAllMembers":
        console.log("Fetching all member addresses...");
        const memberAddresses = await networkManager.read.getAllMembers([]) as Address[];
        console.log("All members:", memberAddresses);
        console.log(`Total member count: ${memberAddresses.length}`);
        break;

      case "updateStatus":
        if (args.length < 2) {
          console.error("Usage: COMMAND=updateStatus ARGS=address|isActive npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address, isActive (true/false)");
          process.exit(1);
        }

        const isActive = args[1].toLowerCase() === "true";

        const statusHash = await networkManager.write.updateMemberStatus(
          [args[0] as Address, isActive],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: statusHash });

        console.log(`Member status updated successfully`);
        break;

      case "updateDetails":
        if (args.length < 6) {
          console.error("Usage: COMMAND=updateDetails ARGS=address|x500Name|certSerialHex|platformVersion|host|port npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address, x500Name, certSerialHex, platformVersion, host, port");
          process.exit(1);
        }

        const [updateAddress, updateName, updateCertSerial, updatePlatformVersion, updateHost, updatePort] = args;

        const updateHash = await networkManager.write.updateMemberDetails(
          [
            updateAddress as Address,
            updateName,
            updateCertSerial as Hex,
            parseInt(updatePlatformVersion),
            updateHost,
            parseInt(updatePort)
          ],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: updateHash });

        console.log(`Member details updated successfully`);
        break;

      case "transferManager":
        if (args.length < 1) {
          console.error("Usage: COMMAND=transferManager ARGS=newManagerAddress npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: newManagerAddress");
          process.exit(1);
        }

        // Note: Using transferOwnership() instead of transferManagerRole() as per the Ownable contract
        const transferHash = await networkManager.write.transferOwnership(
          [args[0] as Address],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: transferHash });

        console.log(`Manager role transferred successfully`);
        break;

      case "isMember":
        if (args.length < 1) {
          console.error("Usage: COMMAND=isMember ARGS=address npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        const isMember = await networkManager.read.isMember([args[0] as Address]) as boolean;
        console.log(`Address ${args[0]} is${isMember ? "" : " not"} a member.`);
        break;

      case "updateSubnetMemberDetail":
        if (args.length < 4) {
          console.error("Usage: COMMAND=updateSubnetMemberDetail ARGS=address|platformVersion|host|port npx hardhat run scripts/hardhat-interact.ts --network subnet");
          console.error("Required args: address, platformVersion, host, port");
          process.exit(1);
        }

        const [subnetAddress, platformVer, newHost, newPort] = args;

        // Get current details first and then update only the subnet connection details
        const currentMember = await networkManager.read.getMember([subnetAddress as Address]) as NodeMember;

        const subnetHash = await networkManager.write.updateMemberDetails(
          [
            subnetAddress as Address,
            currentMember.x500Name, // Keep the current X500 name
            currentMember.certSerialHex, // Keep the current cert serial
            parseInt(platformVer),
            newHost,
            parseInt(newPort)
          ],
          {} as any
        ) as Hex;
        await publicClient.waitForTransactionReceipt({ hash: subnetHash });

        console.log(`Subnet details updated successfully`);
        break;

      case "help":
      default:
        console.log("Available commands:");
        console.log("  getManager                                  - Get the current manager address");
        console.log("  addMember [address] [x500Name] [certSerialHex] [platformVersion] [host] [port] - Add a new member");
        console.log("  removeMember [address]                      - Remove a member");
        console.log("  getMember [address]                         - Get member details");
        console.log("  getAllMembers                               - List all member addresses");
        console.log("  updateStatus [address] [isActive]           - Update member status (true/false)");
        console.log("  updateDetails [address] [x500Name] [certSerialHex] [platformVersion] [host] [port] - Update member details");
        console.log("  transferManager [newManagerAddress]         - Transfer manager role to new address");
        console.log("  isMember [address]                          - Check if an address is a member");
        console.log("  updateSubnetMemberDetail [address] [platformVersion] [host] [port] - Update subnet details");
        console.log("  help                                        - Display this help message");
        console.log("\nNote: Use pipe (|) to separate arguments when using ARGS environment variable");
        console.log("Note: certSerialHex should be the X.509 certificate serial number in hex format (e.g., 0x1234...)");
        break;
    }

  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
