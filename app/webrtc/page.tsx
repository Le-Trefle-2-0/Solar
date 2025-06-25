"use client";
import {useEffect, useRef, useState} from 'react';
import Peer from 'peerjs';

const PeerPage = () => {
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const callingVideoRef = useRef<HTMLVideoElement>(null);
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [myUniqueId, setMyUniqueId] = useState<string>("");
    const [idToCall, setIdToCall] = useState('');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const generateRandomString = () => Math.random().toString(36).substring(2);

    const requestMediaPermissions = () => {
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then(stream => {
                setLocalStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
            })
            .catch(error => {
                console.error("Error accessing media devices:", error);
                alert("Please allow access to the camera and microphone to use this feature.");
            });
    };

    const handleCall = () => {
        if (localStream) {
            const call = peerInstance?.call(idToCall, localStream);
            if (call) {
                call.on('stream', userVideoStream => {
                    if (callingVideoRef.current) {
                        callingVideoRef.current.srcObject = userVideoStream;
                    }
                });
            }
        } else {
            alert("Local stream is not available. Cannot make a call.");
        }
    };

    useEffect(() => {
        setMyUniqueId(generateRandomString());
    }, []);

    useEffect(() => {
        if (myUniqueId && localStream) {
            const peer = new Peer(myUniqueId, {
                host: 'localhost',
                port: 9000,
                path: '/myapp',
            });
            setPeerInstance(peer);

            peer.on('call', call => {
                call.answer(localStream);
                call.on('stream', userVideoStream => {
                    if (callingVideoRef.current) {
                        callingVideoRef.current.srcObject = userVideoStream;
                    }
                });
            });

            return () => {
                peer.destroy();
            };
        }
    }, [myUniqueId, localStream]);

    return (
        <div className='flex flex-col justify-center items-center p-12'>
            <p>Your ID: {myUniqueId}</p>
            <video className='w-72' playsInline ref={myVideoRef} autoPlay muted/>
            <button onClick={requestMediaPermissions}>Enable Camera and Microphone</button>
            <input
                className='text-black'
                placeholder="ID to call"
                value={idToCall}
                onChange={e => setIdToCall(e.target.value)}
            />
            <button onClick={handleCall}>Call</button>
            <video className='w-72' playsInline ref={callingVideoRef} autoPlay/>
        </div>
    );
};

export default PeerPage;
