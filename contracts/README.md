# Contract Management

This directory contains all the smart contract related files for the XDC Subnet Deployment project.

## Directory Structure

- `/source`: Store your raw contract source code files (.sol, .vy, etc.)
- `/compiled`: Store compiled contract artifacts (ABIs, bytecode)
- `/deployed`: Track information about deployed contracts (addresses, networks)
- `/scripts`: Deployment and interaction scripts
- `/tests`: Contract test files

## Usage Guidelines

### Contract Development Workflow

1. Place your contract source code in the `/source` directory
2. Compile your contracts and save artifacts to `/compiled`
3. Use scripts from `/scripts` for deployment
4. Store deployment information in `/deployed`
5. Add tests in `/tests` directory

### Deployment Information

Store deployed contract information in JSON files in the `/deployed` directory with the following format:

```json
{
  "contractName": "YourContract",
  "address": "0x...",
  "network": "subnet1",
  "deployedAt": "YYYY-MM-DD",
  "deployTransaction": "0x...",
  "constructorArgs": []
}
