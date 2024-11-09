class PeerService {
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
        sdpSemantics: 'unified-plan',
        rtcAudioJitter: {
        initial_delay: 50
        },
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // Audio processing
        audio: {
          echoCancellation: {exact: true},
          noiseSuppression: {exact: true},
          autoGainControl: {exact: true},
          googEchoCancellation: {exact: true},
          googAutoGainControl: {exact: true},
          googNoiseSuppression: {exact: true},
          googHighpassFilter: {exact: true},
          googTypingNoiseDetection: {exact: true}
        }
      });
    }
  }

  async getAnswer(offer) {
    if(this.peer) {
        await this.peer.setRemoteDescription(offer);
        const ans = await this.peer.createAnswer();
        await this.peer.setLocalDescription(new RTCSessionDescription(ans));
        return ans;
    }
  }

  async getOffer() {
    if(this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      return offer;
    }
  }

  async setLocalDescription(ans) {
    if(this.peer){
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    }
  }

}
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: true
});

export default new PeerService();