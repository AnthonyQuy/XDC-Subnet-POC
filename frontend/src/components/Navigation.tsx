import React from 'react';
import { Navbar, Container, Nav, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface NavigationProps {
  account: string;
  isConnected: boolean;
  isOwner: boolean;
  contractAddress: string;
  showDebugPanel: boolean;
  onLogout: () => void;
  onToggleDebugPanel: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  account, 
  isConnected, 
  isOwner, 
  showDebugPanel, 
  onLogout, 
  onToggleDebugPanel 
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">XDC Network Manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          {isConnected && (
            <Nav className="ml-auto d-flex align-items-center">
              {isOwner && (
                <Badge bg="success" className="me-2">Owner</Badge>
              )}
              <Nav.Item className="d-flex align-items-center text-light me-2">
                <span 
                  className="address-text" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => copyToClipboard(account)}
                  title="Click to copy"
                >
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </Nav.Item>
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip id="debug-panel-tooltip">
                    {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
                  </Tooltip>
                }
              >
                <Button 
                  variant={showDebugPanel ? 'outline-info' : 'outline-secondary'}
                  size="sm" 
                  onClick={onToggleDebugPanel}
                  className="me-2"
                >
                  <i className={`bi bi-${showDebugPanel ? 'bug-fill' : 'bug'}`}></i>
                </Button>
              </OverlayTrigger>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={onLogout}
              >
                Disconnect
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
