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
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-1 px-4">
        {remoteStream && (
          <div className="shadow-lg">
            {/* <h2 className="text-xl mb-4">Remote User</h2> */}
            <div className="h-screen p-4 rounded-lg">
              <ReactPlayer
                playing
                height="100%"
                width="100%"
                url={remoteStream}
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="w-96 bg-gray-800 p-4 space-y-4">
        <h1 className="text-2xl">Room Page</h1>
        <div className="text-lg">
          {remoteSocketId ? 'Connected' : 'No one in Room'}
        </div>
        {myStream && (
          <div className="">
            {/* <h2 className="text-xl mb-4">My Stream</h2> */}
            <div className="overflow-x-auto">
              <ReactPlayer
                playing
                height="200px"
                width="350px"
                url={myStream}
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
            <div className="flex justify-center mt-4 space-x-4">
              <button
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none"
                onClick={handleMuteAudio}
              >
                {isMuted ? (
                    <svg class="h-8 w-8 text-red-500"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="1" y1="1" x2="23" y2="23" />  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />  <line x1="12" y1="19" x2="12" y2="23" />  <line x1="8" y1="23" x2="16" y2="23" /></svg>
                ) : (
                    <svg class="h-8 w-8 text-blue-500"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />  <line x1="12" y1="19" x2="12" y2="23" />  <line x1="8" y1="23" x2="16" y2="23" /></svg>
                    
                )}
              </button>
              <button
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none"
                onClick={handleHideVideo}
              >
                {isVideoHidden ? (
                    <svg class="h-8 w-8 text-red-500"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />  <line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                    <svg class="h-8 w-8 text-blue-500"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polygon points="23 7 16 12 23 17 23 7" />  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                    
                )}
              </button>
              <button
                className="p-2 rounded-full bg-red-600 hover:bg-red-500 focus:outline-none"
                onClick={handleCallEnd}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-center space-x-4">
          {myStream && !callEstablished && (
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 focus:outline-none"
              onClick={sendStreams}
            >
              Send Stream
            </button>
          )}
          {remoteSocketId && !callEstablished && (
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 focus:outline-none"
              onClick={handleCallUser}
            >
              Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;