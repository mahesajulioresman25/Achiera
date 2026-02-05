
import { EmailParserService } from './src/lib/services/EmailParserService';
import { prisma } from './src/lib/prisma';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
dotenv.config();

// Override logSystemActivity to just print to console for debugging
const originalProcessEmail = EmailParserService.prototype.processEmail;

async function debugRun() {
    console.log("Starting Debug Reprocess...");
    const brands = await prisma.brand.findMany({ where: { isActive: true } });
    const brandId = brands[0]?.id;

    const email = process.env.EMAIL_ADDRESS;
    const password = process.env.EMAIL_APP_PASSWORD;

    const parser = new EmailParserService();
    await parser.connect(email!, password!);
    const client = (parser as any).client;

    const lock = await client.getMailboxLock('INBOX');
    try {
        console.log("Searching for specific email...");
        // Search for the specific subject from the screenshot
        const messages = await client.search({
            subject: '31 Januari 2026',
            or: [
                { from: 'mahesajulioresman25@gmail.com' }
            ]
        });

        console.log(`Found ${messages.length} matching emails.`);

        for (const uid of messages) {
            console.log(`\n--- Inspecting Email (UID: ${uid}) ---`);
            const message = await client.fetchOne(uid, { source: true });
            const parsed = await simpleParser(message.source);

            console.log(`Subject: ${parsed.subject}`);
            console.log(`From: ${parsed.from?.text}`);
            console.log(`Attachments: ${parsed.attachments?.length || 0}`);

            // 1. Test HTML Regex
            const html = parsed.html || parsed.text || '';
            console.log(`HTML Length: ${html.length}`);

            // Regex Test
            const dateMatch = html.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
            console.log(`HTML Date Match: ${dateMatch ? dateMatch[0] : 'NULL'}`);

            // 2. Test PDF
            if (parsed.attachments && parsed.attachments.length > 0) {
                for (const att of parsed.attachments) {
                    console.log(`Attachment: ${att.filename} (${att.contentType})`);
                    if (att.filename?.includes('.pdf')) {
                        console.log("Parsing PDF content...");
                        const pdf = (await import('pdf-parse')).default;
                        const data = await pdf(att.content);
                        console.log(`PDF Text Length: ${data.text.length}`);
                        console.log(`PDF Text Preview: ${data.text.substring(0, 200).replace(/\n/g, ' ')}...`);

                        // Test Date Regex on PDF
                        const pdfDateMatch = data.text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
                        console.log(`PDF Date Match: ${pdfDateMatch ? pdfDateMatch[0] : 'NULL'}`);

                        // Test Revenue Regex on PDF
                        // Regex 1
                        const summaryMatch = data.text.match(/IDR\s*([\d\.,]+)\s*IDR\s*([\d\.,]+)\s*(\d+)\s*pesanan/i);
                        console.log(`PDF Summary Match 1: ${summaryMatch ? summaryMatch[0] : 'NULL'}`);

                        // Regex 2 (Fallback)
                        const revMatch = data.text.match(/Total\s+Pendapatan[\s\S]*?IDR\s+([\d\.,]+)/i);
                        console.log(`PDF Revenue Match 2: ${revMatch ? revMatch[1] : 'NULL'}`);
                    }
                }
            }
        }

    } catch (e) {
        console.error("Debug Error:", e);
    } finally {
        lock.release();
        await parser.disconnect();
        await prisma.$disconnect();
    }
}

debugRun();
