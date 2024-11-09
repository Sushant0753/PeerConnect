import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/Sockets";
import ReactPlayer from "react-player";
import peer from "../service/peer";

const RoomPage = () => {
    const { socket } = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoHidden, setIsVideoHidden] = useState(false);
    const [callEstablished, setCallEstablished] = useState(false);

  const handleNewUserJoined = useCallback(({email, id}) =>{
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id)
  }, [])

  const handleCallUser = useCallback( async()=> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: true
    });
    const offer = await peer.getOffer();
    socket.emit("user-call", {to: remoteSocketId, offer});
    setMyStream(stream);
  }, [remoteSocketId, socket])

  const handleIncomingCall = useCallback(async ({from, offer})=> {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: true
    });
    setMyStream(stream);
    console.log(`Incoming Call`, from, offer);
    const ans = await peer.getAnswer(offer);
    socket.emit("call-accepted", {to: from, ans});
  }, [socket])


  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()){
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(({from, ans})=> {
    peer.setLocalDescription(ans);
    console.log("Call Accepted");
    sendStreams();
    setCallEstablished(true);
  }, [sendStreams])

  const handleNegoNeeded = useCallback(async ()=>{
    const offer = await peer.getOffer();
    socket.emit("peer-nego-needed", {offer, to: remoteSocketId})
  }, [remoteSocketId, socket])

  const handleIncomingNego = useCallback(async({from, offer})=>{
    const ans = await peer.getAnswer(offer);
    socket.emit("peer-nego-done", {to:from, ans});
  }, [socket])

  const handleNegoFinal = useCallback(async ({ans})=>{
    await peer.setLocalDescription(ans)
  }, [])

  const handleMuteAudio = useCallback(() => {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setIsMuted(!isMuted);
  }, [isMuted, myStream]);

  const handleHideVideo = useCallback(() => {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setIsVideoHidden(!isVideoHidden);
  }, [isVideoHidden, myStream]);


  const handleCallEnd = useCallback(() => {
    // End the call and disconnect
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    peer.peer.close();
    socket.emit('call-ended', { to: remoteSocketId });
    setMyStream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
  }, [myStream, remoteStream, remoteSocketId, socket, peer.peer]);

  useEffect(()=>{
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return() =>{
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    }
  },[handleNegoNeeded])

  useEffect(()=>{
    peer.peer.addEventListener('track', async (event) => {
      const remoteStream = event.streams;
      console.log("Got Tracks");
      setRemoteStream(remoteStream[0]);
    });
  },[])

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("peer-nego-needed", handleIncomingNego);
    socket.on("peer-nego-final", handleNegoFinal);
    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("peer-nego-needed", handleIncomingNego);
      socket.off("peer-nego-final", handleNegoFinal);
    }
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleIncomingNego, handleNegoFinal]);


  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Main video container */}
      <div className="relative flex-1">
        {remoteStream ? (
          <div className="h-full">
            <ReactPlayer
              playing
              height="100%"
              width="100%"
              url={remoteStream}
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-white text-xl">Waiting for remote stream...</div>
          </div>
        )}

        {/* My video overlay */}
        {myStream && (
          <div className="absolute bottom-20 right-4 w-32 h-48 rounded-lg overflow-hidden">
            <ReactPlayer
              playing
              height="100%"
              width="100%"
              url={myStream}
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        {/* Control buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {myStream && (
            <>
              <button
                className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none"
                onClick={handleMuteAudio}
              >
                {isMuted ? (
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                )}
              </button>

              <button
                className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none"
                onClick={handleHideVideo}
              >
                {isVideoHidden ? (
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                )}
              </button>

              <button
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 focus:outline-none"
                onClick={handleCallEnd}
              >
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 3L3 21" />
                  <path d="M3 3l18 18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Call controls */}
      {!callEstablished && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-4">
          {remoteSocketId && !myStream && (
            <button
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 focus:outline-none text-white"
              onClick={handleCallUser}
            >
              Start Call
            </button>
          )}
          {myStream && !callEstablished && (
            <button
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 focus:outline-none text-white"
              onClick={sendStreams}
            >
              Send Stream
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomPage;