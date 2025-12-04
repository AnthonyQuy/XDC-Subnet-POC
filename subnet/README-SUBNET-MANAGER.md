# XDC Subnet Manager

A comprehensive command-line tool for managing and interacting with your XDC subnet deployment.

## Features

- **Subnet Management**: Start, stop, and restart the entire subnet or individual services
- **Network Monitoring**: Check node status, peer connections, and block mining
- **Service Control**: Manage individual Docker containers
- **Network Information**: Display RPC endpoints, validator addresses, and configuration
- **Utilities**: Attach to node console, check balances, view logs, and more

## Prerequisites

- Docker and Docker Compose installed
- Bash shell (macOS/Linux)
- curl (for API calls)
- bc (for balance calculations)

## Quick Start

### Make the script executable:
```bash
chmod +x subnet-manager.sh
```

### Interactive Mode (Recommended for beginners)
Simply run the script without arguments to launch the interactive menu:
```bash
./subnet-manager.sh
```

### Command-Line Mode
For automation and scripting, use direct commands:
```bash
./subnet-manager.sh start
./subnet-manager.sh status
./subnet-manager.sh stop
```

## Available Commands

### Subnet Management
- `start` - Start the entire subnet (bootnode + 3 validators + services)
- `stop` - Stop all subnet services
- `restart` - Restart the subnet
- `status` - Check subnet status (containers, peers, mining)

### Network Monitoring
- `peers` - Check peer connections for all nodes
- `mining` - Check if blocks are being mined
- `block [port]` - Get current block number (default port: 8545)
- `balance <address> [port]` - Check address balance

### Service Management
- `logs <service>` - View logs for a specific service
  - Available services: `subnet1`, `subnet2`, `subnet3`, `bootnode`, `stats`, `relayer`, `frontend`, `subswap_frontend`
- `attach [node]` - Attach to node console (default: subnet1)

### Information
- `info` - Display network configuration and endpoints
- `help` - Show help message

### Utilities
- `subswap` - Start SubSwap frontend
- `cleanup` - Remove all containers and data (use with caution)

## Usage Examples

### Starting the Subnet
```bash
# Start the subnet and wait for initialization
./subnet-manager.sh start
```

**Note**: The subnet takes approximately 30-40 seconds to fully initialize after starting. If nodes show "Not responding" immediately after start, wait a moment and check status again.

### Checking Subnet Status
```bash
# Quick status check
./subnet-manager.sh status

# Or just check peers
./subnet-manager.sh peers

# Or just check mining
./subnet-manager.sh mining
```

### Viewing Logs
```bash
# View logs for node 1
./subnet-manager.sh logs subnet1

# View logs for bootnode
./subnet-manager.sh logs bootnode

# Press Ctrl+C to exit log view
```

### Checking Balances
```bash
# Check foundation wallet balance
./subnet-manager.sh balance 0x6a9442d19ea82a24b33018bb6807bde679f92a45

# Check on a specific node
./subnet-manager.sh balance 0x6a9442d19ea82a24b33018bb6807bde679f92a45 8546
```

### Attaching to Node Console
```bash
# Attach to default node (subnet1)
./subnet-manager.sh attach

# Attach to specific node
./subnet-manager.sh attach subnet2
```

Once attached, you can use geth console commands:
```javascript
// Check block number
eth.blockNumber

// Check peer count
net.peerCount

// List accounts
eth.accounts

// Get balance
eth.getBalance(eth.accounts[0])

// Send transaction (unlock account first)
personal.unlockAccount(eth.accounts[0], "password")
eth.sendTransaction({from: eth.accounts[0], to: "0x...", value: web3.toWei(1, "ether")})

// Exit console
exit
```

### Getting Network Information
```bash
./subnet-manager.sh info
```

This displays:
- Chain ID and network name
- RPC endpoints for all nodes
- Service endpoints (stats, relayer, frontend, subswap)
- Validator addresses
- Foundation wallet address

## Network Configuration

### Chain Details
- **Chain ID**: 57539
- **Network Name**: myxdcsubnet
- **Currency**: SDC (Subnet DXC)

### RPC Endpoints
- **Node 1**: http://localhost:8545 (WebSocket: ws://localhost:9555)
- **Node 2**: http://localhost:8546 (WebSocket: ws://localhost:9556)
- **Node 3**: http://localhost:8547 (WebSocket: ws://localhost:9557)

### Service Endpoints
- **Stats Service**: http://localhost:5213
- **Relayer**: http://localhost:5215
- **Frontend**: http://localhost:5214
- **SubSwap**: http://localhost:5216

### Validator Addresses
1. 0x2df20ad7ca79f6427cd339f16d98e3d05e1b4a91
2. 0x41fe3a4527d9e601fee6018d10c990954c283559
3. 0x566c95cc89db31a10b52c051bbb84347c87f27cc

### Foundation Wallet
- **Address**: 0x6a9442d19ea82a24b33018bb6807bde679f92a45

## Troubleshooting

### Nodes Not Responding After Start
**Issue**: Nodes show "Not responding" immediately after starting.

**Solution**: The nodes need 30-40 seconds to initialize. Wait a moment and run:
```bash
./subnet-manager.sh status
```

### No Blocks Being Mined
**Issue**: Block number is 0 or not increasing.

**Possible causes**:
1. Nodes haven't finished initialization
2. Peers aren't connected
3. Consensus issues

**Steps**:
```bash
# Check if peers are connected
./subnet-manager.sh peers

# View node logs for errors
./subnet-manager.sh logs subnet1

# Check all three nodes
./subnet-manager.sh logs subnet2
./subnet-manager.sh logs subnet3
```

### Docker Network Issues
**Issue**: Containers can't communicate.

**Solution**:
```bash
# Recreate the docker network
docker network rm docker_net
./subnet-manager.sh start
```

### Port Conflicts
**Issue**: Ports already in use.

**Solution**:
```bash
# Check what's using the ports
lsof -i :8545
lsof -i :8546
lsof -i :8547

# Stop conflicting services or modify docker-compose.yml
```

### Cleanup and Fresh Start
If you encounter persistent issues:
```bash
# Stop everything
./subnet-manager.sh stop

# Clean up (removes all data!)
./subnet-manager.sh cleanup

# Start fresh
./subnet-manager.sh start
```

## Interactive Menu Guide

When you run `./subnet-manager.sh` without arguments, you'll see an interactive menu:

```
================================================
XDC Subnet Management Tool
================================================

Subnet Management:
  1) Start Subnet
  2) Stop Subnet
  3) Restart Subnet
  4) Start SubSwap Frontend
  5) Check Subnet Status

Service Control:
  6) Start/Stop/Restart Individual Service
  7) View Service Logs

Network Monitoring:
  8) Check Peer Connections
  9) Check Mining Status
 10) Get Block Number
 11) Check Address Balance

Network Information:
 12) Show Network Info

Utilities:
 13) Attach to Node Console
 14) Send Test Transaction
 15) Execute Command in Container
 16) Create Docker Network
 17) Cleanup Subnet

 0) Exit
```

Simply enter the number of your choice and follow the prompts.

## Integration with MetaMask

To connect MetaMask to your local subnet:

1. Open MetaMask
2. Click "Add Network" or "Custom RPC"
3. Enter the following details:
   - **Network Name**: XDC Subnet Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 57539
   - **Currency Symbol**: SDC
   - **Block Explorer**: (leave empty for local)

## Best Practices

1. **Always check status after starting**: Wait 30-40 seconds and verify nodes are mining
2. **Monitor logs regularly**: Use `logs` command to catch issues early
3. **Backup your data**: The blockchain data is in `xdcchain1/`, `xdcchain2/`, `xdcchain3/`
4. **Use specific nodes**: Distribute RPC calls across all three nodes for load balancing
5. **Check peers first**: Before reporting mining issues, verify peer connections

## Advanced Usage

### Load Balancing RPC Calls
```bash
# Use different nodes for different purposes
curl http://localhost:8545 # Node 1 for app
curl http://localhost:8546 # Node 2 for monitoring
curl http://localhost:8547 # Node 3 for testing
```

### Scripting with the Manager
```bash
#!/bin/bash
# Automated deployment script

./subnet-manager.sh start
sleep 40

# Wait for mining to start
while true; do
    block=$(./subnet-manager.sh block)
    if [ "$block" -gt 0 ]; then
        echo "Mining started at block $block"
        break
    fi
    sleep 5
done

# Deploy contracts
# Your deployment script here
```

### Health Check Script
```bash
#!/bin/bash
# Check subnet health every 5 minutes

while true; do
    ./subnet-manager.sh status
    sleep 300
done
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Docker logs: `./subnet-manager.sh logs <service>`
3. Consult XDC subnet documentation
4. Check Docker and Docker Compose versions

## License

This tool is provided as-is for managing XDC subnet deployments.

## Version

**Version**: 1.0.0
**Last Updated**: December 2025
