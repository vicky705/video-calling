import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import UserControls from './UserControls';

const socket = io('https://video-calling-xhlp.onrender.com');

const VideoCall: React.FC = () => {
  const [yourID, setYourID] = useState('');
  const [caller, setCaller] = useState('');
  const [receivingCall, setReceivingCall] = useState(false);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callTo, setCallTo] = useState('');

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then(currentStream => {
        setStream(currentStream);
      });

    socket.on('your-id', (id: string) => {
      setYourID(id);
    });

    socket.on('receive-call', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      setReceivingCall(true);
      setCaller(data.from);
      setOffer(data.offer);
    });

    socket.on('call-accepted', async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallAccepted(true);
    });

    socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      if (!peerConnection.current) return;
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }, []);

  const callUser = async (id: string) => {
    if (!stream) return;

    const pc = new RTCPeerConnection();
    peerConnection.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: id, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('call-user', {
      to: id,
      from: yourID,
      offer,
    });
  };

  const answerCall = async () => {
    if (!stream || !offer) return;

    const pc = new RTCPeerConnection();
    peerConnection.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: caller, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer-call', { to: caller, answer });
    setCallAccepted(true);
  };

  return (
    <div>
      <p>Your ID: <b>{yourID}</b></p>
      <UserControls callTo={callTo} setCallTo={setCallTo} callUser={callUser} />
      {receivingCall && !callAccepted && (
        <div>
          <h3>{caller} is calling you...</h3>
          <button onClick={answerCall}>Answer</button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;