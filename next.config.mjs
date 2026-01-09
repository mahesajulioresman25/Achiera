/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    serverExternalPackages: ['imapflow', 'pino'],
    experimental: {
    },
};

export default nextConfig;
