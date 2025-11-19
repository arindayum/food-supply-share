import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';

const RateDonorForm = ({ postId, onRatingSuccess }) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/posts/${postId}/rate`, { stars, comment });
      toast.success('Thank you for your feedback!');
      if (onRatingSuccess) {
        onRatingSuccess(); // Notify parent component to hide the form
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit rating.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title>Rate the Donor</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="stars">
            <Form.Label>Rating (1-5 Stars)</Form.Label>
            <Form.Select value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="comment">
            <Form.Label>Comment (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment about your experience..."
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RateDonorForm;
