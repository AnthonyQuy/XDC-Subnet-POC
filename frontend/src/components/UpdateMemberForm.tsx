import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contractService from '../utils/contractHelpers';
import { validateMemberData } from '../utils/validationHelpers';
import type { MemberFormData } from '../types/contract';

interface UpdateMemberFormProps {
  onUpdateMember: (memberData: MemberFormData) => Promise<{ success: boolean; error?: string }>;
  members: string[];
  loading: boolean;
}

interface FormState {
  address: string;
  x500Name: string;
  certSerialHex: string;
  platformVersion: string | number;
  host: string;
  port: string | number;
}

const UpdateMemberForm: React.FC<UpdateMemberFormProps> = ({ onUpdateMember, members, loading }) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [formData, setFormData] = useState<FormState>({
    address: '',
    x500Name: '',
    certSerialHex: '',
    platformVersion: '',
    host: '',
    port: ''
  });
  const [validated, setValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleMemberSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const address = e.target.value;
    setSelectedMember(address);
    
    if (address) {
      try {
        setFetchingDetails(true);
        const memberDetails = await contractService.getMember(address);
        setFormData({
          address: memberDetails.memberAddress,
          x500Name: memberDetails.x500Name,
          certSerialHex: memberDetails.certSerialHex || '',
          platformVersion: memberDetails.platformVersion || '',
          host: memberDetails.host || '',
          port: memberDetails.port || ''
        });
        setFetchingDetails(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Error fetching member details: ${errorMessage}`);
        setFetchingDetails(false);
      }
    } else {
      setFormData({
        address: '',
        x500Name: '',
        certSerialHex: '',
        platformVersion: '',
        host: '',
        port: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // Perform comprehensive validation
    const validation = validateMemberData({
      address: formData.address,
      x500Name: formData.x500Name,
      certSerialHex: formData.certSerialHex,
      platformVersion: formData.platformVersion,
      host: formData.host,
      port: formData.port
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    setValidationErrors({});
    
    const data: MemberFormData = {
      address: formData.address.trim(),
      x500Name: formData.x500Name.trim(),
      certSerialHex: validation.sanitizedCertSerial || formData.certSerialHex,
      platformVersion: typeof formData.platformVersion === 'string' ? parseInt(formData.platformVersion, 10) : formData.platformVersion,
      host: formData.host.trim(),
      port: typeof formData.port === 'string' ? parseInt(formData.port, 10) : formData.port
    };
    
    const result = await onUpdateMember(data);
    
    if (result && result.success) {
      setFormData({
        address: '',
        x500Name: '',
        certSerialHex: '',
        platformVersion: '',
        host: '',
        port: ''
      });
      setSelectedMember('');
      setValidated(false);
      setValidationErrors({});
    }
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
            <>
              {Object.keys(validationErrors).length > 0 && (
                <Alert variant="danger" className="mb-3">
                  <Alert.Heading>Validation Errors</Alert.Heading>
                  <ul className="mb-0">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {error}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
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
                <Form.Label>Certificate Serial Number (Hex)</Form.Label>
                <Form.Control
                  type="text"
                  name="certSerialHex"
                  placeholder="0x1234... or 1234..."
                  value={formData.certSerialHex}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.certSerialHex}
                  className="font-monospace"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.certSerialHex || "Please provide the X.509 certificate serial number in hex format."}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  X.509 certificate serial number in hex format (e.g., 0x1234abcd). Used for certificate revocation tracking.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Platform Version</Form.Label>
                <Form.Control
                  type="number"
                  name="platformVersion"
                  placeholder="Enter platform version"
                  value={formData.platformVersion}
                  onChange={handleChange}
                  required
                  min="1"
                  max="65535"
                />
                <Form.Control.Feedback type="invalid">
                  Valid platform version is required (1-65535).
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Host</Form.Label>
                <Form.Control
                  type="text"
                  name="host"
                  placeholder="Enter host address"
                  value={formData.host}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a host address.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Port</Form.Label>
                <Form.Control
                  type="number"
                  name="port"
                  placeholder="Enter port number"
                  value={formData.port}
                  onChange={handleChange}
                  required
                  min="1"
                  max="65535"
                />
                <Form.Control.Feedback type="invalid">
                  Valid port number is required (1-65535).
                </Form.Control.Feedback>
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
            </>
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
