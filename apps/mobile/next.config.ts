import type {NextConfig} from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
    /* config options here */
    output: 'export',
    images: {
        unoptimized: true,
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
        ],
    },
    devIndicators: false,
};

export default withFlowbiteReact(nextConfig);