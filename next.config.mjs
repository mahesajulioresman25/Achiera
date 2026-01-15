/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: ['imapflow', 'pino'],
    distDir: '.next',
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb', // Allow uploads up to 20MB
        },
    },
};

export default nextConfig;
