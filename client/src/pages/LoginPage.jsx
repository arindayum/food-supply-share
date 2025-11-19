import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/'); // Redirect to home page on successful login
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ paddingTop: '5vh', paddingBottom: '5vh' }}>
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          <Card className="shadow-lg">
            <Card.Body className="p-4 p-md-5">
              <h2 className="text-center mb-4 fw-bold"><i className="fas fa-sign-in-alt me-2"></i>Log In</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
                </Form.Group>
                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
                </Form.Group>
                <Button disabled={loading} className="w-100" variant="primary" type="submit">
                  {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Logging In...</> : 'Log In'}
                </Button>
              </Form>
              <div className="text-center mt-4">
                Need an account? <Link to="/register">Register here</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
