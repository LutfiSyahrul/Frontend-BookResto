import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            // Proxy untuk Gambar (Yang tadi)
            {
                source: "/storage/:path*",
                destination: "http://187.77.112.209:8000/storage/:path*",
            },
            // Proxy BARU untuk API
            {
                source: "/api/:path*",
                destination: "http://187.77.112.209:8000/api/:path*",
            },
        ];
    },
};

export default nextConfig;
