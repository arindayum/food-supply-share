import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from 'react-bootstrap';

/**
 * A component that wraps protected routes.
 * It checks for an authenticated user from the AuthContext.
 * If the user is logged in, it renders the child component (`Outlet`).
 * If not, it redirects the user to the login page.
 * It also handles the initial loading state of the auth context.
 */
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading spinner while auth state is being determined
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
