"use client";

import {io} from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

// If NEXT_PUBLIC_WS_URL is set, connect to that origin; otherwise fallback to same-origin
export const socket = WS_URL
    ? io(WS_URL, {withCredentials: true})
    : io({withCredentials: true});