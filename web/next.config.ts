import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    transpilePackages: ["@db"],
    images: {
        domains: ['i.ebayimg.com'],
    }
};

export default nextConfig;
