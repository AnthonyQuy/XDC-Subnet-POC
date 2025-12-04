import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contractService from '../utils/contractHelpers';

interface ConnectionPanelProps {
  onConnect: (rpcUrl: string, contractAddress: string) => Promise<void>;
  onConnectMetaMask: (contractAddress: string) => Promise<void>;
  loading: boolean;
}

interface NetworkInfo {
  chainId: string;
  chainName: string;
}

// Read expected network configuration from environment variables
const EXPECTED_CHAIN_ID = import.meta.env.VITE_SUBNET_CHAIN_ID || '57539';
const EXPECTED_NETWORK_NAME = 'XDC Subnet';
const EXPECTED_RPC_URL = import.meta.env.VITE_DEFAULT_RPC_URL || 'http://127.0.0.1:8545';

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ onConnect, onConnectMetaMask, loading }) => {
  const [rpcUrl, setRpcUrl] = useState(import.meta.env.VITE_DEFAULT_RPC_URL || 'http://localhost:8545');
  const [contractAddress, setContractAddress] = useState(import.meta.env.VITE_DEFAULT_CONTRACT_ADDRESS || '');
  const [metaMaskAvailable] = useState(contractService.isMetaMaskAvailable());
  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConnect(rpcUrl, contractAddress);
  };

  // Detect current network on mount and when MetaMask changes
  useEffect(() => {
    const detectNetwork = async () => {
      if (metaMaskAvailable) {
        const network = await contractService.getCurrentNetwork();
        setCurrentNetwork(network);
      }
    };

    detectNetwork();

    // Listen for network changes
    if (!metaMaskAvailable || typeof window === 'undefined') {
      return;
    }

    const ethereum = (window as any).ethereum;
    
    const handleChainChanged = () => {
      detectNetwork();
    };

    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [metaMaskAvailable]);

  const handleMetaMaskConnect = () => {
    if (contractAddress) {
      onConnectMetaMask(contractAddress);
    }
  };

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      await contractService.switchToXDCSubnet();
      toast.success('Successfully switched to XDC Subnet network!');
      
      // Update network info
      const network = await contractService.getCurrentNetwork();
      setCurrentNetwork(network);
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to switch network');
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleAddNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      await contractService.addXDCSubnetNetwork();
      toast.success('XDC Subnet network added to MetaMask!');
      
      // Update network info
      const network = await contractService.getCurrentNetwork();
      setCurrentNetwork(network);
    } catch (error) {
      console.error('Error adding network:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add network');
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const isCorrectNetwork = currentNetwork?.chainId === EXPECTED_CHAIN_ID;

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Connect to XDC Network</Card.Header>
      <Card.Body>
        {/* MetaMask Connection Option */}
        <div className="mb-4 pb-4 border-bottom">
          <h6 className="mb-3">Option 1: Connect with MetaMask</h6>
          
          {/* Network Status Display */}
          {metaMaskAvailable && currentNetwork && (
            <Alert variant={isCorrectNetwork ? 'success' : 'warning'} className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>
                  <i className={`bi bi-${isCorrectNetwork ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2`}></i>
                  Current Network Status
                </strong>
                <Badge bg={isCorrectNetwork ? 'success' : 'danger'}>
                  {isCorrectNetwork ? 'Correct Network' : 'Wrong Network'}
                </Badge>
              </div>
              
              <div className="small mb-2">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Network:</span>
                  <strong>{currentNetwork.chainName}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Chain ID:</span>
                  <strong>{currentNetwork.chainId}</strong>
                </div>
              </div>

              {!isCorrectNetwork && (
                <>
                  <hr className="my-2" />
                  <div className="small mb-2">
                    <div className="text-muted mb-1">
                      <i className="bi bi-info-circle me-1"></i>
                      Expected Network:
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Network:</span>
                      <strong>{EXPECTED_NETWORK_NAME}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Chain ID:</span>
                      <strong>{EXPECTED_CHAIN_ID}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted">RPC URL:</span>
                      <strong className="font-monospace small">{EXPECTED_RPC_URL}</strong>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={handleSwitchNetwork}
                      disabled={switchingNetwork}
                    >
                      {switchingNetwork ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Switching...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Switch to XDC Subnet
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={handleAddNetwork}
                      disabled={switchingNetwork}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Add XDC Subnet Network
                    </Button>
                  </div>
                </>
              )}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>NetworkManager Contract Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter the deployed NetworkManager contract address
            </Form.Text>
          </Form.Group>
          
          {!metaMaskAvailable && (
            <Alert variant="warning" className="mb-3">
              MetaMask not detected. Please install MetaMask extension to use this option.
            </Alert>
          )}

          <Button 
            variant="success" 
            onClick={handleMetaMaskConnect}
            disabled={loading || !contractAddress || !metaMaskAvailable}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Connecting...
              </>
            ) : (
              <>
                <i className="bi bi-wallet2 me-2"></i>
                Connect with MetaMask
              </>
            )}
          </Button>
        </div>

        {/* Direct RPC Connection Option */}
        <div>
          <h6 className="mb-3">Option 2: Connect Directly to RPC</h6>
          <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>XDC Subnet RPC URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="http://localhost:8545"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Enter the RPC endpoint for your XDC subnet node
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>NetworkManager Contract Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Enter the deployed NetworkManager contract address
            </Form.Text>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || !rpcUrl || !contractAddress}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </Form>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConnectionPanel;
