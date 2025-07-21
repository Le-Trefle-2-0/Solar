'use client';
import React, {createContext, useContext, useState} from "react";
import Peer from "peerjs";

interface PeerContextProps {
    peerInstance: Peer | null;
    callColor: string;
    startCall: (
        myVideoRef: React.RefObject<HTMLAudioElement | null>,
        remoteVideoRef: React.RefObject<HTMLAudioElement | null>
    ) => Promise<void>;
    stopCall: () => void;
}

const PeerContext = createContext<PeerContextProps>({
    peerInstance: null,
    callColor: "#000",
    startCall: async () => {
    },
    stopCall: () => {
    },
});

export const usePeer = () => useContext(PeerContext);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [callColor, setCallColor] = useState("#000");

    const startCall = async (
        myVideoRef: React.RefObject<HTMLAudioElement | null>,
        remoteVideoRef: React.RefObject<HTMLAudioElement | null>
    ) => {
        if (peerInstance) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }

            const callID = Math.random().toString(36).substring(2);
            const peer = new Peer(callID, {
                host: process.env.NEXT_PUBLIC_HOST,
                port: 9000,
                path: '/',
                secure: true
            });

            setPeerInstance(peer);
            setCallColor("#e0c43a");

            peer.on('call', call => {
                call.answer(stream);
                setCallColor("#5de03a");
                call.on('stream', userVideoStream => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = userVideoStream;
                    }
                });
            });

            // send your call link in the chat here if you have sendMessage:
            // sendMessage(`${process.env.NEXT_PUBLIC_APP_URL}/webrtc/${callID}`);

        } catch (error) {
            console.error("Error accessing media devices:", error);
            alert("Please allow access to microphone.");
        }
    };

    const stopCall = () => {
        if (peerInstance) {
            peerInstance.disconnect();
            setPeerInstance(null);
            setCallColor("#000");
        }
    };

    return (
        <PeerContext.Provider value={{peerInstance, callColor, startCall, stopCall}}>
            {children}
        </PeerContext.Provider>
    );
};
