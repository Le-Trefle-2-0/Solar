"use client";

import {Device} from "mediasoup-client";
import type {Consumer, Producer, Transport} from "mediasoup-client/types";
import {io, type Socket} from "socket.io-client";

/**
 * Browser side of a voice room (shared by the volunteer app, the widget and the public voice
 * page). Audio goes through the voice service; nobody connects directly to anyone.
 */

export type VoiceRoomType = "permanence" | "ticket";
export type VoiceStatus = "idle" | "connecting" | "connected" | "reconnecting" | "ended" | "error";

export interface VoiceParticipant {
    peerId: string;
    name: string;
    muted: boolean;
    speaking: boolean;
    self?: boolean;
}

export interface VoiceSessionEvents {
    onStatus?: (status: VoiceStatus, error?: string) => void;
    onParticipants?: (participants: VoiceParticipant[]) => void;
}

export type VoiceAuth = {jwt: string} | {voiceToken: {channelId: string; exp: number; t: string}};

/** Readable French messages for the service's refusals. */
export const VOICE_ERRORS: Record<string, string> = {
    room_full: "L'appel est déjà complet.",
    already_connected: "Vous êtes déjà connecté à ce salon depuis un autre onglet.",
    no_voice_call: "Cet appel n'est pas (ou plus) disponible.",
    invalid_token: "Ce lien d'appel n'est plus valable.",
    forbidden: "Vous n'avez pas accès à ce salon vocal.",
    api_unavailable: "Le service vocal est momentanément indisponible.",
    microphone: "L'accès au micro a été refusé. Autorisez-le dans votre navigateur pour parler.",
    connection: "Impossible de joindre le service vocal.",
};

export function voiceServiceUrl(): string {
    const env = (process.env.NEXT_PUBLIC_VOICE_URL || "").trim();
    if (env) return env.replace(/\/$/, "");
    return window.location.origin.replace(":3000", ":3003");
}

type Ack<T> = T & {error?: string};

export class VoiceSession {
    private socket: Socket | null = null;
    private device: Device | null = null;
    private sendTransport: Transport | null = null;
    private recvTransport: Transport | null = null;
    private producer: Producer | null = null;
    private stream: MediaStream | null = null;
    private consumers = new Map<string, {consumer: Consumer; audio: HTMLAudioElement; peerId: string}>();
    private participants = new Map<string, VoiceParticipant>();
    private selfId: string | null = null;
    private closed = false;
    private started = false;
    muted = false;

    constructor(
        private readonly room: {type: VoiceRoomType; channelId: string},
        private readonly auth: VoiceAuth,
        private readonly events: VoiceSessionEvents = {},
    ) {
    }

    private status(s: VoiceStatus, error?: string) {
        this.events.onStatus?.(s, error);
    }

    private emitParticipants() {
        this.events.onParticipants?.([...this.participants.values()]);
    }

    private request<T>(event: string, payload?: unknown): Promise<Ack<T>> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error("connection"));
            this.socket.timeout(10_000).emit(event, payload, (err: unknown, res: Ack<T>) => {
                if (err) return reject(new Error("connection"));
                if (res?.error) return reject(new Error(res.error));
                resolve(res);
            });
        });
    }

    async start(): Promise<void> {
        // One start per session: a second click never opens a second microphone (#261)
        if (this.started || this.closed) return;
        this.started = true;
        this.status("connecting");
        // Left while connecting: the microphone opened meanwhile is released at once (#261)
        const stillWanted = () => {
            if (this.closed) throw new Error("closed");
        };
        try {
            // Microphone first: nothing is joined if the visitor refuses it
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
                    video: false,
                });
            } catch {
                throw new Error("microphone");
            }
            stillWanted();

            this.socket = io(voiceServiceUrl(), {
                auth: this.auth,
                transports: ["websocket", "polling"],
                reconnection: false,
                withCredentials: true,
            });
            await new Promise<void>((resolve, reject) => {
                this.socket!.once("connect", () => resolve());
                this.socket!.once("connect_error", () => reject(new Error("connection")));
            });
            stillWanted();
            this.listen();

            const joined = await this.request<{
                rtpCapabilities: any;
                self: {peerId: string};
                peers: {peerId: string; name: string; muted: boolean; producerId: string | null}[];
            }>("join", {room: this.room});
            this.selfId = joined.self.peerId;
            this.participants.set(this.selfId, {peerId: this.selfId, name: "Vous", muted: false, speaking: false, self: true});
            for (const p of joined.peers) this.participants.set(p.peerId, {peerId: p.peerId, name: p.name, muted: p.muted, speaking: false});
            this.emitParticipants();

            this.device = new Device();
            await this.device.load({routerRtpCapabilities: joined.rtpCapabilities});
            this.sendTransport = await this.createTransport("send");
            this.recvTransport = await this.createTransport("recv");

            const track = this.stream.getAudioTracks()[0];
            this.producer = await this.sendTransport.produce({track, codecOptions: {opusStereo: false, opusDtx: true}});

            for (const p of joined.peers) if (p.producerId) await this.consume(p.producerId);
            if (!this.closed) this.status("connected");
        } catch (e: any) {
            const code = e?.message || "connection";
            const left = this.closed;
            this.cleanup();
            if (!left && code !== "closed") this.status("error", VOICE_ERRORS[code] || VOICE_ERRORS.connection);
        }
    }

    private async createTransport(direction: "send" | "recv"): Promise<Transport> {
        const params = await this.request<any>("createTransport", {direction});
        const transport = direction === "send"
            ? this.device!.createSendTransport(params)
            : this.device!.createRecvTransport(params);
        transport.on("connect", ({dtlsParameters}, callback, errback) => {
            this.request("connectTransport", {transportId: transport.id, dtlsParameters}).then(() => callback(), errback);
        });
        if (direction === "send") {
            transport.on("produce", ({kind, rtpParameters}, callback, errback) => {
                this.request<{id: string}>("produce", {transportId: transport.id, kind, rtpParameters})
                    .then(({id}) => callback({id}), errback);
            });
        }
        transport.on("connectionstatechange", (state) => {
            if (this.closed) return;
            if (state === "disconnected") this.status("reconnecting");
            if (state === "connected") this.status("connected");
            if (state === "failed") {
                this.cleanup();
                this.status("error", VOICE_ERRORS.connection);
            }
        });
        return transport;
    }

    private async consume(producerId: string) {
        if (!this.recvTransport || !this.device) return;
        const params = await this.request<{id: string; producerId: string; peerId: string; kind: "audio"; rtpParameters: any}>(
            "consume", {transportId: this.recvTransport.id, producerId, rtpCapabilities: this.device.rtpCapabilities},
        );
        const consumer = await this.recvTransport.consume({
            id: params.id, producerId: params.producerId, kind: params.kind, rtpParameters: params.rtpParameters,
        });
        const audio = new Audio();
        audio.autoplay = true;
        audio.srcObject = new MediaStream([consumer.track]);
        audio.play().catch(() => undefined);
        this.consumers.set(consumer.id, {consumer, audio, peerId: params.peerId});
        await this.request("resumeConsumer", {consumerId: consumer.id});
    }

    private listen() {
        const s = this.socket!;
        s.on("peerJoined", (p: {peerId: string; name: string; muted: boolean}) => {
            this.participants.set(p.peerId, {peerId: p.peerId, name: p.name, muted: p.muted, speaking: false});
            this.emitParticipants();
        });
        s.on("peerLeft", ({peerId}: {peerId: string}) => {
            this.participants.delete(peerId);
            for (const [id, c] of this.consumers) {
                if (c.peerId === peerId) this.dropConsumer(id);
            }
            this.emitParticipants();
        });
        s.on("newProducer", ({producerId}: {producerId: string}) => {
            this.consume(producerId).catch(() => undefined);
        });
        s.on("consumerClosed", ({consumerId}: {consumerId: string}) => this.dropConsumer(consumerId));
        s.on("peerMuted", ({peerId, muted}: {peerId: string; muted: boolean}) => {
            const p = this.participants.get(peerId);
            if (p) p.muted = muted;
            this.emitParticipants();
        });
        s.on("speaking", ({peerIds}: {peerIds: string[]}) => {
            for (const p of this.participants.values()) p.speaking = peerIds.includes(p.peerId);
            this.emitParticipants();
        });
        // The volunteer ended the call, or the écoute was closed
        s.on("roomClosed", () => {
            if (this.closed) return;
            this.cleanup();
            this.status("ended", "L'appel est terminé.");
        });
        s.on("disconnect", () => {
            if (this.closed) return;
            this.cleanup();
            this.status("ended");
        });
    }

    private dropConsumer(id: string) {
        const c = this.consumers.get(id);
        if (!c) return;
        c.consumer.close();
        c.audio.srcObject = null;
        this.consumers.delete(id);
    }

    async setMuted(muted: boolean) {
        this.muted = muted;
        const track = this.stream?.getAudioTracks()[0];
        if (track) track.enabled = !muted;
        if (this.selfId) {
            const me = this.participants.get(this.selfId);
            if (me) me.muted = muted;
            this.emitParticipants();
        }
        await this.request("setMuted", {muted}).catch(() => undefined);
    }

    leave() {
        if (this.closed) return;
        this.socket?.emit("leave", {});
        this.cleanup();
        this.status("ended");
    }

    private cleanup() {
        this.closed = true;
        // Also when leaving while start() still waits: whatever it opened is closed here or by
        // start() itself as soon as it resumes
        for (const id of [...this.consumers.keys()]) this.dropConsumer(id);
        try {
            this.producer?.close();
            this.sendTransport?.close();
            this.recvTransport?.close();
        } catch {
            // already closed
        }
        this.stream?.getTracks().forEach(t => t.stop());
        this.stream = null;
        this.socket?.removeAllListeners();
        this.socket?.disconnect();
        this.socket = null;
        this.participants.clear();
        this.emitParticipants();
    }
}
