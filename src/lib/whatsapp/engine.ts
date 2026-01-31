import { EventEmitter } from 'events';

const ENGINE_VERSION = '2.0-EXTERNAL-ROUTED';
const WA_SERVICE_URL = (process.env.WA_SERVICE_URL || 'http://localhost:3001').replace(/\/$/, '');

class WhatsAppEngine extends EventEmitter {
    private state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR' = 'DISCONNECTED';
    private qr: string | null = null;

    constructor() {
        super();
        this.startSync();
    }

    // Periodically sync status from the external service
    private async startSync() {
        console.log(`[WA Engine Client] Starting sync with ${WA_SERVICE_URL}`);
        setInterval(async () => {
            try {
                const res = await fetch(`${WA_SERVICE_URL}/status`);
                if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
                const data = await res.json();
                this.state = data.state;
                this.qr = data.qr;

                if (this.state === 'CONNECTED') {
                    this.emit('connected');
                } else if (this.state === 'QR' && this.qr) {
                    this.emit('qr', this.qr);
                }
            } catch (e: any) {
                console.error(`[WA Engine Client] Sync Error (${WA_SERVICE_URL}):`, e.message);
                this.state = 'DISCONNECTED';
            }
        }, 5000);
    }

    async init() {
        console.log(`[WA Engine Client] Initialized ${ENGINE_VERSION}. Target: ${WA_SERVICE_URL}`);
    }

    getStatus() {
        return {
            state: this.state,
            qr: this.qr
        };
    }

    /**
     * Send message via Local Engine or QuikWA SaaS
     */
    async sendMessage(phone: string, text: string, priority?: number, saasConfig?: { token: string; deviceId: string }) {
        if (saasConfig?.token && saasConfig?.deviceId) {
            return this.sendViaQuikWA(phone, text, saasConfig);
        }

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

    /**
     * Driver for QuikWA SaaS API
     */
    private async sendViaQuikWA(phone: string, message: string, config: { token: string; deviceId: string }) {
        try {
            console.log(`[WA Engine] Sending via QuikWA SaaS for device ${config.deviceId}...`);
            const res = await fetch('https://quikwa.com/api/v1/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: config.token,
                    device_id: config.deviceId,
                    phone: phone,
                    message: message
                })
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Unknown Error' }));
                throw new Error(error.error || `QuikWA API responded with ${res.status}`);
            }

            return true;
        } catch (error: any) {
            console.error('[WA Engine Client] QuikWA Error:', error.message);
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
