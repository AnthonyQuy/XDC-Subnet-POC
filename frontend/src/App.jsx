import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Tab, Tabs, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Navigation from './components/Navigation';
import ConnectionPanel from './components/ConnectionPanel';
import MemberList from './components/MemberList';
import MemberDetails from './components/MemberDetails';
import AddMemberForm from './components/AddMemberForm';
import UpdateMemberForm from './components/UpdateMemberForm';
import ManageContract from './components/ManageContract';
import contractService from './utils/contractHelpers';

function App() {
  // Application state
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [manager, setManager] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect to check connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (contractService.isConnected && contractService.contract) {
        setIsConnected(true);
        setAccount(contractService.getCurrentAccount());
        setContractAddress(contractService.contractAddress);
        await fetchContractData();
      }
    };

    checkConnection();
  }, []);

  // Connect to the XDC network
  const handleConnect = async (rpcUrl, contractAddr) => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize Web3
      const connected = await contractService.initWeb3(rpcUrl);
      if (!connected) {
        throw new Error('Failed to connect to XDC network');
      }
      
      // Initialize contract
      const initialized = contractService.initContract(contractAddr);
      if (!initialized) {
        throw new Error('Failed to initialize contract');
      }
      
      setIsConnected(true);
      setAccount(contractService.getCurrentAccount());
      setContractAddress(contractAddr);
      
      await fetchContractData();
      toast.success('Successfully connected to XDC network and contract');
    } catch (err) {
      setError(err.message);
      toast.error(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contract data (manager, members)
  const fetchContractData = async () => {
    try {
      setLoading(true);
      
      // Get manager
      const managerAddress = await contractService.getManager();
      setManager(managerAddress);
      
      // Check if current account is the manager
      setIsManager(
        managerAddress.toLowerCase() === contractService.getCurrentAccount().toLowerCase()
      );
      
      // Get all members
      const memberAddresses = await contractService.getAllMembers();
      setMembers(memberAddresses);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle selecting a member from the list
  const handleSelectMember = async (address) => {
    try {
      setLoading(true);
      setError(null);
      
      const memberDetails = await contractService.getMember(address);
      setSelectedMember(memberDetails);
    } catch (err) {
      setError(`Error fetching member details: ${err.message}`);
      toast.error(`Error fetching member details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new member
  const handleAddMember = async (memberData) => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.addMember(
        memberData.address,
        memberData.x500Name,
        memberData.publicKey
      );
      
      toast.success('Member added successfully!');
      
      // Refresh the member list
      await fetchContractData();
    } catch (err) {
      setError(`Error adding member: ${err.message}`);
      toast.error(`Error adding member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (address) => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.removeMember(address);
      
      toast.success('Member removed successfully!');
      
      // Refresh the member list and clear selected member
      await fetchContractData();
      setSelectedMember(null);
    } catch (err) {
      setError(`Error removing member: ${err.message}`);
      toast.error(`Error removing member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating member status
  const handleUpdateStatus = async (address, isActive) => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.updateMemberStatus(address, isActive);
      
      toast.success(`Member status updated to ${isActive ? 'active' : 'inactive'}`);
      
      // Refresh member details if this is the currently selected member
      if (selectedMember && selectedMember.nodeAddress === address) {
        const updatedMember = await contractService.getMember(address);
        setSelectedMember(updatedMember);
      }
      
      // Refresh the member list
      await fetchContractData();
    } catch (err) {
      setError(`Error updating status: ${err.message}`);
      toast.error(`Error updating status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating member details
  const handleUpdateMember = async (memberData) => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.updateMemberDetails(
        memberData.address,
        memberData.x500Name,
        memberData.publicKey
      );
      
      toast.success('Member details updated successfully!');
      
      // Refresh member details if this is the currently selected member
      if (selectedMember && selectedMember.nodeAddress === memberData.address) {
        const updatedMember = await contractService.getMember(memberData.address);
        setSelectedMember(updatedMember);
      }
    } catch (err) {
      setError(`Error updating member: ${err.message}`);
      toast.error(`Error updating member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle transferring manager role
  const handleTransferManager = async (newManagerAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.transferManagerRole(newManagerAddress);
      
      toast.success('Manager role transferred successfully!');
      
      // Refresh contract data
      await fetchContractData();
    } catch (err) {
      setError(`Error transferring manager role: ${err.message}`);
      toast.error(`Error transferring manager role: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Navigation 
        account={account} 
        isConnected={isConnected} 
        isManager={isManager}
        contractAddress={contractAddress}
      />
      
      <Container className="mt-4">
        {!isConnected ? (
          <ConnectionPanel onConnect={handleConnect} loading={loading} />
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Row className="mb-3">
              <Col>
                <h3>XDC Network Manager</h3>
                <p>
                  Manager: <strong>{manager}</strong>
                  {isManager && <span className="badge bg-success ms-2">You are the manager</span>}
                </p>
                <p>Contract Address: <strong>{contractAddress}</strong></p>
                <p>Connected Account: <strong>{account}</strong></p>
              </Col>
            </Row>
            
            <Tabs defaultActiveKey="members" className="mb-3">
              <Tab eventKey="members" title="Members">
                <Row>
                  <Col md={6}>
                    <MemberList 
                      members={members} 
                      onSelectMember={handleSelectMember}
                      loading={loading}
                    />
                  </Col>
                  <Col md={6}>
                    {selectedMember ? (
                      <MemberDetails 
                        member={selectedMember}
                        isManager={isManager}
                        onRemoveMember={handleRemoveMember}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    ) : (
                      <div className="p-4 bg-light text-center">
                        <p>Select a member to view details</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </Tab>
              
              {isManager && (
                <>
                  <Tab eventKey="addMember" title="Add Member">
                    <AddMemberForm onAddMember={handleAddMember} loading={loading} />
                  </Tab>
                  
                  <Tab eventKey="updateMember" title="Update Member">
                    <UpdateMemberForm 
                      onUpdateMember={handleUpdateMember} 
                      members={members}
                      loading={loading}
                    />
                  </Tab>
                  
                  <Tab eventKey="management" title="Contract Management">
                    <ManageContract 
                      currentManager={manager}
                      onTransferManager={handleTransferManager}
                      loading={loading}
                    />
                  </Tab>
                </>
              )}
            </Tabs>
          </>
        )}
      </Container>
      
      <footer className="footer mt-auto py-3 bg-light">
        <Container>
          <span className="text-muted">XDC Network Manager - © 2025</span>
        </Container>
      </footer>
    </div>
  );
}

export default App;
