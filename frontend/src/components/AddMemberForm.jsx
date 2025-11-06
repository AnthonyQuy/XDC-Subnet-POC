import React, { useState } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

const AddMemberForm = ({ onAddMember, loading }) => {
  const [formData, setFormData] = useState({
    address: "",
    x500Name: "",
    publicKey: "",
    serial: "1732382838913",
    platformVersion: "12",
    host: "contour.p2p.app.contournetwork.io",
    port: "10030",
  });
  const [validated, setValidated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      toast.error(
        "Please enter a valid Ethereum address (0x followed by 40 hex characters)"
      );
      return;
    }

    onAddMember(formData);

    // Reset form
    setFormData({
      address: "",
      x500Name: "",
      publicKey: "",
    });
    setValidated(false);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Add New Member</Card.Header>
      <Card.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Member Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              placeholder="0x..."
              value={formData.address}
              onChange={handleChange}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid Ethereum address.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              The Ethereum address of the member
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
          <Form.Group className="mb-3">
            <Form.Label>Serial Number</Form.Label>
            <Form.Control
              type="text"
              name="serial"
              placeholder="Enter serial number"
              value={formData.serial}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a serial number.
            </Form.Control.Feedback>
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
            />
            <Form.Control.Feedback type="invalid">
              Please provide a platform version.
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
            />
            <Form.Control.Feedback type="invalid">
              Please provide a port number.
            </Form.Control.Feedback>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
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
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AddMemberForm;
