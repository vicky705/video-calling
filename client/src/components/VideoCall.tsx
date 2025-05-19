import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import UserControls from './UserControls';

type SignalData = any;

const socket = io('http://localhost:5000');

const VideoCall: React.FC = () => {
  const [yourID, setYourID] = useState<string>('');
  const [caller, setCaller] = useState<string>('');
  const [receivingCall, setReceivingCall] = useState<boolean>(false);
  const [callerSignal, setCallerSignal] = useState<SignalData>();
  const [callAccepted, setCallAccepted] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream>();
  const [callTo, setCallTo] = useState<string>('');
  const connectionRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then(currentStream => {
        setStream(currentStream);
      });

    socket.on('your-id', (id: string) => {
      setYourID(id);
    });

    socket.on('receive-call', (data: { from: string; signal: SignalData }) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  const callUser = (id: string) => {
    if (!stream) return;

    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (signal: SignalData) => {
      socket.emit('call-user', {
        to: id,
        from: yourID,
        signal,
      });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.play();
    });

    socket.on('call-accepted', (signal: SignalData) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    if (!stream) return;

    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (signal: SignalData) => {
      socket.emit('answer-call', { signal, to: caller });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.play();
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
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