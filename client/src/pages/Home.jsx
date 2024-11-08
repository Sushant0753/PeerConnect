import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/Sockets";
import { useNavigate } from "react-router-dom";

const Homepage = ()=>{
    const {socket} = useSocket();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("");
    const [roomId, setRoomId] = useState("");

    const handleRoomJoined = useCallback(
        (data) => {
            const {email, roomId} = data;
            navigate(`/room/${roomId}`)
        },
        [navigate]
    );

    useEffect(()=> {
        socket.on("join-room", handleRoomJoined);
        return ()=> {
            socket.off("join-room", handleRoomJoined);
        }
    }, [socket, handleRoomJoined])

    const handleSubmitForm = useCallback((e)=>{
        e.preventDefault();
        socket.emit("join-room", {email, roomId});
    },[email, roomId, socket])

    return(
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="flex flex-col space-y-6 p-8 bg-white shadow-lg rounded-lg max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 text-center">Join a Room</h2>
                <form onSubmit={handleSubmitForm} className="flex flex-col space-y-6">
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="text"
                        id="roomId"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                        placeholder="Enter Room Code"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    >
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    )
};

export default Homepage;