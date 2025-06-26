import type {NextConfig} from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [new URL("https://media.tenor.com/**")]
    },
    devIndicators: false,
    allowedDevOrigins: ["20.199.66.229:3000", "20.199.66.229"]
};

export default withFlowbiteReact(nextConfig);