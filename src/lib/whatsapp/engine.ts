import { EventEmitter } from 'events';

const ENGINE_VERSION = '2.0-EXTERNAL-ROUTED';
const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001';

class WhatsAppEngine extends EventEmitter {
    private state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR' = 'DISCONNECTED';
    private qr: string | null = null;

    constructor() {
        super();
        this.startSync();
    }

    // Periodically sync status from the external service
    private async startSync() {
        setInterval(async () => {
            try {
                const res = await fetch(`${WA_SERVICE_URL}/status`);
                const data = await res.json();
                this.state = data.state;
                this.qr = data.qr;

                if (this.state === 'CONNECTED') {
                    this.emit('connected');
                } else if (this.state === 'QR' && this.qr) {
                    this.emit('qr', this.qr);
                }
            } catch (e) {
                this.state = 'DISCONNECTED';
            }
        }, 5000);
    }

    async init() {
        console.log(`[WA Engine Client] Initialized ${ENGINE_VERSION}.`);
    }

    getStatus() {
        return {
            state: this.state,
            qr: this.qr
        };
    }

    async sendMessage(phone: string, text: string, priority?: number) {
        try {
            const res = await fetch(`${WA_SERVICE_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, text, priority })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to send message via service');
            }

            return true;
        } catch (error: any) {
            console.error('[WA Engine Client] Send Error:', error.message);
            throw error;
        }
    }

    async sendDocument(phone: string, document: Buffer, fileName: string, caption?: string, priority?: number) {
        try {
            const formData = new FormData();
            formData.append('phone', phone);
            formData.append('filename', fileName);
            if (caption) formData.append('caption', caption);
            formData.append('type', 'document');
            if (priority) formData.append('priority', priority.toString());

            // Create a blob from the buffer
            const blob = new Blob([new Uint8Array(document)], { type: 'application/pdf' });
            formData.append('file', blob, fileName);

            const res = await fetch(`${WA_SERVICE_URL}/send-media`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Server responded with ${res.status}`);
            }

            return true;
        } catch (error: any) {
            console.error('[WA Engine Client] Send Document Error:', error.message);
            // Fallback to text if media fails
            return this.sendMessage(phone, `${caption}\n(File: ${fileName})\n*[ERROR: ${error.message}]*`, priority);
        }
    }

    async sendImage(phone: string, image: Buffer, caption?: string, priority?: number) {
        try {
            const formData = new FormData();
            formData.append('phone', phone);
            if (caption) formData.append('caption', caption);
            formData.append('type', 'image');
            if (priority) formData.append('priority', priority.toString());

            const blob = new Blob([new Uint8Array(image)], { type: 'image/jpeg' });
            formData.append('file', blob, 'image.jpg');

            const res = await fetch(`${WA_SERVICE_URL}/send-media`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Server responded with ${res.status}`);
            }

            return true;
        } catch (error: any) {
            console.error('[WA Engine Client] Send Image Error:', error.message);
            throw error;
        }
    }

    async logout() {
        console.warn('[WA Engine Client] Logout should be handled at the Service level.');
    }
}

// Global singleton
const GLOBAL_KEY = '__WA_ENGINE_INSTANCE_V2__';
const globalStore = global as any;

if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = new WhatsAppEngine();

    // Start background queue processor
    import('../whatsapp/processor').then(({ WhatsAppProcessor }) => {
        WhatsAppProcessor.start();
    }).catch(err => console.error('[WhatsAppEngine] Failed to start processor:', err));
}

export const waEngine = globalStore[GLOBAL_KEY] as WhatsAppEngine;
export default waEngine;
