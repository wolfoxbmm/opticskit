import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/tools/lens',
        destination: '/tools/camera-lens',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
