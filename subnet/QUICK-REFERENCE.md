# XDC Subnet Manager - Quick Reference

## Essential Commands

```bash
# Make executable (first time only)
chmod +x subnet-manager.sh

# Start subnet
./subnet-manager.sh start

# Check status
./subnet-manager.sh status

# Stop subnet
./subnet-manager.sh stop

# Get help
./subnet-manager.sh help
```

## Common Tasks

### Check if Nodes are Working
```bash
# Check peers (should show 2 peers per node)
./subnet-manager.sh peers

# Check mining (blocks should be increasing)
./subnet-manager.sh mining

# Get current block number
./subnet-manager.sh block
```

### View Logs
```bash
./subnet-manager.sh logs subnet1
./subnet-manager.sh logs subnet2
./subnet-manager.sh logs subnet3
./subnet-manager.sh logs bootnode
```

### Network Information
```bash
# Display all endpoints and addresses
./subnet-manager.sh info
```

## RPC Endpoints

| Node | HTTP | WebSocket |
|------|------|-----------|
| Node 1 | http://localhost:8545 | ws://localhost:9555 |
| Node 2 | http://localhost:8546 | ws://localhost:9556 |
| Node 3 | http://localhost:8547 | ws://localhost:9557 |

## Service Endpoints

- **Stats Service**: http://localhost:5213
- **Relayer**: http://localhost:5215
- **Frontend**: http://localhost:5214
- **SubSwap**: http://localhost:5216

## Network Details

- **Chain ID**: 57539
- **Network Name**: myxdcsubnet
- **Currency**: SDC

## Validator Addresses

1. `0x2df20ad7ca79f6427cd339f16d98e3d05e1b4a91`
2. `0x41fe3a4527d9e601fee6018d10c990954c283559`
3. `0x566c95cc89db31a10b52c051bbb84347c87f27cc`

## Foundation Wallet

`0x6a9442d19ea82a24b33018bb6807bde679f92a45`

## Troubleshooting

### Nodes not responding after start?
Wait 30-40 seconds, then check again:
```bash
./subnet-manager.sh status
```

### No blocks being mined?
Check peers first:
```bash
./subnet-manager.sh peers
```

### Need to restart?
```bash
./subnet-manager.sh restart
```

### Need fresh start?
```bash
./subnet-manager.sh stop
./subnet-manager.sh cleanup  # ⚠️ Removes all data!
./subnet-manager.sh start
```

## Using with MetaMask

**Network Name**: XDC Subnet Local  
**RPC URL**: http://localhost:8545  
**Chain ID**: 57539  
**Currency Symbol**: SDC

## Interactive Menu

Run without arguments for menu:
```bash
./subnet-manager.sh
```

## More Info

See `README-SUBNET-MANAGER.md` for comprehensive documentation.
