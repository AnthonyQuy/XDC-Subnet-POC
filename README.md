# XDC Subnet Deployment

A comprehensive toolkit for deploying and managing XDC Network subnets with secure contract interactions.

## 🔒 Important Security Notice

This repository contains configurations for blockchain operations that require private keys and sensitive data. Before using or contributing to this project, please read the [SECURITY.md](SECURITY.md) file for important information about protecting your sensitive data.

## 📋 Features

- XDC subnet node deployment and configuration
- Smart contract deployment and management
- NetworkManager contract for member governance
- Frontend application for easy interaction with contracts

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v16+)
- Git

### Setup and Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/xdc-subnet-deployment.git
   cd xdc-subnet-deployment
   ```

2. Set up environment configuration (choose one method):

   **Option 1: Environment Files**
   ```bash
   # Create environment files from examples
   cp generated/contract_deploy.env.example generated/contract_deploy.env
   cp generated/subswap-frontend.config.json.example generated/subswap-frontend.config.json
   cp frontend/.env.example frontend/.env
   
   # Edit the files with your actual values
   nano generated/contract_deploy.env
   nano generated/subswap-frontend.config.json
   nano frontend/.env
   ```

   **Option 2: Environment Variables**
   ```bash
   # Create environment setup script
   cp env-setup.sh.example env-setup.sh
   
   # Edit the script with your actual values
   nano env-setup.sh
   
   # Load environment variables
   source ./env-setup.sh
   ```

### Subnet Deployment

1. Start the XDC subnet:
   ```bash
   ./start.sh
   ```

2. Deploy the NetworkManager contract:
   ```bash
   cd contracts
   ./run.sh
   # Select option 2 to deploy the contract
   ```

### Frontend Application

#### Development Mode

1. Start the development environment:
   ```bash
   cd frontend
   ./start-dev.sh
   ```

2. Access the application at http://localhost:3000

#### Production Mode

1. Build and run the frontend:
   ```bash
   cd frontend
   docker-compose up -d --build
   ```

2. Access the application at http://localhost:3000

## 📊 Project Structure

- `/contracts` - Smart contract source code, deployment and interaction scripts
- `/frontend` - React web application for contract interaction
- `/generated` - Generated files and configuration for the XDC subnet
- `/scripts` - Utility scripts for project management

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🔐 Security

For security-related information, please read [SECURITY.md](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
