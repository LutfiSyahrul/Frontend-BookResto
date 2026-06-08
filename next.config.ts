import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Tambahkan baris rewrites ini
    async rewrites() {
        return [
            {
                // Setiap kali web meminta jalur /storage/apa-saja...
                source: "/storage/:path*",
                // ...Vercel akan mengambilkannya diam-diam dari IP VPS bosku
                destination: "http://187.77.112.209:8000/storage/:path*",
            },
        ];
    },
};

export default nextConfig;
