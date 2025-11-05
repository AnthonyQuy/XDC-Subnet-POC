# Network Management Contract Usage Guide

This guide explains how to build, deploy, and interact with the NetworkManager contract using Docker and the XDC Subnet environment.

## Contract Overview

The `NetworkManager` contract provides a system for managing network node membership with X.500 name format, storing:
- X.500 distinguished names
- Node addresses
- Public keys
- Member status

The contract designates one node as the manager with administrative privileges to add, remove, and update members.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Access to an XDC subnet (the environment is pre-configured for subnet1)
- Basic knowledge of Solidity and blockchain concepts

### Building the Environment

1. Navigate to the contracts directory:
   ```
   cd contracts
   ```

2. Build the Docker container:
   ```
   docker-compose build
   ```

3. Start the container:
   ```
   docker-compose up -d
   ```

## Contract Development Workflow

### Compiling the Contract

1. Access the container shell:
   ```
   docker exec -it xdc-contract-dev /bin/bash
   ```

2. Compile the contract:
   ```
   npm run compile
   ```

   This compiles the `NetworkManager.sol` contract in the `source` directory and places the compiled artifacts in the `compiled` directory.

### Deploying the Contract

1. From inside the container, deploy the contract:
   ```
   npm run deploy
   ```

   This will:
   - Connect to the XDC subnet at http://192.168.25.11:8545
   - Deploy the NetworkManager contract
   - Save deployment information to the `deployed` directory

## Interacting with the Contract

Once the contract is deployed, you can interact with it using web3.js or ethers.js. Here are examples of common interactions:

### JavaScript Interaction Example

```javascript
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to the XDC subnet
const web3 = new Web3('http://192.168.25.11:8545');

// Load deployment info
const deploymentPath = path.resolve(__dirname, '../deployed/NetworkManager-551.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

// Create contract instance
const networkManager = new web3.eth.Contract(deployment.abi, deployment.address);

// Set up account with private key
const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
web3.eth.accounts.wallet.add(account);

// Example: Add a new member
async function addMember() {
  const memberAddress = '0x123...'; // Member's Ethereum address
  const x500Name = 'CN=Node2,O=XDC,C=SG'; // X.500 distinguished name
  const publicKey = '0xabcd...'; // Member's public key
  
  const result = await networkManager.methods
    .addMember(memberAddress, x500Name, publicKey)
    .send({
      from: account.address,
      gas: 500000,
      gasPrice: web3.utils.toWei('1', 'gwei')
    });
    
  console.log('Member added:', result.transactionHash);
}

// Example: Get member details
async function getMember(memberAddress) {
  const member = await networkManager.methods.getMember(memberAddress).call();
  console.log('Member details:', member);
}

// Example: List all members
async function getAllMembers() {
  const addresses = await networkManager.methods.getAllMembers().call();
  console.log('All members:', addresses);
}
```

## Available Contract Functions

### Administrative Functions (Manager Only)

- `addMember(address memberAddress, string x500Name, bytes publicKey)`: Add a new member
- `removeMember(address memberAddress)`: Remove a member
- `updateMemberStatus(address memberAddress, bool isActive)`: Change member status
- `updateMemberDetails(address memberAddress, string x500Name, bytes publicKey)`: Update member information
- `transferManagerRole(address newManager)`: Transfer manager role to another address

### Read Functions (Public)

- `getMember(address memberAddress)`: Get member details
- `getAllMembers()`: Get all member addresses
- `isMember(address memberAddress)`: Check if an address is a member
- `memberCount()`: Get total number of members
- `manager()`: Get current manager address

## Security Considerations

- The manager has full control over network membership
- Consider implementing multi-signature requirements for critical operations
- Keep the manager's private key secure
- Consider adding a time-lock for sensitive operations

## Troubleshooting

- **Connection Issues**: Ensure the subnet is running and accessible
- **Compilation Errors**: Check Solidity version compatibility
- **Deployment Failures**: Verify account has enough funds
- **Transaction Errors**: Check gas settings and permissions
