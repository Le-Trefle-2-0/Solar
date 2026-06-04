import type {NextConfig} from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import {config} from "dotenv";
import path from "path";

// Load .env from project root
config({path: path.resolve(__dirname, "../../.env")});

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "media.tenor.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn.discordapp.com",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "7001",
                pathname: "/**",
            },
        ],
    },
    devIndicators: false,
    async rewrites() {
        // Help during development: if the client accidentally connects to the web origin
        // for Socket.IO, proxy the polling endpoint to the WS service on :5000.
        // Note: This mainly helps with XHR polling; for full WS upgrade, prefer setting
        // NEXT_PUBLIC_WS_URL to the WS origin (e.g., http://localhost:5000).
        const wsOrigin = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
        const normalized = wsOrigin.startsWith('ws')
            ? wsOrigin.replace(/^ws/, 'http')
            : wsOrigin;
        return [
            {
                source: '/socket.io/:path*',
                destination: `${normalized}/socket.io/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                // matching all API routes
                source: "/api/:path*",
                headers: [
                    {key: "Access-Control-Allow-Credentials", value: "true"},
                    {key: "Access-Control-Allow-Origin", value: "*"},
                    {key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT"},
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
                    },
                ]
            }
        ]
    }
};

export default withFlowbiteReact(nextConfig);