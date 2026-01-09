
// src/lib/qrcode.ts
import QRCode from 'qrcode';

/**
 * Generates a QR Code Data URL (PNG)
 * @param text The text/URL to encode
 * @returns Promise<string> Base64 Data URL
 */
export async function generateQRCode(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        return '';
    }
}
