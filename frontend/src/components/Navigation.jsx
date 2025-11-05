import React from 'react';
import { Navbar, Container, Nav, Badge } from 'react-bootstrap';

const Navigation = ({ account, isConnected, isManager, contractAddress }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">XDC Network Manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          {isConnected && (
            <Nav className="ml-auto">
              <Nav.Item className="d-flex align-items-center text-light">
                {isManager && (
                  <Badge bg="success" className="me-2">Manager</Badge>
                )}
                <span className="address-text">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </Nav.Item>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
