import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
// import { useAuth } from '../context/AuthContext';
// import { toast, ToastContainer } from 'react-toastify';

import { useAuth } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import ChatModal from '../components/ChatModal';

const FoodItemDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/posts/${id}`);
        setItem(data);
        // Logic to check if rating should be shown
        if (data.status === 'completed' && user && data.claimedBy === user._id) {
            // More complex check needed here to see if user has already rated
            setShowRating(true); 
        }
      } catch (err) {
        setError('Failed to load food post details.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchItem();
  }, [id, user]);

  const handleClaim = async () => {
    if (!window.confirm('Are you sure you want to claim this item?')) return;
    try {
      const { data } = await axios.post(`/api/posts/${id}/claim`);
      setItem(data);
      toast.success('Item claimed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim item.');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Confirm you have received this item?')) return;
    try {
      const { data } = await axios.post(`/api/posts/${id}/complete`);
      setItem(data);
      setShowRating(true); // Show rating form after completion
      toast.success('Transaction completed! You can now rate the donor.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete transaction.');
    }
  };

  const onRatingSuccess = () => {
    setShowRating(false); // Hide form after successful rating
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="my-5">{error}</Alert>;
  if (!item) return <Alert variant="warning" className="my-5">Post not found.</Alert>;

  const isDonor = user && user._id === item.owner._id;
  const isClaimer = user && item.claimedBy && user._id === item.claimedBy;
  const canClaim = user && !isDonor && item.status === 'available';
  const canComplete = isClaimer && item.status === 'claimed';
  const canChat = (isDonor || isClaimer) && item.status !== 'available';

  return (
    <Container className="my-5">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="mb-4">
        <Link to="/" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Listings
        </Link>
      </div>

      <Card className="shadow-lg border-0">
        <Row className="g-0">
          <Col md={6}>
            <Card.Img src={item.imageUrl || `https://via.placeholder.com/600x400?text=${item.category || 'Food'}`} className="rounded-start" style={{ objectFit: 'cover', height: '100%' }} />
          </Col>
          <Col md={6}>
            <Card.Body className="p-4 p-lg-5 d-flex flex-column h-100">
              <div>
                <Badge bg={item.status === 'available' ? 'success' : 'secondary'} className="mb-2 fs-6">{item.status}</Badge>
                <h1 className="fw-bold display-5">{item.title}</h1>
                <div className="mb-3 text-muted">
                  <span><i className="fas fa-user me-2"></i>Donated by <strong>{item.owner.name}</strong></span>
                  <span className="mx-2">|</span>
                  <span><i className="fas fa-star me-1 text-warning"></i>{item.owner.rating.toFixed(1)} ({item.owner.ratingCount} ratings)</span>
                </div>
                <p className="lead">{item.description || 'No description provided.'}</p>
                <ListGroup variant="flush" className="my-4">
                  <ListGroup.Item className="px-0"><i className="fas fa-box-open fa-fw me-2 text-primary"></i><strong>Quantity:</strong> {item.quantity}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-tag fa-fw me-2 text-primary"></i><strong>Category:</strong> {item.category || 'N/A'}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-map-marker-alt fa-fw me-2 text-primary"></i><strong>Address:</strong> {item.address}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-calendar-times fa-fw me-2 text-primary"></i><strong>Expires:</strong> {new Date(item.expiresAt).toLocaleDateString()}</ListGroup.Item>
                </ListGroup>
              </div>

              <div className="mt-auto">
                {isDonor && <Alert variant="light" className="text-center">You are the donor of this item.</Alert>}
                {isClaimer && item.status === 'claimed' && <Alert variant="light" className="text-center">You have claimed this item. Arrange pickup via chat.</Alert>}
                {isClaimer && item.status === 'completed' && !showRating && <Alert variant="success" className="text-center">Transaction completed. Thank you!</Alert>}
                {!user && item.status === 'available' && <Alert variant="warning" className="text-center"><Link to="/login">Log in</Link> to claim this item.</Alert>}

                <div className="d-grid gap-2">
                  {canClaim && <Button variant="primary" size="lg" onClick={handleClaim}>Claim Item</Button>}
                  {canComplete && <Button variant="success" size="lg" onClick={handleComplete}>Mark as Received</Button>}
                  {canChat && <Button variant="secondary" size="lg" onClick={() => setShowChat(true)}><i className="fas fa-comments me-2"></i>Chat with {isDonor ? 'Claimer' : 'Donor'}</Button>}
                </div>
                
                {showRating && <RateDonorForm postId={id} onRatingSuccess={onRatingSuccess} />}
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>
      
      {canChat && <ChatModal show={showChat} handleClose={() => setShowChat(false)} postId={id} postModel="FoodPost" />}
    </Container>
  );
};

export default FoodItemDetailsPage;
