import React, { createContext, useContext, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = (props) => {
    const socketUrl = useMemo(() => {
        if (import.meta.env.PROD) {
            return import.meta.env.VITE_SOCKET_SERVER_URL;
        }
        return 'http://localhost:8000';
    }, []);

    const socket = useMemo(() => 
        io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true
        })
    , [socketUrl]);

    socket.on('connect_error', (err) => {
        console.log('Connection error:', err);
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
    });

    return (
        <SocketContext.Provider value={{ socket }}>
            {props.children}
        </SocketContext.Provider>
    );
};