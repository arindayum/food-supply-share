import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <Navbar bg="light" variant="light" expand="lg" collapseOnSelect sticky="top" className="shadow-sm">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <i className="fas fa-hands-helping"></i> Food Supply
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {user ? (
                <NavDropdown title={<>Welcome, {user.name}</>} id="username" align="end">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item><i className="fas fa-user-circle me-2"></i>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/my-posts">
                    <NavDropdown.Item><i className="fas fa-list-alt me-2"></i>My Posts</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/posts/create">
                    <NavDropdown.Item><i className="fas fa-plus-circle me-2"></i>Create Post</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Divider />
                  {user && user.role === 'admin' && (
                    <LinkContainer to="/admin">
                        <NavDropdown.Item><i className="fas fa-user-shield me-2"></i>Admin Dashboard</NavDropdown.Item>
                    </LinkContainer>
                  )}
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <>
                  <LinkContainer to="/login">
                    <Nav.Link><i className="fas fa-sign-in-alt me-2"></i>Login</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/register">
                    <Nav.Link><i className="fas fa-user-plus me-2"></i>Register</Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
