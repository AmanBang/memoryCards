/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Needed for Firebase auth
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        fs: false,
        tls: false,
        child_process: false,
        perf_hooks: false,
        async_hooks: false,
        'fs/promises': false
      };
    }
    return config;
  }
};

export default nextConfig; 