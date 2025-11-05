import Web3 from 'web3';

// NetworkManager Contract ABI
const NetworkManagerABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldManager",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newManager",
        "type": "address"
      }
    ],
    "name": "ManagerChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "nodeAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "x500Name",
        "type": "string"
      }
    ],
    "name": "MemberAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "nodeAddress",
        "type": "address"
      }
    ],
    "name": "MemberRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "nodeAddress",
        "type": "address"
      }
    ],
    "name": "MemberUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "x500Name",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "publicKey",
        "type": "bytes"
      }
    ],
    "name": "addMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMembers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      }
    ],
    "name": "getMember",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "x500Name",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "nodeAddress",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "publicKey",
            "type": "bytes"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "joinedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdated",
            "type": "uint256"
          }
        ],
        "internalType": "struct NetworkManager.NodeMember",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      }
    ],
    "name": "isMember",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "manager",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "memberAddresses",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "memberCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      }
    ],
    "name": "removeMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newManager",
        "type": "address"
      }
    ],
    "name": "transferManagerRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "x500Name",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "publicKey",
        "type": "bytes"
      }
    ],
    "name": "updateMemberDetails",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "updateMemberStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class ContractService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.contractAddress = null;
    this.account = null;
    this.isConnected = false;
  }

  /**
   * Initialize Web3 and connect to the XDC network
   * @param {string} rpcUrl - The RPC URL for the XDC subnet
   * @returns {boolean} - Connection status
   */
  async initWeb3(rpcUrl = process.env.REACT_APP_DEFAULT_RPC_URL || 'http://localhost:8545') {
    try {
      // Check if Web3 is injected by browser wallets like MetaMask
      if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          return false;
        }
      } 
      // Otherwise, use the provided RPC URL
      else {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      }

      // Get the network ID
      
      // Get the current account
      const accounts = await this.web3.eth.getAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.isConnected = true;
      } else {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize the contract with the given address
   * @param {string} contractAddress - The address of the NetworkManager contract
   * @returns {boolean} - Initialization status
   */
  initContract(contractAddress) {
    try {
      if (!this.web3) {
        return false;
      }

      this.contractAddress = contractAddress;
      this.contract = new this.web3.eth.Contract(NetworkManagerABI, contractAddress);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current manager address
   * @returns {string} - Manager address
   */
  async getManager() {
    try {
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      return await this.contract.methods.manager().call();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all member addresses
   * @returns {Array<string>} - Array of member addresses
   */
  async getAllMembers() {
    try {
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      return await this.contract.methods.getAllMembers().call();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get member count
   * @returns {number} - Number of members
   */
  async getMemberCount() {
    try {
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      return await this.contract.methods.memberCount().call();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get details for a specific member
   * @param {string} address - Member's address
   * @returns {Object} - Member details
   */
  async getMember(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      const member = await this.contract.methods.getMember(address).call();
      
      // Format the member data
      return {
        x500Name: member[0],
        nodeAddress: member[1],
        publicKey: this.web3.utils.hexToAscii(member[2]),
        isActive: member[3],
        joinedAt: new Date(member[4] * 1000).toLocaleString(),
        lastUpdated: new Date(member[5] * 1000).toLocaleString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if an address is a member
   * @param {string} address - Address to check
   * @returns {boolean} - True if address is a member
   */
  async isMember(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      return await this.contract.methods.isMember(address).call();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a new member
   * @param {string} address - Member's address
   * @param {string} x500Name - Member's X500 name
   * @param {string} publicKey - Member's public key
   * @returns {Object} - Transaction receipt
   */
  async addMember(address, x500Name, publicKey) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account is not initialized');
      }
      
      const encodedPublicKey = this.web3.utils.asciiToHex(publicKey);
      
      const tx = await this.contract.methods
        .addMember(address, x500Name, encodedPublicKey)
        .send({ from: this.account });
      
      return tx;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a member
   * @param {string} address - Member's address to remove
   * @returns {Object} - Transaction receipt
   */
  async removeMember(address) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account is not initialized');
      }
      
      const tx = await this.contract.methods
        .removeMember(address)
        .send({ from: this.account });
      
      return tx;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update member status
   * @param {string} address - Member's address
   * @param {boolean} isActive - New status
   * @returns {Object} - Transaction receipt
   */
  async updateMemberStatus(address, isActive) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account is not initialized');
      }
      
      const tx = await this.contract.methods
        .updateMemberStatus(address, isActive)
        .send({ from: this.account });
      
      return tx;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update member details
   * @param {string} address - Member's address
   * @param {string} x500Name - New X500 name
   * @param {string} publicKey - New public key
   * @returns {Object} - Transaction receipt
   */
  async updateMemberDetails(address, x500Name, publicKey) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account is not initialized');
      }
      
      const encodedPublicKey = this.web3.utils.asciiToHex(publicKey);
      
      const tx = await this.contract.methods
        .updateMemberDetails(address, x500Name, encodedPublicKey)
        .send({ from: this.account });
      
      return tx;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transfer manager role
   * @param {string} newManager - Address of the new manager
   * @returns {Object} - Transaction receipt
   */
  async transferManagerRole(newManager) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account is not initialized');
      }
      
      const tx = await this.contract.methods
        .transferManagerRole(newManager)
        .send({ from: this.account });
      
      return tx;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the current connected account
   * @returns {string} - Current account address
   */
  getCurrentAccount() {
    return this.account;
  }
}

// Create a singleton instance
const contractService = new ContractService();
export default contractService;
