import { useState, useEffect } from 'react';
import { Container, Row, Col, Tab, Tabs, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Navigation from './components/Navigation';
import ConnectionPanel from './components/ConnectionPanel';
import NetworkInfo from './components/NetworkInfo';
import MemberList from './components/MemberList';
import MemberDetails from './components/MemberDetails';
import AddMemberForm from './components/AddMemberForm';
import UpdateMemberForm from './components/UpdateMemberForm';
import ManageContract from './components/ManageContract';
import { useContract } from './hooks/useContract';

function App() {
  const {
    isConnected,
    account,
    contractAddress,
    owner,
    isOwner,
    members,
    selectedMember,
    loading,
    error,
    connect,
    connectWithMetaMask,
    disconnect,
    selectMember,
    addMember,
    removeMember,
    updateMemberStatus,
    updateMemberDetails,
    transferOwnership,
  } = useContract();

  const [showDebugPanel, setShowDebugPanel] = useState(() => {
    const saved = localStorage.getItem('showDebugPanel');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('showDebugPanel', String(showDebugPanel));
  }, [showDebugPanel]);

  const handleToggleDebugPanel = () => {
    const newValue = !showDebugPanel;
    setShowDebugPanel(newValue);
    if (newValue) {
      toast.info('Debug panel is now visible');
    } else {
      toast.info('Debug panel hidden. Click the debug icon in the navigation bar to show it again.');
    }
  };

  const handleCloseDebugPanel = () => {
    setShowDebugPanel(false);
    toast.info('Debug panel hidden. Click the debug icon in the navigation bar to show it again.');
  };

  return (
    <div className="app">
      <Navigation
        account={account}
        isConnected={isConnected}
        isOwner={isOwner}
        contractAddress={contractAddress}
        showDebugPanel={showDebugPanel}
        onLogout={disconnect}
        onToggleDebugPanel={handleToggleDebugPanel}
      />

      {showDebugPanel && <NetworkInfo onClose={handleCloseDebugPanel} />}

      <Container className="mt-4">
        {!isConnected ? (
          <ConnectionPanel 
            onConnect={connect} 
            onConnectMetaMask={connectWithMetaMask}
            loading={loading} 
          />
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="mb-3">
              <Col>
                <h3>XDC Network Manager</h3>
                <p>
                  Owner: <strong>{owner}</strong>
                  {isOwner && <span className="badge bg-success ms-2">You are the owner</span>}
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
                      onSelectMember={selectMember}
                      loading={loading}
                    />
                  </Col>
                  <Col md={6}>
                    {selectedMember ? (
                      <MemberDetails
                        member={selectedMember}
                        isManager={isOwner}
                        onRemoveMember={removeMember}
                        onUpdateStatus={updateMemberStatus}
                      />
                    ) : (
                      <div className="p-4 bg-light text-center">
                        <p>Select a member to view details</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </Tab>
              
              {isOwner && (
                <Tab eventKey="addMember" title="Add Member">
                  <AddMemberForm onAddMember={addMember} loading={loading} />
                </Tab>
              )}

              {isOwner && (
                <Tab eventKey="updateMember" title="Update Member">
                  <UpdateMemberForm
                    onUpdateMember={updateMemberDetails}
                    members={members}
                    loading={loading}
                  />
                </Tab>
              )}

              {isOwner && (
                <Tab eventKey="management" title="Contract Management">
                  <ManageContract
                    currentManager={owner}
                    onTransferManager={transferOwnership}
                    loading={loading}
                  />
                </Tab>
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
