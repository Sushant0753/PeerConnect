const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Socket.io server is running');
});

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
    console.log("new connection");
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

module.exports = (req, res) => {
    server.emit('request', req, res);
};

if (!process.env.VERCEL) {
    server.listen(8000, () => {
        console.log('Socket.io server is running on port 8000');
    });
}
