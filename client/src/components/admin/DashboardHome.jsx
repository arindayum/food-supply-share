import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Spinner, Alert, Container } from 'react-bootstrap';

const StatCard = ({ title, value, icon, color }) => (
  <Card className={`shadow-sm border-start border-${color} border-4 h-100`}>
    <Card.Body>
      <Row className="no-gutters align-items-center">
        <Col className="mr-2">
          <div className={`text-xs fw-bold text-${color} text-uppercase mb-1`}>{title}</div>
          <div className="h5 mb-0 fw-bold text-gray-800">{value}</div>
        </Col>
        <Col xs="auto">
          <i className={`fas ${icon} fa-2x text-gray-300`}></i>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/admin/stats');
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container>
        <h3 className="mb-4">Platform Statistics</h3>
        {stats && (
            <Row>
                <Col md={4} className="mb-4">
                    <StatCard title={stats.users.label} value={stats.users.count} icon="fa-users" color="primary" />
                </Col>
                <Col md={4} className="mb-4">
                    <StatCard title={stats.posts.label} value={stats.posts.count} icon="fa-clipboard-list" color="success" />
                </Col>
                <Col md={4} className="mb-4">
                    <StatCard title={stats.completed.label} value={stats.completed.count} icon="fa-check-circle" color="info" />
                </Col>
            </Row>
        )}
    </Container>
  );
};

export default DashboardHome;
