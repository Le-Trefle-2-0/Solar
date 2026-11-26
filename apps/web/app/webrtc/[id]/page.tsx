"use client";
import {useEffect, useRef, useState} from 'react';
import Peer from 'peerjs';
import {useParams, useSearchParams} from "next/navigation";
import {Button} from "@/components/ui";

/** Same fallback as lib/api.ts (no session here: the visitor is not signed in). */
const apiUrl = () => (process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(':3000', ':3001')).replace(/\/$/, '');

/** Crypto-strong id: the visitor's peer id must not be guessable either. */
const randomId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return 'anon-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Visitor side of a voice call. The link carries a token signed by the API for one ticket
 * and 30 minutes (#241): it is checked before the microphone is turned on. This page only
 * places the call; it never answers an incoming one.
 */
const PeerPage = () => {
    const {id} = useParams();
    const search = useSearchParams();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const callingVideoRef = useRef<HTMLVideoElement>(null);
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<string>("Vérification du lien…");
    const [linkValid, setLinkValid] = useState<boolean | null>(null);

    const callId = typeof id === 'string' ? id : '';
    const token = search.get('t') || '';

    useEffect(() => {
        const q = new URLSearchParams({callId, c: search.get('c') || '', e: search.get('e') || '', t: token});
        fetch(`${apiUrl()}/v1/calls/verify?${q}`, {cache: 'no-store'})
            .then(r => r.json())
            .then((d: {valid?: boolean}) => {
                setLinkValid(!!d.valid);
                setStatus(d.valid ? "Déconnecté" : "Lien d'appel invalide ou expiré");
            })
            .catch(() => {
                setLinkValid(false);
                setStatus("Impossible de vérifier le lien d'appel");
            });
    }, [callId, search, token]);

    const requestMediaPermissions = () => {
        if (!linkValid) return;
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
            .then(stream => {
                setLocalStream(stream);
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            })
            .catch(error => {
                console.error("Error accessing media devices:", error);
                alert("Merci d'autoriser l'accès au micro pour rejoindre l'appel.");
            });
    };

    const handleCall = () => {
        if (!linkValid || !peerInstance) return;
        if (!localStream) {
            alert("Activez d'abord le micro.");
            return;
        }
        setStatus("En attente de l'acceptation…");
        // The token proves to the volunteer's page that this caller holds the signed link
        const call = peerInstance.call(callId, localStream, {metadata: {token}});
        call?.on('stream', remoteStream => {
            setStatus("Connecté");
            if (callingVideoRef.current) callingVideoRef.current.srcObject = remoteStream;
        });
        call?.on('close', () => setStatus("Appel terminé"));
    };

    useEffect(() => {
        if (!linkValid || !localStream) return;
        const peer = new Peer(randomId(), {
            host: process.env.NEXT_PUBLIC_HOST,
            port: 9000,
            path: '/',
            secure: true,
        });
        setPeerInstance(peer);
        // Never answer: nobody may open this visitor's microphone by calling them
        peer.on('call', incoming => incoming.close());
        return () => {
            peer.destroy();
        };
    }, [linkValid, localStream]);

    return (
        <div className='flex flex-col justify-around h-full gap-6 items-center p-12'>
            <video className='w-0 h-0' playsInline ref={myVideoRef} autoPlay muted/>
            <Button onClick={requestMediaPermissions} disabled={!linkValid}>Activer le micro</Button>
            <Button onClick={handleCall} disabled={!linkValid || !localStream}>Rejoindre l'appel</Button>
            <video className='w-72' playsInline ref={callingVideoRef} autoPlay/>
            <p>Statut : {status}</p>
        </div>
    );
};

export default PeerPage;
