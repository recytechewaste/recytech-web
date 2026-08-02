import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    let userInfo = null;
    try {
        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            userInfo = JSON.parse(userInfoString);
        }
    } catch (error) {
        console.error("Failed to parse user info from localStorage", error);
        // If parsing fails, treat as logged out
        userInfo = null;
    }

    // 1. Check if user is logged in
    if (!userInfo || !userInfo._id) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check if the user's role is permitted to see this page
    // If allowedRoles is provided and user's role is not in the list, redirect to unauthorized
    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;