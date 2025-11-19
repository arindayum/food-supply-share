
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Container, Row, Col, ListGroup, Badge } from 'react-bootstrap';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Header as="h2" className="p-4 bg-dark text-white text-center rounded-top">
              <i className="fas fa-user-circle fa-2x mb-2"></i><br/>
              My Profile
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong className="text-muted">Name:</strong>
                  <span className="fs-5">{user?.name || "N/A"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong className="text-muted">Email:</strong>
                  <span>{user?.email || "N/A"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong className="text-muted">Role:</strong>
                  <span className="text-capitalize badge bg-primary">{user?.role || "user"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong className="text-muted">Completed Posts:</strong>
                  <Badge bg="success" pill className="fs-6">{user?.postsCompleted || 0}</Badge>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong className="text-muted">Average Rating:</strong>
                  <span>
                    <i className="fas fa-star text-warning me-1"></i>
                    <strong>{user?.rating ? user.rating.toFixed(1) : "N/A"}</strong>
                    <span className="text-muted ms-1">
                      ({user?.ratingCount || 0} ratings)
                    </span>
                  </span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
