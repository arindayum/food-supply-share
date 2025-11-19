import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';

const MapPage = () => {
  return (
    // Use a fluid container to allow the map to take up more width
    <Container fluid>
      <Row className="align-items-center my-4">
        <Col>
          <h1>Food Map</h1>
        </Col>
        <Col className="text-end">
          <Link to="/" className="btn btn-outline-secondary">
            List View
          </Link>
        </Col>
      </Row>
      <MapView />
    </Container>
  );
};

export default MapPage;
