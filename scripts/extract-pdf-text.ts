
import { PrismaClient } from '@prisma/client';
import { EmailParserService } from '../src/lib/services/EmailParserService';
import * as fs from 'fs';
import pdf from 'pdf-parse';
import { simpleParser } from 'mailparser';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.EMAIL_ADDRESS;
    const password = process.env.EMAIL_APP_PASSWORD;

    if (!email || !password) {
        console.error('❌ Credentials missing');
        process.exit(1);
    }

    const parser: any = new EmailParserService();
    await parser.connect(email, password);

    const mailbox = await parser.client.mailboxOpen('INBOX');
    console.log(`📬 Mailbox Status: ${mailbox.exists} messages`);

    console.log('📡 Fetching all emails...');
    const messages = await parser.client.search({ all: true });

    if (messages && messages.length > 0) {
        console.log(`✅ Found ${messages.length} total messages. Checking latest 20 for Mahesa...`);
        const latestUids = messages.slice(-20);

        for (const uid of latestUids.reverse()) {
            const message = await parser.client.fetchOne(uid, { source: true, envelope: true });
            const from = message.envelope.from[0].address;

            if (from === 'mahesajulioresman25@gmail.com') {
                console.log(`🎯 Found matching email: ${message.envelope.subject}`);
                const parsed = await simpleParser(message.source);

                if (parsed.attachments && parsed.attachments.length > 0) {
                    const attachment = parsed.attachments.find(a => a.contentType === 'application/pdf');
                    if (attachment) {
                        const data = await pdf(attachment.content);
                        console.log('📝 Writing PDF text to grab_report_text.txt...');
                        fs.writeFileSync('grab_report_text.txt', data.text);
                        console.log('✅ Done! Please check grab_report_text.txt');
                        break;
                    }
                }
            }
        }
    } else {
        console.log('❌ No messages found');
    }

    await parser.disconnect();
}

main().catch(console.error);
