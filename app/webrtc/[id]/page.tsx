"use client";
import {useEffect, useRef, useState} from 'react';
import Peer from 'peerjs';
import {useParams} from "next/navigation";
import {Button} from "@/components/ui";

const PeerPage = () => {
    const {id} = useParams();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const callingVideoRef = useRef<HTMLVideoElement>(null);
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [myUniqueId, setMyUniqueId] = useState<string>("");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<string>("Déconnecté");

    const generateRandomString = () => Math.random().toString(36).substring(2);

    const requestMediaPermissions = () => {
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
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
            const call = peerInstance?.call(id as string, localStream);
            if (call) {
                call.on('stream', userVideoStream => {
                    setStatus("connecté")
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
                host: process.env.NEXT_PUBLIC_HOST,
                port: 9000,
                path: '/',
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
        <div className='flex flex-col justify-around h-full gap-6 items-center p-12'>
            <video className='w-72' playsInline ref={myVideoRef} autoPlay muted/>
            <Button onClick={requestMediaPermissions}>Activer le micro</Button>
            <Button onClick={handleCall}>Rejoindre l'appel</Button>
            {
                callingVideoRef ? <video className='w-72' playsInline ref={callingVideoRef} autoPlay/> :
                    <span>Aucun signal</span>
            }
            <p>Statut : {status}</p>
        </div>
    );
};

export default PeerPage;
