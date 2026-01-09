/**
 * Email Alert Service for Compliance Violations & Intelligence Leads
 * Sends email notifications for critical events
 */

import nodemailer from 'nodemailer';

export interface EmailAlert {
    to: string[];
    subject: string;
    body: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export class EmailAlertService {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    private getFromAddress() {
        const rawName = process.env.SMTP_FROM_NAME || 'Achiera Platform';
        const cleanName = rawName.replace(/>/g, '').trim();
        const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
        return `"${cleanName}" <${fromEmail}>`;
    }

    /**
     * Send email using configured provider
     */
    private async sendEmail(alert: EmailAlert): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.getFromAddress(),
                to: alert.to.join(', '),
                subject: alert.subject,
                html: alert.body,
                priority: alert.priority === 'URGENT' ? 'high' : alert.priority === 'HIGH' ? 'high' : 'normal'
            } as any);
            console.log(`[Email Alert] Sent: ${alert.subject} to ${alert.to.join(', ')}`);
        } catch (error) {
            console.error('[Email Alert] Send Error:', error);
            throw error;
        }
    }

    /**
     * Send contact lead notification
     */
    async sendContactLead(data: {
        name: string;
        phone: string;
        email: string;
        message: string;
        targetEmail: string;
        brandName: string;
    }): Promise<void> {
        const body = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; border: 1px solid #E5E1D8; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 40px; text-align: center; }
        .content { padding: 40px; background: #ffffff; }
        .field { margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #F3F1ED; }
        .label { font-weight: 900; color: #8B7E66; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        .value { font-size: 16px; color: #2D3A2D; font-weight: 500; }
        .message-box { background: #F9F7F2; padding: 24px; border-radius: 16px; border: 1px dashed #D1CBBF; font-style: italic; color: #4A5D4A; margin-top: 20px; }
        .footer { background: #F9F7F2; padding: 30px; text-align: center; color: #8B7E66; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span style="text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; color: #B2BC9D; display: block; margin-bottom: 8px;">Pesan Tulus Diterima</span>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">📩 Lead Baru: ${data.brandName}</h1>
        </div>
        <div class="content">
            <div class="field">
                <span class="label">Nama Pengirim</span>
                <div class="value">${data.name}</div>
            </div>
            <div class="field">
                <span class="label">WhatsApp / Telepon</span>
                <div class="value">${data.phone}</div>
            </div>
            <div class="field">
                <span class="label">Email</span>
                <div class="value">${data.email}</div>
            </div>
            <div class="label" style="margin-top: 32px;">Pesan Lengkap</div>
            <div class="message-box">
                "${data.message}"
            </div>
            
            <p style="font-size: 13px; color: #8B7E66; margin-top: 40px; text-align: center;">
                Sinyal ini dikirim otomatis oleh Achiera Intelligence Hub.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 Rasa Ibu - Achiera. Semua Hak Dilindungi.<br>Intelligence Division</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        await this.sendEmail({
            to: [data.targetEmail],
            subject: `[Lead Baru] ${data.name} - ${data.brandName}`,
            body: body,
            priority: 'HIGH'
        });
    }

    /**
     * Send compliance violation alert
     */
    async sendComplianceAlert(violation: {
        id: string;
        ruleName: string;
        severity: string;
        brandName: string;
        description: string;
        detectedAt: Date;
    }): Promise<void> {
        const recipients = this.getRecipients(violation.severity);

        const alert: EmailAlert = {
            to: recipients,
            subject: `🚨 ${violation.severity} Compliance Violation: ${violation.ruleName}`,
            body: this.buildComplianceEmailBody(violation),
            priority: violation.severity === 'CRITICAL' ? 'URGENT' : 'HIGH'
        };

        await this.sendEmail(alert);
    }

    /**
     * Send anomaly detection alert
     */
    async sendAnomalyAlert(anomaly: {
        type: string;
        description: string;
        userId: string;
        userName: string;
        timestamp: Date;
        severity: string;
    }): Promise<void> {
        const recipients = this.getRecipients('SECURITY');

        const alert: EmailAlert = {
            to: recipients,
            subject: `⚠️ Security Anomaly Detected: ${anomaly.type}`,
            body: this.buildAnomalyEmailBody(anomaly),
            priority: 'URGENT'
        };

        await this.sendEmail(alert);
    }

    private buildComplianceEmailBody(violation: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
        .critical { background: #fecaca; color: #991b1b; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚨 Compliance Violation Alert</h1>
        </div>
        <div class="content">
            <p><strong>Severity:</strong> <span class="badge ${violation.severity.toLowerCase()}">${violation.severity}</span></p>
            <p><strong>Rule:</strong> ${violation.ruleName}</p>
            <p><strong>Brand:</strong> ${violation.brandName}</p>
            <p><strong>Description:</strong> ${violation.description}</p>
            <p><strong>Detected At:</strong> ${new Date(violation.detectedAt).toLocaleString()}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/audit-compliance?violation=${violation.id}" class="button">View Details</a>
        </div>
    </div>
</body>
</html>`.trim();
    }

    private buildAnomalyEmailBody(anomaly: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">⚠️ Security Anomaly Detected</h1>
        </div>
        <div class="content">
            <p><strong>Type:</strong> ${anomaly.type}</p>
            <p><strong>User:</strong> ${anomaly.userName}</p>
            <p><strong>Description:</strong> ${anomaly.description}</p>
            <p><strong>Timestamp:</strong> ${new Date(anomaly.timestamp).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`.trim();
    }

    private getRecipients(severity: string): string[] {
        const recipients: Record<string, string[]> = {
            CRITICAL: [process.env.OWNER_EMAIL || 'owner@achiera.com'],
            HIGH: [process.env.OWNER_EMAIL || 'owner@achiera.com'],
            MEDIUM: [process.env.OWNER_EMAIL || 'owner@achiera.com'],
            SECURITY: [process.env.SECURITY_EMAIL || 'security@achiera.com']
        };
        return recipients[severity] || recipients.MEDIUM;
    }

    async testEmail(recipient: string): Promise<boolean> {
        try {
            await this.sendEmail({
                to: [recipient],
                subject: '✅ Achiera Email Alert Test',
                body: '<h1>Test Successful</h1><p>Email alerts are working.</p>',
                priority: 'NORMAL'
            });
            return true;
        } catch (error) {
            console.error('[Email Alert] Test failed:', error);
            return false;
        }
    }
}

export const emailAlertService = new EmailAlertService();
