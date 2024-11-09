require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP Server
const server = http.createServer(app);

// Socket.IO setup with error handling
const io = new Server(server, {
    cors: {
        origin: ["https://peer-connect-1otf.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    connectTimeout: 60000
});

// Store active connections
const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

// Socket connection handling
io.on("connection", (socket) => {
    console.log(`New connection established: ${socket.id}`);

    // Handle join room event
    socket.on("join-room", (data) => {
        try {
            const { roomId, email } = data;
            console.log(`User ${email} joining room ${roomId}`);
            
            // Store mappings
            emailToSocketMapping.set(email, socket.id);
            socketToEmailMapping.set(socket.id, email);
            
            // Join room and notify others
            socket.join(roomId);
            io.to(roomId).emit("user-joined", { email, id: socket.id });
            io.to(socket.id).emit("join-room", data);
            
            console.log(`User ${email} successfully joined room ${roomId}`);
        } catch (error) {
            console.error('Error in join-room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Handle call initiation
    socket.on("user-call", ({ to, offer }) => {
        try {
            io.to(to).emit("incoming-call", { from: socket.id, offer });
            console.log(`Call initiated from ${socket.id} to ${to}`);
        } catch (error) {
            console.error('Error in user-call:', error);
            socket.emit('error', { message: 'Failed to initiate call' });
        }
    });

    // Handle call acceptance
    socket.on("call-accepted", ({ to, ans }) => {
        try {
            io.to(to).emit("call-accepted", { from: socket.id, ans });
            console.log(`Call accepted by ${socket.id}`);
        } catch (error) {
            console.error('Error in call-accepted:', error);
            socket.emit('error', { message: 'Failed to accept call' });
        }
    });

    // Handle WebRTC negotiation
    socket.on("peer-nego-needed", ({ to, offer }) => {
        try {
            io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
        } catch (error) {
            console.error('Error in peer-nego-needed:', error);
            socket.emit('error', { message: 'Negotiation failed' });
        }
    });

    // Handle negotiation completion
    socket.on("peer-nego-done", ({ to, ans }) => {
        try {
            io.to(to).emit("peer-nego-final", { from: socket.id, ans });
        } catch (error) {
            console.error('Error in peer-nego-done:', error);
            socket.emit('error', { message: 'Negotiation completion failed' });
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        try {
            const email = socketToEmailMapping.get(socket.id);
            socketToEmailMapping.delete(socket.id);
            emailToSocketMapping.delete(email);
            console.log(`User disconnected: ${socket.id}`);
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server is ready for connections`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Implement your preferred error reporting service here
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    // Implement your preferred error reporting service here
});