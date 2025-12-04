# Network Detection & Auto-Switching Feature

## Overview

The XDC Network Manager frontend includes **automatic network detection** and **one-click network switching** for MetaMask users. This feature ensures users are always on the correct XDC Subnet network before connecting, preventing transaction failures and providing a seamless user experience.

## Features

### 1. **Real-Time Network Detection**
- ✅ Automatically detects current MetaMask network
- ✅ Shows network name and Chain ID
- ✅ Color-coded status (green = correct, yellow/red = wrong)
- ✅ Updates immediately when you switch networks in MetaMask

### 2. **Network Status Display**
Shows on the connection page:
```
┌──────────────────────────────────────┐
│ ✓ Current Network Status             │
│ Network: XDC Subnet                  │
│ Chain ID: 57539              [✓ Correct Network]
└──────────────────────────────────────┘
```

Or if wrong network:
```
┌──────────────────────────────────────┐
│ ⚠ Current Network Status             │
│ Network: Ethereum Mainnet            │
│ Chain ID: 1                  [✗ Wrong Network]
│                                      │
│ Expected Network:                    │
│ Network: XDC Subnet                  │
│ Chain ID: 57539                      │
│ RPC URL: http://127.0.0.1:8545      │
│                                      │
│ [Switch to XDC Subnet]              │
│ [Add XDC Subnet Network]            │
└──────────────────────────────────────┘
```

### 3. **One-Click Network Switching**
Two action buttons appear when on wrong network:

**"Switch to XDC Subnet" Button**
- Attempts to switch to XDC Subnet (Chain ID 57539)
- If network not configured, automatically triggers "Add Network" flow
- Shows toast notification on success/failure
- Uses MetaMask's `wallet_switchEthereumChain` RPC method

**"Add XDC Subnet Network" Button**
- Adds XDC Subnet configuration to MetaMask
- Pre-configured with correct settings:
  - Chain ID: 57539 (0xe0e3 in hexadecimal)
  - RPC URL: http://127.0.0.1:8545
  - Currency Symbol: XDC
  - Decimals: 18
- Uses MetaMask's `wallet_addEthereumChain` RPC method

## User Experience Scenarios

### Scenario 1: User on Wrong Network

1. User opens connection page
2. Sees yellow/red warning: "Wrong Network"
3. Current network displayed (e.g., "Ethereum Mainnet - Chain ID: 1")
4. Expected network details shown below
5. Two action buttons visible:
   - "Switch to XDC Subnet"
   - "Add XDC Subnet Network"
6. User clicks "Switch to XDC Subnet"
7. MetaMask popup appears requesting permission
8. User approves network switch
9. Success! Network status indicator turns green
10. "Connect with MetaMask" button becomes enabled

### Scenario 2: XDC Subnet Not Added to MetaMask

1. User clicks "Switch to XDC Subnet"
2. MetaMask returns error 4902 (network not found)
3. Application automatically triggers "Add Network" flow
4. MetaMask popup asks to add XDC Subnet
5. Pre-filled network details displayed:
   - Network Name: XDC Subnet
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 57539
   - Currency: XDC
6. User approves addition
7. Network added and automatically switched
8. Success notification displayed
9. User can now connect

### Scenario 3: User Already on Correct Network

1. User opens connection page
2. Sees green success indicator: "Correct Network"
3. Displays: "XDC Subnet (Chain ID: 57539)"
4. No action buttons needed
5. "Connect with MetaMask" button is ready to use
6. User can proceed directly to connect

### Scenario 4: Real-Time Network Change Detection

1. User connected and browsing application
2. User switches network in MetaMask (e.g., to Ethereum Mainnet)
3. Application instantly detects the chain change
4. Page automatically reloads
5. User returned to connection screen
6. Network status shows current network
7. Can switch back to XDC Subnet if needed

## Technical Implementation

### Network Detection

```typescript
// Automatically runs on component mount
const network = await contractService.getCurrentNetwork();
// Returns: { chainId: "57539", chainName: "XDC Subnet" }
```

### Network Switching

```typescript
// Uses MetaMask's wallet_switchEthereumChain
await contractService.switchToXDCSubnet();
```

### Network Addition

```typescript
// Uses MetaMask's wallet_addEthereumChain
await contractService.addXDCSubnetNetwork();
```

### Real-Time Updates

```typescript
// Listens to MetaMask chainChanged event
ethereum.on('chainChanged', () => {
  detectNetwork(); // Re-check network
});
```

## Configuration

### Expected Network Settings

The expected network is configured in `ConnectionPanel.tsx`:

```typescript
const EXPECTED_CHAIN_ID = '57539';  // Decimal format
const EXPECTED_NETWORK_NAME = 'XDC Subnet';
```

These values can also be configured via environment variables in `.env`:
```bash
VITE_SUBNET_CHAIN_ID=57539
```

### MetaMask Network Configuration

The network configuration object used when adding to MetaMask:

```typescript
{
  chainId: '0xe0e3',  // 57539 in hexadecimal (required format)
  chainName: 'XDC Subnet',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'XDC',
    symbol: 'XDC',
    decimals: 18
  },
  blockExplorerUrls: []  // Optional, empty for local subnet
}
```

**Note:** Chain ID must be provided in hexadecimal format (0x-prefixed) when using MetaMask RPC methods.

## Technical Implementation

### Files Modified

#### 1. `src/utils/contractHelpers.ts`
**New Methods:**
- `getCurrentNetwork()` - Detects current MetaMask network
  - Returns: `{ chainId: string, chainName: string }`
  - Uses `eth_chainId` RPC method
  
- `switchToXDCSubnet()` - Switches to XDC Subnet network
  - Uses `wallet_switchEthereumChain` RPC method
  - Handles error 4902 (network not found)
  - Automatically calls `addXDCSubnetNetwork()` if needed
  
- `addXDCSubnetNetwork()` - Adds XDC Subnet to MetaMask
  - Uses `wallet_addEthereumChain` RPC method
  - Pre-configures all network parameters
  - Returns success/failure status

**Event Listeners:**
- `chainChanged` - Listens for network switches
- Automatically triggers page reload on network change

#### 2. `src/components/ConnectionPanel.tsx`
**New Features:**
- Network detection on component mount
- Real-time network change listener
- Network status UI component with color-coded badges
- Conditional rendering of switch/add network buttons
- Visual indicators (success/warning/error states)
- Expected vs actual network comparison display

**State Management:**
```typescript
const [currentNetwork, setCurrentNetwork] = useState<{
  chainId: string;
  chainName: string;
} | null>(null);
const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
```

**UI Components:**
- Network status badge (green/yellow/red)
- Current network information display
- Expected network information display
- Action buttons (conditionally rendered)
- Loading states during network operations

## Benefits

### For Users
- ✅ No manual network configuration needed
- ✅ Clear, real-time visual feedback about network status
- ✅ One-click fix for wrong network
- ✅ Prevents transaction failures due to wrong network
- ✅ Automatic network detection and validation
- ✅ Seamless onboarding experience
- ✅ Reduces confusion during setup
- ✅ Works across browser restarts

### For Developers
- ✅ Reduces support requests about network configuration
- ✅ Better user onboarding and retention
- ✅ Fewer connection failures and error states
- ✅ Clearer, actionable error messaging
- ✅ Built-in validation before transactions
- ✅ Consistent network state management
- ✅ Easy to modify network configuration

## Error Handling

The network detection feature includes comprehensive error handling:

### User Rejects Network Switch
**Error Code:** 4001 (User rejected request)
```
- Toast notification: "Network switch cancelled"
- Status remains: "Wrong Network"
- Buttons remain available
- User can retry at any time
```

### User Rejects Network Addition
**Error Code:** 4001 (User rejected request)
```
- Toast notification: "Failed to add network"
- Network not added to MetaMask
- User can manually add via MetaMask settings
- Or retry using "Add XDC Subnet Network" button
```

### Network Not Found (Auto-Recovery)
**Error Code:** 4902 (Unrecognized chain ID)
```
- Automatically triggers "Add Network" flow
- User sees MetaMask popup to add network
- Seamless recovery without error message
- Network added and switched in one flow
```

### MetaMask Not Available
```
- Warning displayed: "MetaMask not detected"
- Network detection features disabled
- Direct RPC connection option still available
- Link to MetaMask installation page provided
```

### MetaMask Locked
```
- Detection temporarily paused
- Status shows "Unable to detect network"
- Prompts user to unlock MetaMask
- Auto-detects when unlocked
```

### Network RPC Unreachable
```
- Error caught during network switch attempt
- Toast: "Unable to connect to network"
- User advised to check RPC endpoint accessibility
- Manual network configuration option available
```

## Testing Checklist

### Basic Functionality
- [ ] Network detection works on initial page load
- [ ] Status updates instantly when switching networks in MetaMask
- [ ] "Switch to XDC Subnet" button functions correctly
- [ ] "Add XDC Subnet Network" button functions correctly
- [ ] Correct network displays green success indicator
- [ ] Wrong network displays yellow/red warning indicator
- [ ] Current and expected network details shown accurately

### User Interactions
- [ ] Toast notifications appear on all success/error states
- [ ] Buttons remain responsive after errors
- [ ] Multiple rapid clicks handled gracefully
- [ ] Works when MetaMask is locked then unlocked
- [ ] Works when MetaMask is installed mid-session
- [ ] Connection process continues smoothly after network switch

### Edge Cases
- [ ] Event listeners properly cleanup on component unmount
- [ ] No memory leaks from event listeners
- [ ] Handles network switch during pending transactions
- [ ] Works with MetaMask on different browser tabs
- [ ] Correct behavior when user manually adds network
- [ ] Handles rapid network switching in MetaMask
- [ ] Page reload after chainChanged event works correctly

### Browser Compatibility
- [ ] Chrome/Chromium browsers
- [ ] Firefox
- [ ] Brave browser
- [ ] Edge browser
- [ ] Safari (with MetaMask Flask if needed)

## Future Enhancements

Potential improvements for network detection:

### Network Features
- [ ] Support multiple approved networks (mainnet, testnet, devnet)
- [ ] Remember user's preferred network in localStorage
- [ ] Show real-time gas prices for different networks
- [ ] Testnet/Mainnet toggle with automatic switching
- [ ] Network health indicators (latency, block height)
- [ ] Multi-chain support for XDC ecosystem

### User Experience
- [ ] Network suggestion based on contract deployment
- [ ] Quick switch between frequently used networks
- [ ] Network bookmarking for easy access
- [ ] Network performance metrics display
- [ ] Automatic network selection based on contract

### Advanced Features
- [ ] Custom RPC endpoint configuration per network
- [ ] Fallback RPC endpoints for reliability
- [ ] Network latency testing and optimization
- [ ] Load balancing across multiple RPC endpoints
- [ ] Network status dashboard

## Troubleshooting

### Network Detection Not Working
**Problem:** Network status not showing  
**Solution:** 
- Ensure MetaMask is installed
- Check browser console for errors
- Refresh page

### Switch Network Fails
**Problem:** "Switch to XDC Subnet" button doesn't work  
**Solution:**
- Try "Add XDC Subnet Network" first
- Check MetaMask is unlocked
- Verify RPC URL is accessible

### Wrong Chain ID Shown
**Problem:** Shows incorrect chain ID  
**Solution:**
1. Verify MetaMask is on correct network
2. Try switching networks manually in MetaMask
3. Reload page to refresh detection
4. Clear browser cache and localStorage
5. Check browser console for errors

### Network Switch Doesn't Persist
**Problem:** Network reverts after page reload  
**Solution:**
1. Ensure network is properly saved in MetaMask
2. Check MetaMask isn't set to auto-switch networks
3. Verify no other dApps are changing network
4. Try adding network again using "Add XDC Subnet Network"

### Buttons Don't Appear
**Problem:** Switch/Add network buttons not showing  
**Solution:**
1. Verify MetaMask is installed and detected
2. Check browser console for JavaScript errors
3. Ensure you're on the connection page
4. Reload page to reinitialize components
5. Try disconnecting and reconnecting MetaMask

### Rapid Network Detection Updates
**Problem:** Network status flickers/updates too frequently  
**Solution:**
1. Normal behavior during network switching
2. Wait for network switch to complete
3. If persists, check for conflicting browser extensions
4. Verify stable RPC endpoint connection

## Performance Considerations

### Optimization Strategies
- Network detection uses debouncing to prevent excessive checks
- Event listeners properly cleaned up to prevent memory leaks
- LocalStorage used to cache last known network state
- Minimal re-renders through efficient state management
- Async operations don't block UI interactions

### Resource Usage
- Network detection adds minimal overhead (~50ms on page load)
- Event listeners are lightweight and passive
- No polling - purely event-driven architecture
- Toast notifications automatically dismiss to free resources

## Security Considerations

### Network Validation
- Always validates chain ID before transactions
- Prevents transactions on wrong networks
- Network configuration hardcoded (not user-modifiable)
- RPC URLs validated before adding to MetaMask

### User Protection
- Clear warnings when on wrong network
- Prevents accidental cross-network transactions
- Explicit user approval required for all network changes
- Network details displayed before addition

## Related Documentation

- **[Main README](./README.md)** - Complete frontend documentation
- **[MetaMask Integration Guide](./METAMASK_INTEGRATION.md)** - Full MetaMask integration details
- **[Subnet Setup](../subnet/README-SUBNET-MANAGER.md)** - XDC Subnet configuration and deployment

## Additional Resources

- **MetaMask Chain IDs:** https://chainlist.org
- **Web3.js Provider Events:** https://web3js.readthedocs.io/en/latest/web3-eth.html#providers
- **EIP-3085 (Add Ethereum Chain):** https://eips.ethereum.org/EIPS/eip-3085
- **EIP-3326 (Switch Ethereum Chain):** https://eips.ethereum.org/EIPS/eip-3326
