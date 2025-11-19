import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ChatsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/chat');
        setConversations(data);
      } catch (err) {
        setError('Failed to load your conversations.');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="fw-bold mb-4">My Chats</h1>
          <Card className="shadow-sm">
            <ListGroup variant="flush">
              {conversations.length > 0 ? (
                conversations.map(convo => (
                  <ListGroup.Item key={convo._id} action as={Link} to={`/posts/${convo.relatedPostId._id}`} className="p-3 d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-comments me-3 text-primary"></i>
                      Chat about post: <strong>{convo.relatedPostId.title || convo.relatedPostId.name}</strong>
                    </div>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="p-4 text-center text-muted">
                  You have no active conversations.
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatsPage;
