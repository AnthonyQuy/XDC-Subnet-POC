import React, { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

interface ManageContractProps {
  currentManager: string;
  onTransferManager: (newManagerAddress: string) => Promise<void>;
  loading: boolean;
}

const ManageContract: React.FC<ManageContractProps> = ({ currentManager, onTransferManager, loading }) => {
  const [newManager, setNewManager] = useState('');
  const [validated, setValidated] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewManager(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // Check if address is valid Ethereum address
    if (!newManager.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
      return;
    }
    
    // Confirm with the user before transferring manager role
    if (window.confirm(`Are you sure you want to transfer the manager role to ${newManager}? This action cannot be undone.`)) {
      onTransferManager(newManager);
      setNewManager('');
      setValidated(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Contract Management</Card.Header>
      <Card.Body>
        <div className="mb-4">
          <h6>Current Manager</h6>
          <p className="text-break">{currentManager}</p>
        </div>

        <hr className="my-4" />

        <h6 className="mb-3">Transfer Manager Role</h6>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>New Manager Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={newManager}
              onChange={handleChange}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid Ethereum address.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Enter the Ethereum address of the new manager
            </Form.Text>
          </Form.Group>

          <div className="alert alert-warning">
            <strong>Warning:</strong> Transferring the manager role will give complete control 
            of the NetworkManager contract to the new address. This action cannot be undone 
            unless the new manager transfers it back.
          </div>

          <Button
            variant="danger"
            type="submit"
            disabled={loading}
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
                Transferring...
              </>
            ) : (
              'Transfer Manager Role'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ManageContract;
