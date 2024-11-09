import React, {createContext, useContext, useMemo} from "react";
import {io} from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () =>{
    return useContext(SocketContext);
};

export const SocketProvider = (props) =>{
    const socketUrl = useMemo(() => {
        if (process.env.NODE_ENV === 'production') {
            console.log(process.env.REACT_APP_SOCKET_URL_PRODUCTION);
            return process.env.REACT_APP_SOCKET_URL_PRODUCTION;
            
        } else {
            console.log(process.env.REACT_APP_SOCKET_URL)
            return process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

        }
    }, []);

    const socket = useMemo(() => io(socketUrl), [socketUrl]);
    console.log(socketUrl);

    return(
        <SocketContext.Provider value={{socket}}>
            {props.children}
        </SocketContext.Provider>
    )
}