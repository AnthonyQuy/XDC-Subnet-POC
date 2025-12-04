/**
 * Contract service for interacting with the XDC Network Manager smart contract
 * Provides all methods needed to read and write contract state
 */

import Web3 from 'web3';
import type { Contract, ContractAbi } from 'web3';
import type { Member, TransactionReceipt } from '../types/contract';
import { NetworkManagerABI } from '../contracts/NetworkManager.abi';

const CONTRACT_ABI: ContractAbi = NetworkManagerABI as ContractAbi;


type EventListener = () => void;

/**
 * Contract service class for managing Web3 and contract interactions
 */
class ContractService {
  private web3: Web3 | null = null;
  private contract: Contract<typeof CONTRACT_ABI> | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();

  public isConnected = false;
  public account: string | null = null;
  public contractAddress: string | null = null;

  /**
   * Check if MetaMask is available
   */
  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  }

  /**
   * Get current network information from MetaMask
   */
  async getCurrentNetwork(): Promise<{ chainId: string; chainName: string } | null> {
    if (!this.isMetaMaskAvailable()) return null;

    try {
      const ethereum = (window as any).ethereum;
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);
      
      // Map known chain IDs to names
      const networkNames: Record<number, string> = {
        1: 'Ethereum Mainnet',
        3: 'Ropsten Testnet',
        4: 'Rinkeby Testnet',
        5: 'Goerli Testnet',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai',
        57539: 'XDC Subnet',
        // Add more as needed
      };

      return {
        chainId: chainIdDecimal.toString(),
        chainName: networkNames[chainIdDecimal] || `Unknown Network (${chainIdDecimal})`
      };
    } catch (error) {
      console.error('Error getting current network:', error);
      return null;
    }
  }

  /**
   * Switch to XDC Subnet network in MetaMask
   */
  async switchToXDCSubnet(): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed');
    }

    const ethereum = (window as any).ethereum;
    // Read chain ID from environment variable and convert to hex
    const chainId = import.meta.env.VITE_SUBNET_CHAIN_ID || '57539';
    const chainIdHex = '0x' + parseInt(chainId).toString(16);

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await this.addXDCSubnetNetwork();
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Add XDC Subnet network to MetaMask
   */
  async addXDCSubnetNetwork(): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed');
    }

    const ethereum = (window as any).ethereum;

    // Read configuration from environment variables
    const chainId = import.meta.env.VITE_SUBNET_CHAIN_ID || '57539';
    const chainIdHex = '0x' + parseInt(chainId).toString(16);
    const rpcUrl = import.meta.env.VITE_DEFAULT_RPC_URL || 'http://127.0.0.1:8545';

    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: 'XDC Subnet',
            rpcUrls: [rpcUrl],
            nativeCurrency: {
              name: 'XDC',
              symbol: 'XDC',
              decimals: 18,
            },
            blockExplorerUrls: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error adding XDC Subnet network:', error);
      throw new Error('Failed to add XDC Subnet network to MetaMask');
    }
  }

  /**
   * Connect via MetaMask
   */
  async connectWithMetaMask(contractAddr: string): Promise<void> {
    try {
      if (!this.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.');
      }

      const ethereum = (window as any).ethereum;

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Initialize Web3 with MetaMask provider
      this.web3 = new Web3(ethereum);
      this.account = accounts[0];
      this.contractAddress = contractAddr;

      // Initialize contract
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, contractAddr);

      const chainId = await this.web3.eth.getChainId();

      // Verify contract exists
      const code = await this.web3.eth.getCode(contractAddr);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract found at address ${contractAddr}. Please verify the contract address and network.`);
      }

      // Listen for account changes
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
          this.emit('stateChange');
        }
      });

      // Listen for chain changes
      ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      this.isConnected = true;
      this.saveConnectionState(true);
      this.emit('stateChange');

      return Promise.resolve();
    } catch (error) {
      this.isConnected = false;
      this.account = null;
      this.contractAddress = null;
      console.error('MetaMask connection error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect with MetaMask');
    }
  }

  /**
   * Connect to the XDC network and contract (Direct RPC)
   */
  async connect(rpcUrl: string, contractAddr: string): Promise<void> {
    try {
      // Initialize Web3 with the provided RPC URL
      this.web3 = new Web3(rpcUrl);

      const blockNumber = await this.web3.eth.getBlockNumber();

      // Get accounts (for XDC, typically use the first account or allow user to specify)
      const accounts = await this.web3.eth.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please ensure your wallet is connected.');
      }

      this.account = accounts[0];
      this.contractAddress = contractAddr;

      // Initialize contract
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, contractAddr);

      this.isConnected = true;
      this.saveConnectionState(false);
      this.emit('stateChange');

      return Promise.resolve();
    } catch (error) {
      this.isConnected = false;
      this.account = null;
      this.contractAddress = null;
      console.error('Connection error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to network');
    }
  }

  /**
   * Disconnect from the network
   */
  disconnect(): void {
    this.web3 = null;
    this.contract = null;
    this.isConnected = false;
    this.account = null;
    this.contractAddress = null;
    this.clearConnectionState();
    this.emit('stateChange');
  }

  /**
   * Restore connection from localStorage
   */
  async restoreConnection(): Promise<boolean> {
    const savedState = localStorage.getItem('xdc_connection');
    if (!savedState) return false;

    try {
      const { rpcUrl, contractAddress } = JSON.parse(savedState);
      await this.connect(rpcUrl, contractAddress);
      return true;
    } catch (error) {
      console.error('Failed to restore connection:', error);
      this.clearConnectionState();
      return false;
    }
  }

  /**
   * Save connection state to localStorage
   */
  private saveConnectionState(isMetaMask: boolean): void {
    if (this.web3 && this.contractAddress) {
      const state = {
        rpcUrl: isMetaMask ? 'metamask' : (this.web3.currentProvider as any)?.host || '',
        contractAddress: this.contractAddress,
        useMetaMask: isMetaMask
      };
      localStorage.setItem('xdc_connection', JSON.stringify(state));
    }
  }

  /**
   * Clear saved connection state
   */
  private clearConnectionState(): void {
    localStorage.removeItem('xdc_connection');
  }

  /**
   * Get the contract owner/manager address
   */
  async getOwner(): Promise<string> {
    this.ensureConnected();
    const owner = await this.contract!.methods.owner().call();
    return String(owner);
  }

  /**
   * Get all member addresses
   */
  async getAllMembers(): Promise<string[]> {
    this.ensureConnected();
    const members = await this.contract!.methods.getAllMembers().call();
    return Array.isArray(members) ? members.map(m => String(m)) : [];
  }

  /**
   * Check if an address is a registered member
   */
  async isMember(address: string): Promise<boolean> {
    this.ensureConnected();
    try {
      const isMember = await this.contract!.methods.isMember(address).call();
      return Boolean(isMember);
    } catch (error) {
      console.error('Error checking member existence:', error);
      return false;
    }
  }

  /**
   * Get member details by address
   * Returns member data with certSerialHex (X.509 certificate serial number)
   * @throws Error if member doesn't exist or data is corrupted
   */
  async getMember(address: string): Promise<Member> {
    this.ensureConnected();
    
    try {
      // Attempt to call getMember directly
      // Note: We use low-level call to catch RPC errors better
      const member = await this.contract!.methods.getMember(address).call() as any;
      
      // Contract returns NodeMember struct
      // Handle empty bytes data safely by checking if certSerialHex is valid
      const certSerialHex = member.certSerialHex || member[2];
      const certSerialHexStr = certSerialHex ? String(certSerialHex) : '0x';
      
      return {
        x500Name: String(member.x500Name || member[0] || ''),
        memberAddress: String(member.memberAddress || member[1] || address),
        certSerialHex: certSerialHexStr,
        isActive: Boolean(member.isActive !== undefined ? member.isActive : member[3]),
        joinedAt: Number(member.joinedAt || member[4] || 0),
        lastUpdated: Number(member.lastUpdated || member[5] || 0),
        platformVersion: Number(member.platformVersion || member[6] || 0),
        host: String(member.host || member[7] || ''),
        port: Number(member.port || member[8] || 0)
      };
    } catch (error: any) {
      // Check for specific error types
      if (error.message && error.message.includes('Internal JSON-RPC error')) {
        // This typically means the contract reverted
        const detailedError = error.data?.message || error.data?.data?.message || 'Member data may be corrupted or member does not exist';
        throw new Error(`Contract error for ${address}: ${detailedError}`);
      }
      
      if (error.message && error.message.includes('execution reverted')) {
        throw new Error(`Member ${address} not found or has invalid data in the contract`);
      }
      
      // Generic error handling
      throw new Error(`Failed to fetch member ${address}: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get transaction options for legacy (Type 0) transactions
   * XDC Subnet doesn't support EIP-1559, so we need to use legacy format
   */
  private async getLegacyTxOptions(): Promise<{ from: string; gasPrice: string }> {
    this.ensureConnected();
    const gasPrice = await this.web3!.eth.getGasPrice();
    return {
      from: this.account!,
      gasPrice: gasPrice.toString()
    };
  }

  /**
   * Add a new member to the network
   * @param address Member's blockchain address
   * @param x500Name X.500 Distinguished Name (e.g., "C=US, ST=CA, O=MyOrg, CN=node-abc")
   * @param certSerialHex X.509 certificate serial number in hex format (e.g., "0x1234...")
   * @param platformVersion Platform/node software version
   * @param host Network host address (IP or DNS)
   * @param port P2P/gRPC port number
   */
  async addMember(
    address: string,
    x500Name: string,
    certSerialHex: string,
    platformVersion: number | string,
    host: string,
    port: number | string
  ): Promise<TransactionReceipt> {
    this.ensureConnected();
    
    // Use legacy transaction format for XDC Subnet
    const txOptions = await this.getLegacyTxOptions();
    
    // Web3 handles bytes encoding automatically based on ABI
    const tx = await this.contract!.methods
      .addMember(
        address,
        x500Name,
        certSerialHex,
        Number(platformVersion),
        host,
        Number(port)
      )
      .send(txOptions);

    return tx as unknown as TransactionReceipt;
  }

  /**
   * Remove a member from the network
   */
  async removeMember(address: string): Promise<TransactionReceipt> {
    this.ensureConnected();
    
    // Use legacy transaction format for XDC Subnet
    const txOptions = await this.getLegacyTxOptions();
    
    const tx = await this.contract!.methods
      .removeMember(address)
      .send(txOptions);

    return tx as unknown as TransactionReceipt;
  }

  /**
   * Update member status (active/inactive)
   */
  async updateMemberStatus(address: string, isActive: boolean): Promise<TransactionReceipt> {
    this.ensureConnected();
    
    // Use legacy transaction format for XDC Subnet
    const txOptions = await this.getLegacyTxOptions();
    
    const tx = await this.contract!.methods
      .updateMemberStatus(address, isActive)
      .send(txOptions);

    return tx as unknown as TransactionReceipt;
  }

  /**
   * Update member details
   * @param address Member's blockchain address
   * @param x500Name X.500 Distinguished Name
   * @param certSerialHex X.509 certificate serial number in hex format
   * @param platformVersion Platform/node software version
   * @param host Network host address (IP or DNS)
   * @param port P2P/gRPC port number
   */
  async updateMemberDetails(
    address: string,
    x500Name: string,
    certSerialHex: string,
    platformVersion: number | string,
    host: string,
    port: number | string
  ): Promise<TransactionReceipt> {
    this.ensureConnected();
    
    // Use legacy transaction format for XDC Subnet
    const txOptions = await this.getLegacyTxOptions();
    
    // Web3 handles bytes encoding automatically based on ABI
    const tx = await this.contract!.methods
      .updateMemberDetails(
        address,
        x500Name,
        certSerialHex,
        Number(platformVersion),
        host,
        Number(port)
      )
      .send(txOptions);

    return tx as unknown as TransactionReceipt;
  }

  /**
   * Transfer contract ownership to a new manager
   */
  async transferOwnership(newOwner: string): Promise<TransactionReceipt> {
    this.ensureConnected();
    
    // Use legacy transaction format for XDC Subnet
    const txOptions = await this.getLegacyTxOptions();
    
    const tx = await this.contract!.methods
      .transferOwnership(newOwner)
      .send(txOptions);

    return tx as unknown as TransactionReceipt;
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<bigint> {
    this.ensureConnected();
    return await this.web3!.eth.getBlockNumber();
  }

  /**
   * Get latest block with timestamp
   */
  async getLatestBlock(): Promise<{ number: bigint; timestamp: bigint }> {
    this.ensureConnected();
    const block = await this.web3!.eth.getBlock('latest');
    return {
      number: block.number,
      timestamp: block.timestamp
    };
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    this.ensureConnected();
    return await this.web3!.eth.getGasPrice();
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<bigint> {
    this.ensureConnected();
    return await this.web3!.eth.getChainId();
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<bigint> {
    this.ensureConnected();
    return await this.web3!.eth.getBalance(address);
  }

  /**
   * Get RPC URL from saved connection
   */
  getRpcUrl(): string | null {
    const savedState = localStorage.getItem('xdc_connection');
    if (!savedState) return null;
    try {
      const { rpcUrl } = JSON.parse(savedState);
      return rpcUrl;
    } catch {
      return null;
    }
  }

  /**
   * Check if contract exists at address
   */
  async isContractDeployed(): Promise<boolean> {
    this.ensureConnected();
    try {
      const code = await this.web3!.eth.getCode(this.contractAddress!);
      return code !== '0x' && code !== '0x0';
    } catch {
      return false;
    }
  }

  /**
   * Measure RPC latency
   */
  async measureLatency(): Promise<number> {
    this.ensureConnected();
    const start = Date.now();
    try {
      await this.web3!.eth.getBlockNumber();
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  /**
   * Ensure connection is established
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.web3 || !this.contract) {
      throw new Error('Not connected to network. Please connect first.');
    }
  }

  /**
   * Event emitter functionality
   */
  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private emit(event: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener());
    }
  }
}

// Export singleton instance
const contractService = new ContractService();
export default contractService;
