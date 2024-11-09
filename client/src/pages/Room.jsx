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
    const [streamSent, setStreamSent] = useState(false);
    const [isDisconnected, setIsDisconnected] = useState(false);

  const handleNewUserJoined = useCallback(({email, id}) =>{
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id);
    setIsDisconnected(false);
  }, [])

  const handleCallUser = useCallback( async()=> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: true
    });
    const offer = await peer.getOffer();
    socket.emit("user-call", {to: remoteSocketId, offer});
    setMyStream(stream);
    setIsDisconnected(false);
  }, [remoteSocketId, socket])

  const handleIncomingCall = useCallback(async ({from, offer})=> {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: true
    });
    setMyStream(stream);
    setIsDisconnected(false);
    console.log(`Incoming Call`, from, offer);
    const ans = await peer.getAnswer(offer);
    socket.emit("call-accepted", {to: from, ans});
  }, [socket])

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()){
      peer.peer.addTrack(track, myStream);
    }
    setStreamSent(true);
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
    setStreamSent(false);
    setCallEstablished(false);
    setIsDisconnected(true);
  }, [myStream, remoteStream, remoteSocketId, socket]);

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
      {/* Main content area - using grid for better control */}
      <div className="flex-1 grid place-items-center p-4 overflow-hidden">
        <div className="relative w-full h-full max-w-5xl mx-auto">
          {/* Remote Stream Container */}
          <div className="w-full h-full flex items-center justify-center">
            {remoteStream ? (
              <div className="relative w-full pt-[56.25%]">
                <div className="absolute inset-0">
                  <ReactPlayer
                    playing
                    width="100%"
                    height="100%"
                    url={remoteStream}
                    style={{ transform: 'scaleX(-1)' }}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="text-white text-xl text-center">
                {isDisconnected ? (
                  <div className="space-y-2">
                    <p className="text-red-500">Call Disconnected</p>
                    <p className="text-sm text-gray-400">The call has ended</p>
                  </div>
                ) : (
                  "Waiting for connection..."
                )}
              </div>
            )}
          </div>

          {/* PiP Local Stream */}
          {myStream && (
            <div className="absolute bottom-4 right-4 w-1/4 min-w-[160px] max-w-[240px]">
              <div className="relative pt-[56.25%] rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0">
                  <ReactPlayer
                    playing
                    width="100%"
                    height="100%"
                    url={myStream}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-black/50 backdrop-blur-sm py-4 px-4 md:px-0">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Connection Controls */}
            {!callEstablished && !streamSent && (
              <>
                {myStream && (
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                    onClick={sendStreams}
                  >
                    Send Stream
                  </button>
                )}
                {remoteSocketId && !myStream && (
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                    onClick={handleCallUser}
                  >
                    Call
                  </button>
                )}
              </>
            )}

            {/* Video Toggle */}
            <button
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleHideVideo}
              disabled={!myStream}
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

            {/* Audio Toggle */}
            <button
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleMuteAudio}
              disabled={!myStream}
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

            {/* Leave Call */}
            <button
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCallEnd}
              disabled={!myStream}
            >
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="23" y1="1" x2="1" y2="23" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;