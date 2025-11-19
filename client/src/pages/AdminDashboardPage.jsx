import React from 'react';
import { Container, Tabs, Tab, Card } from 'react-bootstrap';
import UserManagement from '../components/admin/UserManagement';
import PostManagement from '../components/admin/PostManagement';
import DashboardHome from '../components/admin/DashboardHome';

const AdminDashboardPage = () => {
  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="bg-dark text-white">
          Admin Dashboard
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="dashboard" id="admin-dashboard-tabs" className="mb-3" fill>
            <Tab eventKey="dashboard" title="Dashboard">
              <DashboardHome />
            </Tab>
            <Tab eventKey="users" title="User Management">
              <UserManagement />
            </Tab>
            <Tab eventKey="posts" title="Post Management">
              <PostManagement />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboardPage;