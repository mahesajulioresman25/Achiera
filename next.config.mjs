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
    },
};

export default nextConfig;
