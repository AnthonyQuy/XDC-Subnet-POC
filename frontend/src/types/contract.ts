/**
 * Type definitions for XDC Network Manager contract interactions
 * 
 * IMPORTANT: These types match the NetworkManager.sol contract structure
 * The contract uses certSerialHex (X.509 certificate serial) NOT publicKey
 */

export interface Member {
  x500Name: string;
  memberAddress: string;
  certSerialHex: string; // X.509 certificate serial number in hex format
  isActive: boolean;
  joinedAt: number;
  lastUpdated: number;
  platformVersion: number;
  host: string;
  port: number;
}

export interface MemberFormData {
  address: string;
  x500Name: string;
  certSerialHex: string; // X.509 certificate serial number in hex format (e.g., 0x1234...)
  platformVersion: number | string;
  host: string;
  port: number | string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MemberDataValidation {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedCertSerial?: string; // Sanitized X.509 certificate serial hex
}

export interface ContractState {
  isConnected: boolean;
  account: string;
  contractAddress: string;
  owner: string;
  isOwner: boolean;
  members: string[];
  selectedMember: Member | null;
  loading: boolean;
  error: string | null;
}

export interface ContractHookReturn extends ContractState {
  connect: (rpcUrl: string, contractAddr: string) => Promise<void>;
  connectWithMetaMask: (contractAddr: string) => Promise<void>;
  disconnect: () => void;
  selectMember: (address: string) => Promise<void>;
  addMember: (memberData: MemberFormData) => Promise<{ success: boolean; error?: string }>;
  removeMember: (address: string) => Promise<void>;
  updateMemberStatus: (address: string, isActive: boolean) => Promise<void>;
  updateMemberDetails: (memberData: MemberFormData) => Promise<{ success: boolean; error?: string }>;
  transferOwnership: (newOwnerAddress: string) => Promise<void>;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  status: boolean;
  [key: string]: any;
}
