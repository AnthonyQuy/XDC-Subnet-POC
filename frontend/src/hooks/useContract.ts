import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import contractService from '../utils/contractHelpers';
import type { ContractHookReturn, ContractState, MemberFormData } from '../types/contract';

/**
 * Custom hook for managing contract connection and state
 * Provides a clean interface to interact with the contract service
 */
export const useContract = (): ContractHookReturn => {
  const [state, setState] = useState<ContractState>({
    isConnected: false,
    account: '',
    contractAddress: '',
    owner: '',
    isOwner: false,
    members: [],
    selectedMember: null,
    loading: false,
    error: null,
  });

  const syncState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: contractService.isConnected,
      account: contractService.account || '',
      contractAddress: contractService.contractAddress || '',
    }));
  }, []);

  const fetchContractData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const ownerAddress = await contractService.getOwner();
      const memberAddresses = await contractService.getAllMembers();
      const currentAccount = contractService.account || '';

      setState(prev => ({
        ...prev,
        owner: ownerAddress,
        isOwner: ownerAddress.toLowerCase() === currentAccount.toLowerCase(),
        members: memberAddresses,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    }
  }, []);

  useEffect(() => {
    const handleStateChange = () => {
      syncState();

      if (contractService.isConnected) {
        fetchContractData();
      } else {
        setState(prev => ({
          ...prev,
          owner: '',
          isOwner: false,
          members: [],
          selectedMember: null,
        }));
      }
    };

    contractService.on('stateChange', handleStateChange);

    const initConnection = async () => {
      const restored = await contractService.restoreConnection();
      if (restored) {
        syncState();
        await fetchContractData();
        toast.success('Connection restored');
      }
    };

    initConnection();

    return () => {
      contractService.off('stateChange', handleStateChange);
    };
  }, [syncState, fetchContractData]);

  const connect = useCallback(async (rpcUrl: string, contractAddr: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await contractService.connect(rpcUrl, contractAddr);
      syncState();
      await fetchContractData();

      toast.success('Successfully connected to XDC network and contract');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Connection error: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [syncState, fetchContractData]);

  const connectWithMetaMask = useCallback(async (contractAddr: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await contractService.connectWithMetaMask(contractAddr);
      syncState();
      await fetchContractData();

      toast.success('Successfully connected with MetaMask!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`MetaMask connection error: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [syncState, fetchContractData]);

  const disconnect = useCallback(() => {
    contractService.disconnect();
    toast.info('Wallet disconnected');
  }, []);

  const selectMember = useCallback(async (address: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const memberDetails = await contractService.getMember(address);
      setState(prev => ({
        ...prev,
        selectedMember: memberDetails,
        loading: false
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      // Provide more specific error message to user
      if (errorMessage.includes('Contract error')) {
        toast.error(`Unable to load member: ${errorMessage}`);
      } else if (errorMessage.includes('not found or has invalid data')) {
        toast.error(`Member data error: This member may have been removed or has corrupted data in the contract.`);
      } else if (errorMessage.includes('Internal JSON-RPC error') || errorMessage.includes('execution reverted')) {
        toast.error('Contract error: Unable to fetch member details. The member may have been removed.');
      } else {
        toast.error(`Error fetching member details: ${errorMessage}`);
      }
    }
  }, []);

  // Add member
  const addMember = useCallback(async (memberData: MemberFormData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const tx = await contractService.addMember(
        memberData.address,
        memberData.x500Name,
        memberData.certSerialHex,
        memberData.platformVersion,
        memberData.host,
        memberData.port
      );

      const toastMessage = `Member added successfully! Transaction: ${tx.transactionHash}`;
      toast.success(toastMessage, {
        autoClose: 10000,
      });

      await fetchContractData();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Error adding member: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchContractData]);

  // Remove member
  const removeMember = useCallback(async (address: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await contractService.removeMember(address);
      toast.success('Member removed successfully!');

      await fetchContractData();
      setState(prev => ({ ...prev, selectedMember: null }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Error removing member: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchContractData]);

  // Update member status
  const updateMemberStatus = useCallback(async (address: string, isActive: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await contractService.updateMemberStatus(address, isActive);
      toast.success(`Member status updated to ${isActive ? 'active' : 'inactive'}`);

      // Refresh selected member if it's the current one
      if (state.selectedMember?.memberAddress === address) {
        const updatedMember = await contractService.getMember(address);
        setState(prev => ({ ...prev, selectedMember: updatedMember }));
      }

      await fetchContractData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Error updating status: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.selectedMember, fetchContractData]);

  // Update member details
  const updateMemberDetails = useCallback(async (memberData: MemberFormData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await contractService.updateMemberDetails(
        memberData.address,
        memberData.x500Name,
        memberData.certSerialHex,
        memberData.platformVersion,
        memberData.host,
        memberData.port
      );

      toast.success('Member details updated successfully!');

      // Refresh contract data to get updated member list
      await fetchContractData();

      // Refresh selected member if it's the current one
      if (state.selectedMember?.memberAddress === memberData.address) {
        const updatedMember = await contractService.getMember(memberData.address);
        setState(prev => ({ ...prev, selectedMember: updatedMember }));
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Error updating member: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.selectedMember, fetchContractData]);

  // Transfer ownership
  const transferOwnership = useCallback(async (newOwnerAddress: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await contractService.transferOwnership(newOwnerAddress);
      toast.success('Owner role transferred successfully!');
      await fetchContractData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(`Error transferring owner role: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchContractData]);

  return {
    // State
    ...state,

    // Actions
    connect,
    connectWithMetaMask,
    disconnect,
    selectMember,
    addMember,
    removeMember,
    updateMemberStatus,
    updateMemberDetails,
    transferOwnership,
  };
};
