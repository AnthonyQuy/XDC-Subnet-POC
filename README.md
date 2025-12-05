# XDC SubnetFoundry

**Build Your Enterprise Network with XDC Subnet**

A comprehensive toolkit for deploying and managing private XDC blockchain networks with smart contract governance and intuitive web interface.

## 🔒 Important Security Notice

This repository contains configurations for blockchain operations that require private keys and sensitive data. Before using or contributing to this project, please read the [SECURITY.md](SECURITY.md) file for important information about protecting your sensitive data.

## 🎯 Overview

XDC SubnetFoundry is an enterprise-ready platform that provides everything you need to deploy and manage a private XDC blockchain network. It combines blockchain infrastructure, smart contract governance, and a user-friendly web interface into a single, integrated solution.

**Perfect for:**
- Enterprise private blockchain deployments
- Consortium networks requiring node membership governance
- Development and testing environments
- Proof-of-concept blockchain applications

## 🏗️ Architecture

XDC SubnetFoundry is built on a 3-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: Frontend Layer                    │
│         React + TypeScript + MetaMask Integration            │
│              Port: 3000 (Docker) / 5173 (Dev)                │
└────────────────────────────┬────────────────────────────────┘
                             │ Web3.js RPC Calls
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                TIER 2: Smart Contract Layer                  │
│           NetworkManager.sol (On-chain Governance)           │
│              Deployed on Subnet via Hardhat                  │
└────────────────────────────┬────────────────────────────────┘
                             │ Connected to Validators
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              TIER 3: Blockchain Infrastructure               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Validator 1  │  │ Validator 2  │  │ Validator 3  │      │
│  │ Port: 8545   │  │ Port: 8546   │  │ Port: 8547   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           ↑               ↑               ↑                  │
│           └───────┬───────┴───────┬───────┘                  │
│                Bootnode (Discovery)                          │
│           Chain ID: 57539 | Network: docker_net              │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Frontend Layer
**Location:** `/frontend/`

A modern React web application providing:
- **Dual Connection Modes**: MetaMask wallet integration or direct RPC connection
- **Network Detection**: Automatic XDC Subnet detection and one-click switching
- **Member Management**: Add, update, remove, and query network members
- **Role-Based UI**: Different views for network managers vs. regular users
- **Real-time Updates**: Live blockchain state monitoring and notifications

**Technology Stack:**
- React 19 + TypeScript
- Vite 6 (build tool)
- Web3.js 4.16 (blockchain interaction)
- Bootstrap 5 (UI framework)
- React Toastify (notifications)

### Tier 2: Smart Contract Layer
**Location:** `/contracts/`

Smart contracts deployed on the XDC subnet for decentralized governance:
- **NetworkManager Contract**: Stores and manages network member information
- **X.500 Distinguished Names**: Enterprise-standard identity format
- **Comprehensive Member Data**: Address, public key, host, port, status, and more
- **Access Control**: Owner-only administrative functions
- **Event Logging**: All state changes emit events for transparency

**Technology Stack:**
- Solidity 0.8.x
- Hardhat 3 (development framework)
- OpenZeppelin Contracts (security)
- TypeScript (deployment scripts)
- Docker (isolated environment)

### Tier 3: Blockchain Infrastructure
**Location:** `/subnet/`

A complete XDC subnet with:
- **3 Validator Nodes**: Running XDPoS consensus for block production
- **Bootnode**: Peer discovery and network coordination
- **Pre-configured Genesis**: Ready-to-use blockchain configuration
- **Management Tools**: CLI script for common operations
- **Stats Service**: Network monitoring and visualization

**Technology Stack:**
- XDC Network nodes (Docker containers)
- Docker Compose orchestration
- Bash management scripts

## 🔄 Understanding the Separation: NetworkManager vs Subnet Control

**A Critical Distinction for Enterprise Deployments**

XDC SubnetFoundry separates infrastructure control from application governance. Understanding this separation is crucial for proper deployment and usage.

### Two Layers, Two Purposes

```
┌─────────────────────────────────────────────────────────────┐
│         NetworkManager Contract (APPLICATION LAYER)          │
│                  "WHO is authorized?"                        │
│                                                              │
│  ✓ Member registry and identity                             │
│  ✓ X.500 distinguished names                                │
│  ✓ Public keys and network info                             │
│  ✓ Active/inactive status                                   │
│  ✓ Governance and authorization                             │
│                                                              │
│  Controlled by: Smart contract transactions                 │
│  Changed via: Frontend UI or contract calls                 │
└──────────────────────┬───────────────────────────────────────┘
                       │ Deployed on
                       ↓
┌─────────────────────────────────────────────────────────────┐
│          Subnet Control (INFRASTRUCTURE LAYER)               │
│                 "HOW does it operate?"                       │
│                                                              │
│  ✓ Block production and validation                          │
│  ✓ Consensus mechanism (XDPoS)                              │
│  ✓ Transaction processing                                   │
│  ✓ Peer discovery and connections                           │
│  ✓ Network health and monitoring                            │
│                                                              │
│  Controlled by: Docker containers & CLI scripts             │
│  Changed via: Configuration files & node management         │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Comparison

| Aspect | NetworkManager Contract | Subnet Control |
|--------|------------------------|----------------|
| **Purpose** | Member registry & governance | Block production & consensus |
| **Technology** | Smart Contract (Solidity) | Blockchain Nodes (XDC/Go) |
| **Layer** | Application (Tier 2) | Infrastructure (Tier 3) |
| **Scope** | WHO can be a member | HOW the network operates |
| **Control** | Contract owner (via transactions) | Infrastructure admin (via Docker/CLI) |
| **Data** | Member identities, X.500 names, keys | Blockchain state, blocks, transactions |
| **Changes** | On-chain transactions | Configuration & node restarts |
| **Access** | Anyone can read, owner can write | Shell/Docker access required |
| **Visibility** | Transparent, auditable on-chain | Logs, node status, metrics |

### What NetworkManager Controls ✅

**Member Registry:**
```javascript
// Add a member to the on-chain registry
contract.methods.addMember(
  "0x123...",                    // Member address
  "CN=Node1,O=Corp,C=US",       // X.500 Name
  "0xPublicKey...",             // Public Key
  12345,                         // Serial number
  1,                             // Platform version
  "192.168.1.100",              // Host
  30303                          // Port
).send();

// This ONLY adds to the contract registry
// Does NOT make them a validator
```

**Operations:**
- ✅ Register authorized members
- ✅ Store identity information
- ✅ Track member status (active/inactive)
- ✅ Maintain network configuration details
- ✅ Provide governance interface
- ✅ Emit events for audit trails

**Does NOT Control:**
- ❌ Actual validator participation
- ❌ Block production
- ❌ Consensus decisions
- ❌ Peer connections
- ❌ Node infrastructure

### What Subnet Control Controls ✅

**Infrastructure Operations:**
```bash
# Start the validators
./subnet-manager.sh start

# Check consensus status
./subnet-manager.sh status

# View peer connections
./subnet-manager.sh peers

# These control ACTUAL BLOCKCHAIN INFRASTRUCTURE
```

**Operations:**
- ✅ Start/stop validator nodes
- ✅ Manage consensus participation
- ✅ Process transactions
- ✅ Maintain peer connections
- ✅ Monitor network health
- ✅ Configure genesis block

**Does NOT Control:**
- ❌ Member registry data
- ❌ Application-level authorization
- ❌ Business logic about membership
- ❌ Governance workflows

### Real-World Analogy

Think of a corporate office building:

**Subnet Control** = The Building Infrastructure
- Physical structure and operations
- Power, HVAC, networking, security
- Core facilities management
- Building access control

**NetworkManager Contract** = The Employee Directory
- Who works here (member list)
- Contact information (X.500 names, keys)
- Department assignments (network info)
- Access badges (authorization data)

The employee directory runs INSIDE the building but doesn't control the building's power or elevator operations. Similarly, NetworkManager runs ON the subnet but doesn't control consensus or block production.

### How They Work Together

```
EXAMPLE: Adding a New Network Member

1. INFRASTRUCTURE (Must be running first):
   └─> Validators producing blocks
   └─> Network accepting transactions
   └─> RPC endpoints available

2. CONTRACT DEPLOYMENT:
   └─> NetworkManager deployed on chain
   └─> Contract address available
   └─> Ready to store member data

3. MEMBER REGISTRATION (via Contract):
   └─> Frontend submits transaction
   └─> Transaction processed by validators
   └─> Member data stored in contract
   └─> Event emitted for logging

4. MEMBER USAGE:
   └─> Applications query contract
   └─> Check if member authorized
   └─> Retrieve member details
   └─> Use for application logic
```

### Important Notes

⚠️ **The NetworkManager contract does NOT:**
- Make nodes become validators
- Control which nodes participate in consensus
- Affect blockchain operation

✅ **The NetworkManager contract DOES:**
- Provide an application-layer registry
- Enable governance workflows
- Store identity information
- Track authorized members

The three validators in SubnetFoundry are configured at the infrastructure level (genesis.json, docker-compose.yml). The NetworkManager provides an APPLICATION-LAYER registry that applications can use to determine authorized members for their specific use cases.

### Use Cases

**Use NetworkManager for:**
- Building a permissioned network directory
- Tracking authorized participants
- Implementing business logic around membership
- Creating governance workflows
- Auditing member changes over time

**Use Subnet Control for:**
- Starting/stopping the blockchain
- Adding new validator nodes to consensus
- Monitoring network health
- Troubleshooting consensus issues
- Managing infrastructure resources

## 📋 Features

### Blockchain Infrastructure
✅ 3-node validator network with XDPoS consensus  
✅ Pre-configured genesis block and network parameters  
✅ Bootnode for automatic peer discovery  
✅ Isolated Docker network for secure communication  
✅ Pre-funded validator accounts for immediate use  
✅ Network monitoring and management CLI tools  

### Smart Contract Governance
✅ NetworkManager contract for member management  
✅ X.500 Distinguished Name support for enterprise identity  
✅ Comprehensive node information storage (10 fields per member)  
✅ Active/inactive status management  
✅ Owner-based access control with OpenZeppelin  
✅ Complete event logging for audit trails  

### Frontend Application
✅ MetaMask integration with automatic network detection  
✅ Direct RPC connection option for flexibility  
✅ Real-time member list and status monitoring  
✅ Add/update/remove member operations (manager only)  
✅ Search and filter network members  
✅ Responsive Bootstrap UI for all devices  
✅ Toast notifications for all operations  

## 🚀 Quick Start

### Prerequisites

**Required:**
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (LTS recommended)
- Git

**Recommended:**
- MetaMask browser extension (for frontend wallet features)
- 8GB+ RAM for running all services
- macOS or Linux (Windows with WSL2)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnthonyQuy/XDC-SubnetFoundry.git
   cd XDC-SubnetFoundry
   ```

2. **Configure environment files:**

   **Contracts:**
   ```bash
   cd contracts
   cp .env.example .env
   nano .env  # Add your configuration
   cd ..
   ```

   **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   nano .env  # Add RPC URL and contract address
   cd ..
   ```

3. **Start the XDC subnet:**
   ```bash
   cd subnet
   ./subnet-manager.sh start
   # Wait ~40 seconds for initialization
   ./subnet-manager.sh status  # Verify nodes are mining
   cd ..
   ```

4. **Deploy the NetworkManager contract:**
   ```bash
   cd contracts
   ./run.sh
   # Select option 1: Compile contracts
   # Select option 2: Deploy to XDC subnet
   # Note the deployed contract address
   cd ..
   ```

5. **Start the frontend:**
   ```bash
   cd frontend
   # Update .env with the contract address from step 4
   ./run.sh
   # Access at http://localhost:3000
   ```

## 🔧 How It Works

### Complete System Flow

Here's how the components work together when adding a new member:

```
1. USER ACTION (Frontend):
   ┌─ Manager opens web app
   ├─ Connects with MetaMask
   ├─ Navigates to "Add Member" tab
   ├─ Fills form with member details
   └─ Clicks "Add Member" button

2. TRANSACTION SUBMISSION (Frontend → Contract):
   ┌─ Web3.js constructs transaction
   ├─ MetaMask popup appears
   ├─ User reviews and approves
   ├─ Transaction sent to RPC endpoint (port 8545)
   └─ Signed with user's private key

3. BLOCKCHAIN PROCESSING (Subnet):
   ┌─ Validator 1 receives transaction
   ├─ Transaction added to mempool
   ├─ Next block includes transaction
   ├─ All validators execute transaction
   ├─ NetworkManager.addMember() runs
   ├─ Member stored in contract state
   ├─ MemberAdded event emitted
   └─ Block confirmed across network

4. UI UPDATE (Frontend):
   ┌─ App detects transaction confirmation
   ├─ Queries contract for updated member list
   ├─ New member appears in UI
   ├─ Success toast notification shown
   └─ UI state synchronized with blockchain
```

### Data Flow Diagram

```
User Input → Frontend → Web3.js → RPC Endpoint → Validator Node
    ↑                                                    ↓
    │                                            Execute Contract
    │                                                    ↓
    └──────── UI Update ← Event Logs ← Blockchain State
```

### Key Interactions

**1. Network Member Query:**
```javascript
// Frontend calls contract
const members = await contract.methods.getAllMembers().call();
// Returns array of member addresses

// Get details for each member
const details = await contract.methods.getMember(address).call();
// Returns: x500Name, publicKey, host, port, isActive, etc.
```

**2. Adding a Member (Manager Only):**
```javascript
// Frontend constructs transaction
await contract.methods.addMember(
  memberAddress,
  x500Name,
  publicKey,
  serial,
  platformVersion,
  host,
  port
).send({ from: managerAddress });
// Requires MetaMask approval
// Emits MemberAdded event
```

**3. Network Status Check:**
```bash
# CLI command checks all validators
./subnet-manager.sh status

# Returns:
- Container status (running/stopped)
- Peer connections (should be 2 peers each)
- Mining status (block height increasing)
- RPC endpoint availability
```

## 📊 Network Configuration

### Default Settings

| Component | Configuration | Value |
|-----------|--------------|-------|
| Chain ID | Network identifier | 57539 |
| Network Name | Subnet name | myxdcsubnet |
| Currency Symbol | Native token | SDC |
| Consensus | Algorithm | XDPoS |
| Block Time | Average | ~2 seconds |
| Docker Network | Container network | docker_net |

### RPC Endpoints

| Node | HTTP RPC | WebSocket | Purpose |
|------|----------|-----------|---------|
| Validator 1 | http://localhost:8545 | ws://localhost:9555 | Primary endpoint |
| Validator 2 | http://localhost:8546 | ws://localhost:9556 | Backup endpoint |
| Validator 3 | http://localhost:8547 | ws://localhost:9557 | Load balancing |

### Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI (Docker) |
| Frontend Dev | http://localhost:5173 | Web UI (Vite dev) |
| Stats Service | http://localhost:5213 | Network statistics |
| Relayer | http://localhost:5215 | Cross-chain relay |

### Validator Addresses

```
Validator 1: 0x2df20ad7ca79f6427cd339f16d98e3d05e1b4a91
Validator 2: 0x41fe3a4527d9e601fee6018d10c990954c283559
Validator 3: 0x566c95cc89db31a10b52c051bbb84347c87f27cc
Foundation: 0x6a9442d19ea82a24b33018bb6807bde679f92a45
```

## 🛠️ Management & Operations

### Subnet Management

```bash
cd subnet
./subnet-manager.sh <command>
```

**Common Commands:**
- `start` - Start the entire subnet
- `stop` - Stop all services
- `status` - Check subnet status
- `peers` - View peer connections
- `mining` - Check if blocks are being mined
- `logs <service>` - View service logs
- `info` - Display network configuration
- `attach [node]` - Attach to node console

### Contract Development

```bash
cd contracts
./run.sh
```

**Interactive Menu:**
1. Compile contracts
2. Deploy to XDC subnet
3. Interact with deployed contract
4. Run tests
5. Access container shell
6. View logs
7. Deep clean & rebuild

### Frontend Development

```bash
cd frontend
./run.sh
```

**Development Server:**
- Hot reload enabled
- TypeScript type checking
- Browser auto-refresh
- Console error reporting

## 📁 Project Structure

```
XDC-SubnetFoundry/
├── contracts/              # Smart Contract Layer
│   ├── contracts/          # Solidity source files
│   │   └── NetworkManager.sol
│   ├── scripts/            # Deployment scripts
│   ├── test/              # Contract tests
│   ├── compiled/          # Build artifacts
│   ├── deployed/          # Deployment records
│   └── run.sh             # Management script
│
├── frontend/              # Frontend Application Layer
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Helper functions
│   │   ├── types/         # TypeScript types
│   │   └── contracts/     # Contract ABI
│   ├── public/            # Static assets
│   └── run.sh             # Management script
│
└── subnet/                # Blockchain Infrastructure Layer
    ├── xdcchain1/         # Validator 1 data
    ├── xdcchain2/         # Validator 2 data
    ├── xdcchain3/         # Validator 3 data
    ├── bootnodes/         # Bootnode configuration
    ├── scripts/           # Utility scripts
    ├── genesis.json       # Genesis block config
    └── subnet-manager.sh  # Management script
```

## 📚 Documentation

### Component Documentation
- **[Contracts Documentation](contracts/README.md)** - Smart contract deployment, API reference, and usage
- **[Frontend Documentation](frontend/README.md)** - Web application setup, features, and troubleshooting
- **[Subnet Manager Guide](subnet/README-SUBNET-MANAGER.md)** - Comprehensive subnet management reference
- **[Quick Reference](subnet/QUICK-REFERENCE.md)** - Essential commands and shortcuts

### Integration Guides
- **[MetaMask Integration](frontend/METAMASK_INTEGRATION.md)** - Wallet connection and network setup
- **[Network Detection](frontend/NETWORK_DETECTION.md)** - Automatic network detection and switching

### Security & Best Practices
- **[Security Guidelines](SECURITY.md)** - Protecting sensitive data and private keys

## 🔐 Security Considerations

### For Deployment
⚠️ Use HTTPS in production (configure reverse proxy)  
⚠️ Set appropriate CORS policies on RPC endpoints  
⚠️ Implement rate limiting on backend/RPC  
⚠️ Keep Docker images and dependencies updated  
⚠️ Use environment variables for sensitive configuration  
⚠️ Enable audit logging for manager operations  

### For Users
✅ Always review transactions in MetaMask before approving  
✅ Verify contract addresses before connecting  
✅ Keep MetaMask seed phrase secure and private  
✅ Only connect to trusted RPC endpoints  
❌ Never share private keys or seed phrases  
❌ Never commit sensitive data to repositories  

## 🐛 Troubleshooting

### Subnet Issues

**Nodes not responding after start:**
```bash
# Wait 40 seconds for initialization, then:
./subnet-manager.sh status
```

**No blocks being mined:**
```bash
# Check peer connections
./subnet-manager.sh peers
# Should show 2 peers per node

# View logs for errors
./subnet-manager.sh logs subnet1
```

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :8545
lsof -i :8546
lsof -i :8547
```

### Contract Issues

**ESM/TypeScript errors in Docker:**
```bash
cd contracts
./run.sh
# Select option 7: Deep clean & rebuild
```

**Deployment fails:**
```bash
# Verify subnet is running
cd ../subnet
./subnet-manager.sh status

# Check RPC connectivity
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Frontend Issues

**MetaMask not detected:**
- Install MetaMask extension
- Refresh page after installation
- Check browser console for errors

**Wrong network detected:**
- Click "Switch to XDC Subnet" in app
- Or manually switch in MetaMask
- Use "Add XDC Subnet Network" if needed

**Connection fails:**
```bash
# Verify RPC URL in .env
cat frontend/.env | grep VITE_DEFAULT_RPC_URL

# Test RPC endpoint
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting sections in component READMEs
- Review the [Security Guidelines](SECURITY.md)
- Check Docker and Node.js versions match prerequisites
- Consult browser console for frontend errors
- Review Docker logs for backend issues

## 🎯 What's Next?

After getting XDC SubnetFoundry running:
1. **Customize**: Modify genesis block, add more validators
2. **Extend**: Add custom smart contracts for your use case
3. **Scale**: Deploy to cloud infrastructure (AWS, Azure, GCP)
4. **Monitor**: Integrate with existing monitoring tools
5. **Secure**: Implement additional security measures for production

---

**XDC SubnetFoundry** - Build Your Enterprise Network with XDC Subnet
