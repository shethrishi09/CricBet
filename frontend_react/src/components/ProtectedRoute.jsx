import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthProvider'; // Make sure the path is correct

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    // If the user is not logged in, redirect them to the login page
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, render the component they are trying to access
  return children;
};

export default ProtectedRoute;