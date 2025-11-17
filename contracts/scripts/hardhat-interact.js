// Hardhat interaction script for NetworkManager contract
const { ethers } = require("hardhat");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();

/**
 * Interact with the NetworkManager contract using Hardhat
 * 
 * Usage (via environment variables):
 *   COMMAND=commandName [ARGS=arg1,arg2,...] npx hardhat run scripts/hardhat-interact.js --network subnet
 * 
 * Examples:
 *   COMMAND=getAllMembers npx hardhat run scripts/hardhat-interact.js --network subnet
 *   COMMAND=getMember ARGS=0x123... npx hardhat run scripts/hardhat-interact.js --network subnet
 *   COMMAND=addMember ARGS=0x123...,NodeName,pubkey,serial,4,host,30303 npx hardhat run scripts/hardhat-interact.js --network subnet
 * 
 * Commands:
 *  - getManager: Get the current manager address
 *  - addMember: Add a new member (args: address,x500Name,publicKey,serial,platformVersion,host,port)
 *  - removeMember: Remove a member (args: address)
 *  - getMember: Get member details (args: address)
 *  - getAllMembers: List all member addresses
 *  - updateStatus: Update member status (args: address,isActive)
 *  - updateDetails: Update member details (args: address,x500Name,publicKey,serial,platformVersion,host,port)
 *  - transferManager: Transfer manager role to new address (args: newManagerAddress)
 *  - isMember: Check if an address is a member (args: address)
 *  - updateSubnetMemberDetail: Update subnet details (args: address,serial,platformVersion,host,port)
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
];

// Process arguments - check environment variable first, then fall back to process.argv
let command = process.env.COMMAND || "help";  // Read from environment variable, default to help
let args = [];

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
    if (validCommands.includes(arg)) {
      command = arg;
      args = processArgs.slice(i + 1);
      break;
    }
  }
}

async function main() {
  try {
    // Find latest deployment file
    const deployedDir = path.resolve(__dirname, "../deployed");
    if (!fs.existsSync(deployedDir)) {
      console.error("Deployment directory not found! Deploy contract first.");
      process.exit(1);
    }

    const files = fs.readdirSync(deployedDir).filter(f => f.startsWith("NetworkManager-"));
    if (files.length === 0) {
      console.error("No deployed contract found! Deploy contract first.");
      process.exit(1);
    }

    // Sort by modified time (newest first)
    const sortedFiles = files.map(file => ({
      name: file,
      time: fs.statSync(path.join(deployedDir, file)).mtime.getTime()
    }))
      .sort((a, b) => b.time - a.time);

    const latestDeployment = path.join(deployedDir, sortedFiles[0].name);
    const deployment = JSON.parse(fs.readFileSync(latestDeployment, "utf8"));

    // Get the signer to send transactions
    const [signer] = await ethers.getSigners();
    
    // Create contract instance
    const networkManager = await ethers.getContractAt(
      deployment.abi,
      deployment.address,
      signer
    );

    // Process command
    switch (command) {
      case "getManager":
        // Note: Using owner() instead of manager() as per the Ownable contract
        const manager = await networkManager.owner();
        console.log(`Current manager: ${manager}`);
        break;

      case "addMember":
        if (args.length < 7) {
          console.error("Usage: COMMAND=addMember ARGS=address,x500Name,publicKey,serial,platformVersion,host,port npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address, x500Name, publicKey, serial, platformVersion, host, port");
          process.exit(1);
        }

        const [memberAddress, x500Name, publicKey, serial, platformVersion, host, port] = args;

        const addTx = await networkManager.addMember(
          memberAddress, 
          x500Name, 
          ethers.toUtf8Bytes(publicKey), 
          serial, 
          parseInt(platformVersion), 
          host, 
          parseInt(port)
        );
        await addTx.wait();

        console.log(`Member added successfully`);
        break;

      case "removeMember":
        if (args.length < 1) {
          console.error("Usage: COMMAND=removeMember ARGS=address npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        const removeTx = await networkManager.removeMember(args[0]);
        await removeTx.wait();

        console.log(`Member removed successfully`);
        break;

      case "getMember": 
        console.log("getMember called with address:", args[0]);
        if (args.length < 1) {
          console.error("Usage: COMMAND=getMember ARGS=address npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        let getMemberAddress = args[0].trim();

        const members = await networkManager.getAllMembers();
        console.log("Current members in the network:", members);

        console.log(`Fetching details for member: ${getMemberAddress}`);
        const member = await networkManager.getMember(getMemberAddress);

        let publicKeyDisplay;
        try {
          publicKeyDisplay = member.publicKey ? ethers.toUtf8String(member.publicKey) : "(empty)";
          publicKeyDisplay = publicKeyDisplay.replace(/\0/g, "");
        } catch (error) {
          publicKeyDisplay = `(hex) ${member.publicKey}`;
        }

        console.log("Member details:");
        console.log("  X500 Name:", member.x500Name);
        console.log("  Address:", member.memberAddress);
        console.log("  Public Key:", publicKeyDisplay);
        console.log("  Active:", member.isActive);
        console.log("  Joined:", new Date(Number(member.joinedAt) * 1000).toLocaleString());
        console.log("  Last Updated:", new Date(Number(member.lastUpdated) * 1000).toLocaleString());
        console.log("  Serial:", member.serial.toString());
        console.log("  Platform Version:", member.platformVersion);
        console.log("  Host:", member.host);
        console.log("  Port:", member.port);
        break;

      case "getAllMembers":
        console.log("Fetching all member addresses...");
        const memberAddresses = await networkManager.getAllMembers();
        console.log("All members:", memberAddresses);
        console.log(`Total member count: ${memberAddresses.length}`);
        break;

      case "updateStatus":
        if (args.length < 2) {
          console.error("Usage: COMMAND=updateStatus ARGS=address,isActive npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address, isActive (true/false)");
          process.exit(1);
        }

        const isActive = args[1].toLowerCase() === "true";

        const statusTx = await networkManager.updateMemberStatus(args[0], isActive);
        await statusTx.wait();

        console.log(`Member status updated successfully`);
        break;

      case "updateDetails":
        if (args.length < 7) {
          console.error("Usage: COMMAND=updateDetails ARGS=address,x500Name,publicKey,serial,platformVersion,host,port npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address, x500Name, publicKey, serial, platformVersion, host, port");
          process.exit(1);
        }

        const [updateAddress, updateName, updateKey, updateSerial, updatePlatformVersion, updateHost, updatePort] = args;

        const updateTx = await networkManager.updateMemberDetails(
          updateAddress,
          updateName,
          ethers.toUtf8Bytes(updateKey),
          updateSerial,
          parseInt(updatePlatformVersion),
          updateHost,
          parseInt(updatePort)
        );
        await updateTx.wait();

        console.log(`Member details updated successfully`);
        break;

      case "transferManager":
        if (args.length < 1) {
          console.error("Usage: COMMAND=transferManager ARGS=newManagerAddress npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: newManagerAddress");
          process.exit(1);
        }

        // Note: Using transferOwnership() instead of transferManagerRole() as per the Ownable contract
        const transferTx = await networkManager.transferOwnership(args[0]);
        await transferTx.wait();

        console.log(`Manager role transferred successfully`);
        break;

      case "isMember":
        if (args.length < 1) {
          console.error("Usage: COMMAND=isMember ARGS=address npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address");
          process.exit(1);
        }

        const isMember = await networkManager.isMember(args[0]);
        console.log(`Address ${args[0]} is${isMember ? "" : " not"} a member.`);
        break;
        
      case "updateSubnetMemberDetail":
        if (args.length < 5) {
          console.error("Usage: COMMAND=updateSubnetMemberDetail ARGS=address,serial,platformVersion,host,port npx hardhat run scripts/hardhat-interact.js --network subnet");
          console.error("Required args: address, serial, platformVersion, host, port");
          process.exit(1);
        }

        const [subnetAddress, serialID, platformVer, newHost, newPort] = args;

        // Since there's no direct method for updateSubnetMemberDetail in the contract,
        // we need to get the current details first and then update only the subnet details
        const currentMember = await networkManager.getMember(subnetAddress);

        const subnetTx = await networkManager.updateMemberDetails(
          subnetAddress,
          currentMember.x500Name, // Keep the current X500 name
          currentMember.publicKey, // Keep the current public key
          serialID,
          parseInt(platformVer),
          newHost,
          parseInt(newPort)
        );
        await subnetTx.wait();

        console.log(`Subnet details updated successfully`);
        break;

      case "help":
      default:
        console.log("Available commands:");
        console.log("  getManager                                  - Get the current manager address");
        console.log("  addMember [address] [x500Name] [publicKey] [serial] [platformVersion] [host] [port] - Add a new member");
        console.log("  removeMember [address]                      - Remove a member");
        console.log("  getMember [address]                         - Get member details");
        console.log("  getAllMembers                               - List all member addresses");
        console.log("  updateStatus [address] [isActive]           - Update member status (true/false)");
        console.log("  updateDetails [address] [x500Name] [publicKey] [serial] [platformVersion] [host] [port] - Update member details");
        console.log("  transferManager [newManagerAddress]         - Transfer manager role to new address");
        console.log("  isMember [address]                          - Check if an address is a member");
        console.log("  updateSubnetMemberDetail [address] [serial] [platformVersion] [host] [port] - Update subnet details");
        console.log("  help                                        - Display this help message");
        break;
    }

  } catch (error) {
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
