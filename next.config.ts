import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.domain-backend-bosku.com", // Ganti dengan domain backend yang sebenarnya
            },
            {
                protocol: "http",
                hostname: "127.0.0.1", // local host
            },
        ],
    },
};

export default nextConfig;
