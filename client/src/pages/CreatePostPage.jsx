import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';

const CreatePostPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    address: '',
    expiresAt: '',
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Location access denied. Please enable location services in your browser to create a post.');
        setLocationLoading(false);
        console.error(err);
      }
    );
  }, []);

  const { title, description, quantity, category, address, expiresAt } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!userLocation) {
        setError('Your location is required to create a post.');
        setLoading(false);
        return;
    }

    const postData = {
      title,
      description,
      quantity,
      category,
      address,
      expiresAt,
      location: {
        type: 'Point',
        coordinates: [userLocation.longitude, userLocation.latitude],
      },
    };

    try {
      await axios.post('/api/posts', postData);
      toast.success('Post created successfully!');
      navigate('/my-posts');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create post.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <ToastContainer />
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-4 p-md-5">
              <h2 className="text-center mb-4 fw-bold"><i className="fas fa-plus-circle me-2"></i>Create a New Post</h2>
              {locationLoading && <Alert variant="info">Getting your location...</Alert>}
              {locationError && <Alert variant="warning"><i className="fas fa-exclamation-triangle me-2"></i>{locationError}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control type="text" name="title" value={title} onChange={onChange} required placeholder="e.g., Sourdough Loaf" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={description} onChange={onChange} placeholder="e.g., Baked fresh this morning, contains sesame seeds."/>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="quantity">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control type="text" name="quantity" placeholder='e.g., 1 loaf' value={quantity} onChange={onChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="category">
                      <Form.Label>Category</Form.Label>
                      <Form.Control type="text" name="category" placeholder="e.g., Baked Goods" value={category} onChange={onChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3" controlId="address">
                  <Form.Label>Address / Pickup Location</Form.Label>
                  <Form.Control type="text" name="address" value={address} onChange={onChange} required placeholder="e.g., 123 Main St, Anytown" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="expiresAt">
                    <Form.Label>Expires At</Form.Label>
                    <Form.Control type="date" name="expiresAt" value={expiresAt} onChange={onChange} required />
                </Form.Group>
                <div className="d-grid">
                  <Button disabled={loading} variant="primary" type="submit" size="lg">
                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Creating...</> : 'Create Post'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreatePostPage;

