import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

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
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'achiera.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            }
        ],
    },
};

export default (phase) => {
    if (phase === PHASE_PRODUCTION_BUILD) {
        process.env.IS_BUILD = 'true';
    }
    return nextConfig;
};
