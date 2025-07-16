import type {NextConfig} from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [new URL("https://media.tenor.com/**"), new URL("https://cdn.discordapp.com/**")]
    },
    devIndicators: false,
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