import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contractService from '../utils/contractHelpers';

const UpdateMemberForm = ({ onUpdateMember, members, loading }) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [formData, setFormData] = useState({
    address: '',
    x500Name: '',
    publicKey: ''
  });
  const [validated, setValidated] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleMemberSelect = async (e) => {
    const address = e.target.value;
    setSelectedMember(address);
    
    if (address) {
      try {
        setFetchingDetails(true);
        const memberDetails = await contractService.getMember(address);
        setFormData({
          address: memberDetails.nodeAddress,
          x500Name: memberDetails.x500Name,
          publicKey: memberDetails.publicKey
        });
        setFetchingDetails(false);
      } catch (error) {
        toast.error(`Error fetching member details: ${error.message}`);
        setFetchingDetails(false);
      }
    } else {
      // Reset form data if no member is selected
      setFormData({
        address: '',
        x500Name: '',
        publicKey: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // Check if address is valid Ethereum address
    if (!formData.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Invalid Ethereum address format');
      return;
    }
    
    onUpdateMember(formData);
    
    // Reset form
    setFormData({
      address: '',
      x500Name: '',
      publicKey: ''
    });
    setSelectedMember('');
    setValidated(false);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Update Member Details</Card.Header>
      <Card.Body>
        <Form.Group className="mb-4">
          <Form.Label>Select Member to Update</Form.Label>
          <Form.Select
            value={selectedMember}
            onChange={handleMemberSelect}
            disabled={loading || fetchingDetails || members.length === 0}
          >
            <option value="">Select a member...</option>
            {members.map(address => (
              <option key={address} value={address}>
                {address}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            Select a member from the list to update their details
          </Form.Text>
        </Form.Group>

        {fetchingDetails ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading member details...</p>
          </div>
        ) : (
          selectedMember && (
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Member Address</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.address}
                  disabled
                />
                <Form.Text className="text-muted">
                  Member address cannot be changed
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>X.500 Distinguished Name</Form.Label>
                <Form.Control
                  type="text"
                  name="x500Name"
                  placeholder="CN=Node1,O=XDC,C=SG"
                  value={formData.x500Name}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a X.500 distinguished name.
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  X.500 name format: CN=CommonName,O=Organization,C=Country
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Public Key</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="publicKey"
                  placeholder="Enter public key"
                  value={formData.publicKey}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide the member's public key.
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  The public key will be used for encryption/verification
                </Form.Text>
              </Form.Group>

              <Button
                variant="primary"
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
                    Updating...
                  </>
                ) : (
                  'Update Member'
                )}
              </Button>
            </Form>
          )
        )}

        {!selectedMember && !fetchingDetails && (
          <div className="p-4 bg-light text-center">
            <p>Please select a member to update their details</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UpdateMemberForm;
