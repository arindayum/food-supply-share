import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Spinner, Alert, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/admin/users?page=${page}`);
        setUsers(data.users);
        setPage(data.page);
        setPages(data.pages);
      } catch (err) {
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${id}`);
        setUsers(users.filter(u => u._id !== id));
        toast.success('User deleted successfully.');
      } catch (err) {
        toast.error('Failed to delete user.');
      }
    }
  };

  return (
    <div>
      <h3 className="mb-4">Manage Users</h3>
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <>
          <Table striped bordered hover responsive className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                  <td>{user.role === 'admin' ? <span className="badge bg-success">Admin</span> : <span className="badge bg-secondary">User</span>}</td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteHandler(user._id)}>
                      <i className="fas fa-trash"></i> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination>
            {[...Array(pages).keys()].map(x => (
              <Pagination.Item key={x + 1} active={x + 1 === page} onClick={() => setPage(x + 1)}>
                {x + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      )}
    </div>
  );
};

export default UserManagement;
