import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';

const EditPostPage = () => {
  const { id } = useParams(); // Get the post ID from the URL
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    address: '',
    expiresAt: '',
    longitude: '',
    latitude: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true to fetch data
  const [submitLoading, setSubmitLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await axios.get(`/api/posts/${id}`);
        // Pre-fill the form with existing post data
        setFormData({
          title: data.title,
          description: data.description || '',
          quantity: data.quantity,
          category: data.category || '',
          address: data.address,
          expiresAt: new Date(data.expiresAt).toISOString().split('T')[0], // Format YYYY-MM-DD
          longitude: data.location.coordinates[0],
          latitude: data.location.coordinates[1],
        });
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch post data.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const { title, description, quantity, category, address, expiresAt, longitude, latitude } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    
    const postData = {
      title,
      description,
      quantity,
      category,
      address,
      expiresAt,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    };

    try {
      await axios.put(`/api/posts/${id}`, postData);
      toast.success('Post updated successfully!');
      navigate('/my-posts');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update post.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <Container className="mt-4">
      <ToastContainer />
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Edit Food Post</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                {/* Form fields are pre-filled with existing data */}
                <Form.Group className="mb-3" controlId="title"><Form.Label>Title</Form.Label><Form.Control type="text" name="title" value={title} onChange={onChange} required /></Form.Group>
                <Form.Group className="mb-3" controlId="description"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={description} onChange={onChange} /></Form.Group>
                <Row>
                  <Col md={6}><Form.Group className="mb-3" controlId="quantity"><Form.Label>Quantity</Form.Label><Form.Control type="text" name="quantity" value={quantity} onChange={onChange} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3" controlId="category"><Form.Label>Category</Form.Label><Form.Control type="text" name="category" value={category} onChange={onChange} /></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3" controlId="address"><Form.Label>Address / Pickup Location</Form.Label><Form.Control type="text" name="address" value={address} onChange={onChange} required /></Form.Group>
                <Row>
                    <Col md={4}><Form.Group className="mb-3" controlId="longitude"><Form.Label>Longitude</Form.Label><Form.Control type="number" step="any" name="longitude" value={longitude} onChange={onChange} required /></Form.Group></Col>
                    <Col md={4}><Form.Group className="mb-3" controlId="latitude"><Form.Label>Latitude</Form.Label><Form.Control type="number" step="any" name="latitude" value={latitude} onChange={onChange} required /></Form.Group></Col>
                    <Col md={4}><Form.Group className="mb-3" controlId="expiresAt"><Form.Label>Expires At</Form.Label><Form.Control type="date" name="expiresAt" value={expiresAt} onChange={onChange} required /></Form.Group></Col>
                </Row>
                <Button disabled={submitLoading} className="w-100" variant="primary" type="submit">
                  {submitLoading ? 'Updating...' : 'Update Post'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditPostPage;
