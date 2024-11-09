require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["https://peer-connect-1otf.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);
    
    socket.on("join-room", (data) => {
        const { roomId, email } = data;
        console.log("User", email, "Joined Room", roomId);
        emailToSocketMapping.set(email, socket.id);
        socketToEmailMapping.set(socket.id, email);
        io.to(roomId).emit("user-joined", { email, id: socket.id });
        socket.join(roomId);
        io.to(socket.id).emit("join-room", data);
    });

    socket.on("user-call", ({ to, offer }) => {
        io.to(to).emit("incoming-call", { from: socket.id, offer });
    });

    socket.on("call-accepted", ({ to, ans }) => {
        io.to(to).emit("call-accepted", { from: socket.id, ans });
    });

    socket.on("peer-nego-needed", ({ to, offer }) => {
        io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
    });

    socket.on("peer-nego-done", ({ to, ans }) => {
        io.to(to).emit("peer-nego-final", { from: socket.id, ans });
    });
});

// Basic health check route
app.get('/', (req, res) => {
    res.send('WebRTC Server is running');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});