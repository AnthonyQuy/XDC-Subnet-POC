import React, { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';

const ConnectionPanel = ({ onConnect, loading }) => {
  const [rpcUrl, setRpcUrl] = useState(process.env.REACT_APP_DEFAULT_RPC_URL || 'http://localhost:8545');
  const [contractAddress, setContractAddress] = useState(process.env.REACT_APP_DEFAULT_CONTRACT_ADDRESS || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(rpcUrl, contractAddress);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Connect to XDC Network</Card.Header>
      <Card.Body>
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
      </Card.Body>
    </Card>
  );
};

export default ConnectionPanel;
