import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

export const protectRoute = async (req, res, next) => {
    try {
        // Check token from cookies or Authorization header
        let token;
        // Check cookies first
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } 
        // Then check Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            console.log("No token found in cookies or Authorization header");
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        } catch (jwtError) {
            console.log("JWT verification error:", jwtError.message);
            return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
        }
        if(!decoded) {
            console.log("Token verification failed");
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        // Debug: log decoded token
        console.log('protectRoute: decoded token:', decoded);
        // Convert decoded ID to string if it's a MongoDB ObjectId
        const decodedId = decoded._id?.toString() || decoded.id?.toString();
        // Find user with consistent ID handling
        const user = await User.findById(decodedId).select("-password");
        // Debug: log found user
        console.log('protectRoute: found user:', user);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User not found" });
        }
        // Set user on request object
        req.user = user;
        // IMPORTANT: Ensure consistent ID format
        // Always set req.user.id as a string representation
        if (user._id) {
            req.user.id = user._id.toString();
        }
        // Debug: log req.user
        console.log('protectRoute: req.user:', req.user);
        next();
    } catch (error) {
        console.log("Error in auth middleware:", error.message || error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// Alias for consistency with other route files
export const protect = protectRoute;

// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Access denied. Please authenticate first.' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
            });
        }

        next();
    };
};