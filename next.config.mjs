/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: ['imapflow', 'pino'],
    experimental: {
    },
};

export default nextConfig;
