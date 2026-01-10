import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rasaibu.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/auth/',
                '/admin/',
                '/_next/',
                '/static/'
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
