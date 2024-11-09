# PeerConnect - WebRTC Video Calling Application

A real-time peer-to-peer video calling application built with React, Node.js, Socket.IO, and WebRTC.

## Features

- Real-time video calling
- Audio mute/unmute functionality
- Video toggle functionality
- Room-based communication
- Peer-to-peer connection using WebRTC
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Real-time Communication**: Socket.IO
- **Video Calling**: WebRTC
- **Styling**: Tailwind CSS
- **Routing**: React Router

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/peer-connect.git
cd peer-connect
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Create `.env` files:

Backend (.env):
```env
PORT=8000
```

Frontend (.env):
```env
VITE_SOCKET_SERVER_URL=http://localhost:8000
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

3. Access the application at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Enter your email and a room code
3. Share the room code with another user
4. Once both users are in the room, click the "Call" button to initiate the video call
5. Use the control buttons to:
   - Toggle microphone
   - Toggle video
   - End call

## Deployment

The application is configured for deployment on:
- Frontend: Vercel
- Backend: Any Node.js hosting service (Render)

Make sure to update the `VITE_SOCKET_SERVER_URL` in your frontend environment variables to point to your deployed backend URL.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
