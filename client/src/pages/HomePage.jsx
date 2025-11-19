import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket'; // Import the useSocket hook

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const { socket, isConnected, error: socketError } = useSocket();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        setError('Geolocation is not available. Showing all available posts.');
        setLoading(false);
        // Fetch all posts if geo fails
        fetchAllPosts();
      }
    );
  }, []);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/posts');
      setPosts(data);
    } catch (err) {
      setError('Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      const fetchNearbyPosts = async () => {
        try {
          setLoading(true);
          const { data } = await axios.get('/api/posts', {
            params: { lat: location.lat, lng: location.lng, radiusKm: 10 },
          });
          setPosts(data);
        } catch (err) {
          setError('Failed to fetch nearby posts.');
        } finally {
          setLoading(false);
        }
      };
      fetchNearbyPosts();
    }
    
    if (socket && isConnected) {
      socket.on('new_post', (newPost) => {
        // Basic check to see if the new post is within a reasonable distance
        // A more advanced solution would calculate distance on the client
        setPosts((prevPosts) => [newPost, ...prevPosts]);
      });

      return () => socket.off('new_post');
    }
  }, [location, socket, isConnected]);

  return (
    <Container>
      <div className="text-center my-5 p-5 bg-light rounded-3 shadow-sm">
        <h1 className="display-4 fw-bold">Reduce Waste, Share Food</h1>
        <p className="fs-4 text-muted">Join a community dedicated to connecting surplus food with those who need it. Browse nearby listings or post your own surplus items.</p>
        <Link to="/posts/create" className="btn btn-primary btn-lg">
          <i className="fas fa-plus-circle me-2"></i>Share Food Now
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center my-4">
        <h2 className="fw-bold">Nearby Posts</h2>
        <Link to="/map" className="btn btn-outline-secondary">
          <i className="fas fa-map-marked-alt me-2"></i>Map View
        </Link>
      </div>
      
      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger">{error}</Alert>}
      {socketError && <Alert variant="warning" className="mt-2">Real-time updates unavailable: {socketError}</Alert>}
      
      {!loading && !error && (
        <Row>
          {posts.length > 0 ? (
            posts.map((post) => (
              <Col key={post._id} sm={12} md={6} lg={4} xl={3} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img variant="top" src={`https://via.placeholder.com/300x200?text=${post.category || 'Food'}`} />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="fw-bold mb-2">{post.title}</Card.Title>
                    <Card.Text className="text-muted small mb-3">
                      <i className="fas fa-user me-1"></i> {post.owner.name}
                    </Card.Text>
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className={`badge bg-${post.status === 'available' ? 'success' : 'secondary'}`}>
                          <i className={`fas ${post.status === 'available' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                          {post.status}
                        </span>
                        <span className="text-muted small">
                          <i className="fas fa-calendar-alt me-1"></i>
                          {new Date(post.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Link to={`/posts/${post._id}`} className="btn btn-outline-primary w-100">
                        View Details
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info">No available posts found nearby. Why not be the first to share?</Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default HomePage;

