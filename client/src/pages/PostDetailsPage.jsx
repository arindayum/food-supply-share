import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Button, Spinner, Alert, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import ChatModal from '../components/ChatModal';
import RateDonorForm from '../components/RateDonorForm';
import { useSocket } from '../hooks/useSocket';

const PostDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && id) {
      const fetchPostAndRatingStatus = async () => {
        try {
          setLoading(true);
          const [postRes, ratingRes] = await Promise.all([
            axios.get(`/api/posts/${id}`),
            axios.get(`/api/ratings/check/${id}`)
          ]);
          
          setPost(postRes.data);
          setHasRated(ratingRes.data.hasRated);

        } catch (err) {
          setError('Failed to load food post details.');
        } finally {
          setLoading(false);
        }
      };
      fetchPostAndRatingStatus();
    }
  }, [id, user]);

  useEffect(() => {
    if (socket && isConnected) {
      const handlePostUpdate = (updatedPost) => {
        if (updatedPost._id === id) {
          setPost(updatedPost);
        }
      };
      const handlePostDelete = (deletedPost) => {
        if (deletedPost._id === id) {
          toast.warn('This post has been deleted or expired.');
          navigate('/');
        }
      };

      socket.on('post_update', handlePostUpdate);
      socket.on('post_delete', handlePostDelete);

      return () => {
        socket.off('post_update', handlePostUpdate);
        socket.off('post_delete', handlePostDelete);
      };
    }
  }, [socket, isConnected, id, navigate]);

  const handleClaim = async () => {
    // No need to manually update state, the socket event will handle it
    try {
      await axios.post(`/api/posts/${id}/claim`);
      toast.success('Post claimed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim post.');
    }
  };

  const handleComplete = async () => {
    // No need to manually update state, the socket event will handle it
    try {
      await axios.post(`/api/posts/${id}/complete`);
      toast.success('Transaction completed! You can now rate the donor.');
    } catch (err)
    {
      toast.error(err.response?.data?.message || 'Failed to complete transaction.');
    }
  };

  const onRatingSuccess = () => {
    setHasRated(true);
    toast.info("Thank you for your feedback!");
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="my-5">{error}</Alert>;
  if (!post) return <Alert variant="warning" className="my-5">Post not found.</Alert>;

  const isDonor = user && user._id === post.owner._id;
  const isClaimer = user && post.claimedBy && user._id === post.claimedBy;
  const canClaim = user && !isDonor && post.status === 'available';
  const canComplete = isClaimer && post.status === 'claimed';
  const canChat = (isDonor || isClaimer) && post.status !== 'available';
  const showRatingForm = isClaimer && post.status === 'completed' && !hasRated;

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
            <Card.Img src={`https://source.unsplash.com/random/600x400/?food,${post.category || 'meal'}`} className="rounded-start" style={{ objectFit: 'cover', height: '100%' }} />
          </Col>
          <Col md={6}>
            <Card.Body className="p-4 p-lg-5 d-flex flex-column h-100">
              <div>
                <Badge bg={post.status === 'available' ? 'success' : 'secondary'} className="mb-2 fs-6">{post.status}</Badge>
                <h1 className="fw-bold display-5">{post.title}</h1>
                <div className="mb-3 text-muted">
                  <span><i className="fas fa-user me-2"></i>Donated by <strong>{post.owner.name}</strong></span>
                  <span className="mx-2">|</span>
                  <span><i className="fas fa-star me-1 text-warning"></i>{post.owner.rating.toFixed(1)} ({post.owner.ratingCount} ratings)</span>
                </div>
                <p className="lead">{post.description || 'No description provided.'}</p>
                <ListGroup variant="flush" className="my-4">
                  <ListGroup.Item className="px-0"><i className="fas fa-box-open fa-fw me-2 text-primary"></i><strong>Quantity:</strong> {post.quantity}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-tag fa-fw me-2 text-primary"></i><strong>Category:</strong> {post.category || 'N/A'}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-map-marker-alt fa-fw me-2 text-primary"></i><strong>Address:</strong> {post.address}</ListGroup.Item>
                  <ListGroup.Item className="px-0"><i className="fas fa-calendar-times fa-fw me-2 text-primary"></i><strong>Expires:</strong> {new Date(post.expiresAt).toLocaleDateString()}</ListGroup.Item>
                </ListGroup>
              </div>

              <div className="mt-auto">
                {isDonor && <Alert variant="light" className="text-center">You are the donor of this item.</Alert>}
                {isClaimer && post.status === 'claimed' && <Alert variant="light" className="text-center">You have claimed this item. Arrange pickup via chat.</Alert>}
                {isClaimer && post.status === 'completed' && hasRated && <Alert variant="success" className="text-center">You have already rated this transaction. Thank you!</Alert>}
                {!user && post.status === 'available' && <Alert variant="warning" className="text-center"><Link to="/login">Log in</Link> to claim this item.</Alert>}

                <div className="d-grid gap-2">
                  {canClaim && <Button variant="primary" size="lg" onClick={handleClaim}>Claim Item</Button>}
                  {canComplete && <Button variant="success" size="lg" onClick={handleComplete}>Mark as Received</Button>}
                  {canChat && <Button variant="secondary" size="lg" onClick={() => setShowChat(true)}><i className="fas fa-comments me-2"></i>Chat with {isDonor ? 'Claimer' : 'Donor'}</Button>}
                </div>
                
                {showRatingForm && <RateDonorForm postId={id} onRatingSuccess={onRatingSuccess} />}
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>
      
      {canChat && <ChatModal show={showChat} handleClose={() => setShowChat(false)} postId={id} postModel="FoodPost" />}
    </Container>
  );
};

export default PostDetailsPage;