import React, { createContext, useContext, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const socketURL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_SOCKET_URL_PROD
      : process.env.REACT_APP_SOCKET_URL;

  const socket = useMemo(() => io(socketURL), [socketURL]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};
