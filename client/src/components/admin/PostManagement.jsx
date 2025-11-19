import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', ownerEmail: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/posts', { params: filters });
      setPosts(data);
    } catch (err) {
      setError('Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/api/admin/posts/${id}`);
        setPosts(posts.filter(p => p._id !== id));
        toast.success('Post deleted successfully.');
      } catch (err) {
        toast.error('Failed to delete post.');
      }
    }
  };

  return (
    <div>
      <h3 className="mb-4">Manage Posts</h3>
      <Form onSubmit={handleFilterSubmit} className="mb-4 p-3 bg-light rounded">
        <Row className="align-items-end">
          <Col md={5}>
            <Form.Group controlId="ownerEmail">
              <Form.Label>Filter by Owner Email</Form.Label>
              <Form.Control type="text" name="ownerEmail" value={filters.ownerEmail} onChange={handleFilterChange} />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group controlId="status">
              <Form.Label>Filter by Status</Form.Label>
              <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button type="submit" className="w-100">Filter</Button>
          </Col>
        </Row>
      </Form>

      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <Table striped bordered hover responsive className="align-middle">
          <thead className="bg-light">
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Expires At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post._id}>
                <td>{post.title || post.name}</td>
                <td>{post.owner?.name || 'N/A'} ({post.owner?.email || 'N/A'})</td>
                <td><span className={`badge bg-${post.status === 'available' ? 'success' : 'secondary'}`}>{post.status}</span></td>
                <td>{new Date(post.expiresAt).toLocaleDateString()}</td>
                <td>
                  <Button variant="outline-danger" size="sm" onClick={() => deleteHandler(post._id)}>
                    <i className="fas fa-trash"></i> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default PostManagement;
