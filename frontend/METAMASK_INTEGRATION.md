# MetaMask Integration Guide

The XDC Network Manager frontend supports **two connection methods**: MetaMask wallet integration and Direct RPC connection. This guide focuses on the MetaMask integration features.

## Features Added

### 1. MetaMask Connection Support
- **One-click MetaMask connection** - Connect using your MetaMask wallet
- **Automatic account switching** - Automatically detects when you switch accounts in MetaMask
- **Network change handling** - Reloads page when you switch networks
- **Persistent connection** - Remembers your connection method

### 2. Dual Connection Options

#### Option 1: Connect with MetaMask (Recommended)
- **User-friendly** - Connect with your personal MetaMask wallet
- **Secure** - All transactions require MetaMask approval
- **Account control** - Use any account configured in MetaMask
- **Multi-network** - Easy to switch between networks

**Requirements:**
- MetaMask browser extension installed
- Contract address

#### Option 2: Connect Directly to RPC
- **Direct node connection** - Connect directly to subnet RPC
- **Development mode** - Uses node's default account
- **No wallet needed** - Works without MetaMask

**Requirements:**
- RPC URL (e.g., `http://127.0.0.1:8545`)
- Contract address

## How to Use

### Using MetaMask

1. **Install MetaMask**
   - Install the MetaMask browser extension
   - Create or import a wallet

2. **Add XDC Subnet Network to MetaMask**
   - Open MetaMask
   - Click Networks → Add Network → Add a network manually
   - Enter network details:
     ```
     Network Name: XDC Subnet
     New RPC URL: http://127.0.0.1:8545
     Chain ID: 57539
     Currency Symbol: XDC
     Block Explorer URL: (leave empty for local subnet)
     ```
   
   **Note:** The app can automatically add this network for you! Just click the "Add XDC Subnet Network" button when prompted.

3. **Import Account (Optional)**
   - If you want to use a pre-funded validator account, import its private key
   - Click MetaMask menu → Import Account → Select "Private Key"
   - Extract the private key from your keystore file in `../subnet/xdcchain1/keystore/`
   - **Warning:** Never share or expose private keys. Only use this for local development.

4. **Connect to DApp**
   - Enter contract address: `0x77627475E80d57c66a2B7ad57400802b85478d6e`
   - Click "Connect with MetaMask"
   - Approve the connection in MetaMask popup

### Using Direct RPC

1. **Start Your Subnet**
   - Ensure your XDC subnet is running
   - Verify nodes are accessible at the RPC endpoint

2. **Connect**
   - Enter RPC URL: `http://127.0.0.1:8545`
   - Enter Contract Address: `0x77627475E80d57c66a2B7ad57400802b85478d6e`
   - Click "Connect" button
   
3. **Account Used**
   - Uses the first unlocked account from the node's keystore
   - Ensure the account has sufficient XDC balance for gas fees

## Benefits of MetaMask

✅ **Better Security** - All transactions require explicit approval  
✅ **Account Flexibility** - Switch between multiple accounts easily  
✅ **User Experience** - Familiar wallet interface  
✅ **Transaction History** - View all transactions in MetaMask  
✅ **Gas Management** - See and adjust gas fees  
✅ **Production Ready** - Same experience as mainnet DApps

## Technical Implementation

### Technical Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite 6 (build tool)
- Web3.js 4.16
- React Bootstrap 2

**Modified Files:**

1. **`src/utils/contractHelpers.ts`**
   - `isMetaMaskAvailable()` - Detects MetaMask availability
   - `connectWithMetaMask()` - Initializes MetaMask connection
   - `getCurrentNetwork()` - Gets current MetaMask network
   - `switchToXDCSubnet()` - Switches to XDC Subnet network
   - `addXDCSubnetNetwork()` - Adds XDC Subnet to MetaMask
   - Event listeners for account/network changes

2. **`src/components/ConnectionPanel.tsx`**
   - Dual-mode connection UI (MetaMask + RPC)
   - Automatic network detection display
   - MetaMask availability detection
   - Network switching buttons
   - Connection state persistence

3. **`src/hooks/useContract.ts`**
   - `connectWithMetaMask()` hook function
   - State management for MetaMask connections
   - Account and network change handling

4. **`src/types/contract.ts`**
   - `connectWithMetaMask` interface definition
   - TypeScript type safety for connection methods

5. **`src/App.tsx`**
   - Passes connection methods to components
   - Global state management

### Connection Flow

**MetaMask Connection Flow:**
```
1. User clicks "Connect with MetaMask"
   ↓
2. Check MetaMask availability
   ↓
3. Request account access (MetaMask popup)
   ↓
4. User approves in MetaMask
   ↓
5. Detect current network (Chain ID check)
   ↓
6. If wrong network → Show "Switch Network" button
   ↓
7. Initialize Web3 with MetaMask provider
   ↓
8. Create contract instance with user's account
   ↓
9. Fetch network data and member list
   ↓
10. Setup event listeners:
    - accountsChanged → Update UI with new account
    - chainChanged → Reload page
    ↓
11. Save connection state to localStorage
```

**RPC Connection Flow:**
```
1. User enters RPC URL and contract address
   ↓
2. Validate inputs
   ↓
3. Initialize Web3 with HTTP provider
   ↓
4. Get first unlocked account from node
   ↓
5. Create contract instance
   ↓
6. Fetch network data and member list
   ↓
7. Save connection state to localStorage
```

### Event Handling

The MetaMask integration implements robust event handling:

**`accountsChanged` Event:**
- Triggered when user switches accounts in MetaMask
- Automatically updates the UI with the new account
- Refetches contract data with new account context
- Shows toast notification of account change

**`chainChanged` Event:**
- Triggered when user switches networks in MetaMask
- Reloads the page to reinitialize with new network
- Prevents stale state from previous network
- Ensures contract ABI matches network

**Connection Persistence:**
- Saves connection method to localStorage
- Automatically reconnects on page reload
- Stores last used contract address and RPC URL
- Clears state on explicit disconnect

## Troubleshooting

### MetaMask Not Detected
**Problem:** "MetaMask not detected" warning shows  
**Solution:** Install MetaMask browser extension from https://metamask.io

### Wrong Network
**Problem:** Transactions fail or show wrong data  
**Solution:** 
1. Check MetaMask is connected to correct network (Chain ID: 57539)
2. Manually add network if not present

### Connection Rejected
**Problem:** MetaMask popup shows "Connection rejected"  
**Solution:** Click "Connect with MetaMask" again and approve the connection

### Account Shows 0 Balance
**Problem:** MetaMask account has no XDC balance  
**Solution:** 
1. Import a pre-funded validator account from subnet keystore
2. Use the subnet faucet if available (see subnet documentation)
3. Transfer XDC from another funded account
4. Or use direct RPC connection with pre-funded node account

### Transactions Fail
**Problem:** Transactions are rejected or fail  
**Solution:**
1. Ensure account has sufficient XDC balance for gas fees
2. Verify you're connected to the correct network (Chain ID: 57539)
3. Check contract address is correct (0x77627475E80d57c66a2B7ad57400802b85478d6e)
4. For manager operations, ensure you're the current manager
5. Try increasing gas limit in MetaMask advanced settings
6. Check browser console for detailed error messages

### MetaMask Locks During Transaction
**Problem:** MetaMask locks while transaction is pending  
**Solution:**
1. Unlock MetaMask
2. Transaction should still be pending
3. Check MetaMask activity tab for pending transactions
4. Wait for confirmation or speed up/cancel if needed

### Multiple MetaMask Popups
**Problem:** Multiple connection requests appear  
**Solution:**
1. Only click "Connect with MetaMask" once
2. Wait for popup to appear (may take a few seconds)
3. If popup doesn't appear, check if MetaMask is locked
4. Ensure popup blocker isn't blocking MetaMask

## Related Documentation

- **[Main README](./README.md)** - Complete frontend documentation
- **[Network Detection Guide](./NETWORK_DETECTION.md)** - Automatic network detection features
- **[Subnet Setup](../subnet/README-SUBNET-MANAGER.md)** - XDC Subnet configuration

## Support Resources

- MetaMask Documentation: https://docs.metamask.io
- Web3.js Documentation: https://web3js.readthedocs.io
- XDC Network: https://xdc.org
- Project Repository: Check README.md for repository link

## Development Notes

### State Management
- Connection state persists in localStorage (`networkManagerConnection`)
- Stores: connection method, contract address, RPC URL, account
- Auto-reconnect on page reload if previously connected
- State cleared on disconnect or connection errors

### Error Handling
- All errors show user-friendly toast notifications
- MetaMask rejection codes handled appropriately
- Network mismatch detected and reported
- Contract interaction errors logged to console

### User Feedback
- Loading states during connection process
- Success/error toast notifications
- Real-time network status display
- Visual indicators for connection method
- Account address display in navigation

### Environment Variables
Uses Vite environment variables (prefix with `VITE_`):
- `VITE_DEFAULT_RPC_URL` - Default RPC endpoint
- `VITE_DEFAULT_CONTRACT_ADDRESS` - Default contract address
- `VITE_SUBNET_CHAIN_ID` - Expected chain ID (57539)

## Best Practices

### For Users
1. Always verify you're on the correct network before transactions
2. Review all transaction details in MetaMask before approving
3. Keep MetaMask extension updated
4. Use hardware wallets for high-value accounts
5. Never share your seed phrase or private keys

### For Developers
1. Always handle MetaMask connection rejections gracefully
2. Implement proper event listener cleanup
3. Validate network before every transaction
4. Provide clear error messages to users
5. Test with both MetaMask and RPC connections
6. Handle edge cases (locked MetaMask, network switches, etc.)

## Future Enhancements

Potential improvements:
- [ ] WalletConnect support for mobile wallets
- [ ] Coinbase Wallet integration
- [ ] Ledger/Trezor hardware wallet support
- [ ] Multi-wallet provider switching
- [ ] ENS name resolution support
- [ ] Transaction history tracking
- [ ] Gas price optimization suggestions
- [ ] Network latency monitoring
- [ ] Batch transaction support
