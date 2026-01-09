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
    async redirects() {
        return [
            {
                source: '/',
                destination: '/rasa-ibu',
                permanent: true,
            },
        ]
    },
};

export default nextConfig;
