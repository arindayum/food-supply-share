import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Alert } from 'react-bootstrap';

/**
 * A component to protect routes that are exclusively for admin users.
 * It checks for a logged-in user and whether their role is 'admin'.
 * If not, it redirects them to the home page.
 */
const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></div>;
  }

  if (!user) {
    // If no user is logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If the user is not an admin, redirect to the home page
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
