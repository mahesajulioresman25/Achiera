import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { logSystemActivity } from '@/lib/logger';
// pdf-parse will be dynamically imported when needed to avoid build-time issues

type EmailType = 'ORDER' | 'DAILY_SALES' | 'CAMPAIGN_REPORT' | 'REVIEW' | 'INSIGHT' | 'UNKNOWN';

export class EmailParserService {
    private client: ImapFlow | null = null;

    async connect(email: string, appPassword: string) {
        this.client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: email,
                pass: appPassword
            },
            logger: false
        });

        await this.client.connect();
        console.log(`[EmailParser] Connected to ${email}`);
    }

    async disconnect() {
        if (this.client) {
            await this.client.logout();
        }
    }

    async listenForOrders(brandId: string) {
        if (!this.client) throw new Error("Client not connected");

        const lock = await this.client.getMailboxLock('INBOX');
        try {
            const lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - 7); // Look back 7 days to catch missed reports

            const messages = await this.client.search({
                since: lookbackDate,
                seen: false,
                or: [
                    { from: 'noreply@shopee.co.id' },
                    { from: 'noreply@tokopedia.com' },
                    { from: 'info@shopee.co.id' },
                    { from: 'seller@tokopedia.com' },
                    { from: 'report@shopee.co.id' },
                    { from: 'insights@tokopedia.com' },
                    { from: 'mahesajulioresman25@gmail.com' }, // Forwarding email
                    { from: 'noreply@grab.com' },
                    { from: 'no-reply@grabfood.com' }
                ]
            });

            const count = messages ? (Array.isArray(messages) ? messages.length : 0) : 0;

            // Log checking status
            try {
                await logSystemActivity('EMAIL_PARSE', 'INFO', `Checked inbox: ${count} new emails found`, { count }, brandId);
            } catch (e) { }

            if (count === 0) {
                return;
            }

            for (const uid of messages) {
                const message = await this.client.fetchOne(uid, { source: true });
                await this.processEmail(message, brandId);

                // Mark as read
                await this.client.messageFlagsAdd(uid, ['\\Seen']);
            }
        } finally {
            lock.release();
        }
    }

    async processEmail(message: any, brandId: string) {
        const parsed = await simpleParser(message.source);
        const fromAddress = parsed.from?.text || '';
        const subject = parsed.subject || '';
        const html = parsed.html || parsed.text || '';

        const platform = this.detectPlatform(fromAddress, subject, html);
        if (!platform) {
            console.log(`[EmailParser] Skipped: Unknown platform (${fromAddress})`);
            return;
        }

        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Processing email from ${fromAddress}`, { subject, platform }, brandId);
        } catch (e) { }

        const emailType = this.detectEmailType(subject, html);

        switch (emailType) {
            case 'ORDER':
                await this.handleOrderEmail(html, brandId, platform);
                break;
            case 'DAILY_SALES':
                await this.handleDailySalesEmail(html, subject, brandId, platform);
                break;
            case 'CAMPAIGN_REPORT':
                await this.handleCampaignReportEmail(html, subject, brandId, platform);
                break;
            case 'REVIEW':
                await this.handleReviewEmail(html, subject, brandId, platform);
                break;
            case 'INSIGHT':
                await this.handleInsightEmail(html, subject, brandId, platform);
                break;
            default:
                console.log(`[EmailParser] Processing potential attachments for: ${subject}`);
        }

        // Process Attachments regardless of email type detection
        if (parsed.attachments && parsed.attachments.length > 0) {
            for (const attachment of parsed.attachments) {
                await this.handleAttachment(attachment, brandId, platform);
            }
        }
    }

    async handleAttachment(attachment: any, brandId: string, platform: 'SHOPEE' | 'TOKOPEDIA' | 'GRABFOOD') {
        const fileName = attachment.filename || '';
        const contentType = attachment.contentType || '';
        const buffer = attachment.content;

        console.log(`[EmailParser] Parsing attachment: ${fileName} (${contentType})`);

        if (fileName.endsWith('.csv') || contentType === 'text/csv') {
            await this.parseCSVAttachment(buffer.toString(), brandId, platform);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || contentType.includes('excel')) {
            await this.parseExcelAttachment(buffer, brandId, platform);
        } else if (fileName.endsWith('.pdf') || contentType === 'application/pdf') {
            await this.parsePDFAttachment(buffer, brandId, platform);
        }
    }

    async parseCSVAttachment(content: string, brandId: string, platform: string) {
        const lines = content.split('\n');
        console.log(`[EmailParser] CSV parsed with ${lines.length} lines`);

        if (platform === 'GRABFOOD') {
            await this.handleGrabFoodCSVSales(content, brandId);
        }
    }

    async handleGrabFoodCSVSales(csvContent: string, brandId: string) {
        const lines = csvContent.split('\n');
        if (lines.length < 2) return;

        const dataRows = lines.slice(1).filter(l => l.trim().length > 0);

        for (const row of dataRows) {
            const cols = row.split(',');
            // Example mapping (Highly dependent on Grab's current format)
            const reportDate = new Date(cols[1]);
            const revenue = parseFloat(cols[3]) || 0;
            const orders = parseInt(cols[5]) || 0;

            if (isNaN(reportDate.getTime())) continue;

            await prisma.marketplaceDailySales.upsert({
                where: {
                    brandId_platform_reportDate: {
                        brandId,
                        platform: 'GRABFOOD',
                        reportDate
                    }
                },
                create: {
                    brandId,
                    platform: 'GRABFOOD',
                    reportDate,
                    totalOrders: orders,
                    totalRevenue: revenue,
                    totalItems: orders,
                    completedOrders: orders,
                    canceledOrders: 0,
                    returnedOrders: 0,
                    emailSubject: 'GrabFood Attachment Report'
                },
                update: {
                    totalOrders: orders,
                    totalRevenue: revenue,
                    totalItems: orders,
                    completedOrders: orders
                }
            });
        }
        console.log(`[EmailParser] GrabFood sales data processed from CSV`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `GrabFood CSV Sales Parsed`, { brandId }, brandId);
        } catch (e) { }
    }

    async parseExcelAttachment(buffer: Buffer, brandId: string, platform: string) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log(`[EmailParser] Excel parsed with ${data.length} rows`);
        // Map data to MarketplaceDailySales or similar if structure is known
    }

    async parsePDFAttachment(buffer: Buffer, brandId: string, platform: string) {
        try {
            // Dynamically import pdf-parse to avoid build-time file access issues
            const pdf = (await import('pdf-parse')).default;
            const data = await pdf(buffer);
            console.log(`[EmailParser] PDF parsed with ${data.text.length} characters`);

            if (platform === 'GRABFOOD') {
                await this.handleGrabFoodPDFSales(data.text, brandId);
            }
        } catch (err) {
            console.error('[EmailParser] Failed to parse PDF:', err);
        }
    }

} catch (e) {
    console.error(`[EmailParser] DB Error saving GrabFood sales:`, e);
    await logSystemActivity('EMAIL_PARSE', 'ERROR', `DB Error saving GrabFood PDF`, { error: String(e) }, brandId);
}
    }

    async handleGrabFoodPDFSales(text: string, brandId: string) {
    // Debug: Log text sample to debug regex
    // await logSystemActivity('EMAIL_PARSE', 'INFO', `PDF Content Sample`, { text: text.substring(0, 200) }, brandId);

    const dateMatch = text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
    let reportDate = new Date();
    if (dateMatch) {
        const months: any = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };
        reportDate = new Date(parseInt(dateMatch[3]), months[dateMatch[2].toLowerCase()], parseInt(dateMatch[1]));
    } else {
        await logSystemActivity('EMAIL_PARSE', 'ERROR', `Grab PDF Date Regex Failed`, { textSnippet: text.substring(0, 300) }, brandId);
    }

    // Refined regex for Grab PDF summary line
    // IDR[TAB]0,00IDR[TAB]0,000[TAB]pesanan
    const summaryMatch = text.match(/IDR\s*([\d\.,]+)\s*IDR\s*([\d\.,]+)\s*(\d+)\s*pesanan/i);

    let revenue = 0;
    let orders = 0;

    if (summaryMatch) {
        revenue = parseFloat(summaryMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
        orders = parseInt(summaryMatch[3]) || 0;
    } else {
        // Try fallback simpler regex (using [\s\S] instead of . with s flag)
        const revMatch = text.match(/Total\s+Pendapatan[\s\S]*?IDR\s+([\d\.,]+)/i);
        const ordMatch = text.match(/Total\s+Pesanan[\s\S]*?(\d+)\s+pesanan/i);

        if (revMatch) revenue = parseFloat(revMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
        if (ordMatch) orders = parseInt(ordMatch[1]) || 0;

        if (!revMatch && !summaryMatch) {
            await logSystemActivity('EMAIL_PARSE', 'ERROR', `Grab PDF Revenue Regex Failed`, { textSnippet: text.substring(0, 500) }, brandId);
        }
    }

    if (isNaN(reportDate.getTime())) return;

    try {
        const result = await prisma.marketplaceDailySales.upsert({
            where: {
                brandId_platform_reportDate: {
                    brandId,
                    platform: 'GRABFOOD',
                    reportDate
                }
            },
            create: {
                brandId,
                platform: 'GRABFOOD',
                reportDate,
                totalOrders: orders,
                totalRevenue: revenue,
                totalItems: orders,
                completedOrders: orders,
                canceledOrders: 0,
                returnedOrders: 0,
                emailSubject: 'GrabFood PDF Report'
            },
            update: {
                totalOrders: orders,
                totalRevenue: revenue,
                totalItems: orders,
                completedOrders: orders
            }
        });
        console.log(`[EmailParser] GrabFood sales processed from PDF: ${reportDate.toDateString()} - Revenue: ${revenue}`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `GrabFood PDF Sales Parsed`, { date: reportDate, revenue }, brandId);
        } catch (e) { }
    } catch (e) {
        console.error(`[EmailParser] DB Error saving GrabFood sales:`, e);
    }
}

detectPlatform(from: string, subject: string, html: string): 'SHOPEE' | 'TOKOPEDIA' | 'GRABFOOD' | null {
    const lowerFrom = from.toLowerCase();
    const lowerSubject = subject.toLowerCase();
    const lowerHtml = html.toLowerCase();

    // Direct from platform
    if (lowerFrom.includes('shopee')) return 'SHOPEE';
    if (lowerFrom.includes('tokopedia')) return 'TOKOPEDIA';
    if (lowerFrom.includes('grab')) return 'GRABFOOD';

    // Check if forwarded from personal email
    if (lowerFrom.includes('mahesajulioresman25@gmail.com')) {
        if (lowerSubject.includes('shopee') || lowerHtml.includes('shopee')) return 'SHOPEE';
        if (lowerSubject.includes('tokopedia') || lowerHtml.includes('tokopedia')) return 'TOKOPEDIA';
        if (lowerSubject.includes('grab') || lowerHtml.includes('grab')) return 'GRABFOOD';
    }

    return null;
}

detectEmailType(subject: string, html: string): EmailType {
    const subjectLower = subject.toLowerCase();
    const htmlLower = html.toLowerCase();

    if (subjectLower.includes('pesanan baru') || subjectLower.includes('new order') ||
        htmlLower.includes('no. pesanan') || htmlLower.includes('order id')) {
        return 'ORDER';
    }

    if (subjectLower.includes('laporan penjualan') || subjectLower.includes('sales report') ||
        subjectLower.includes('ringkasan harian') || subjectLower.includes('daily summary')) {
        return 'DAILY_SALES';
    }

    if (subjectLower.includes('hasil kampanye') || subjectLower.includes('campaign performance') ||
        subjectLower.includes('flash sale') || subjectLower.includes('promo report')) {
        return 'CAMPAIGN_REPORT';
    }

    if (subjectLower.includes('ulasan baru') || subjectLower.includes('new review') ||
        subjectLower.includes('rating') || htmlLower.includes('bintang')) {
        return 'REVIEW';
    }

    if (subjectLower.includes('tips') || subjectLower.includes('insight') ||
        subjectLower.includes('rekomendasi') || subjectLower.includes('saran')) {
        return 'INSIGHT';
    }

    return 'UNKNOWN';
}

    // ===== ORDER HANDLING =====
    async handleOrderEmail(html: string, brandId: string, platform: string) {
    const orderData = platform === 'SHOPEE'
        ? this.parseShopeeEmail(html)
        : this.parseTokopediaEmail(html);

    if (!orderData.externalOrderId) return;

    const { processAutonomousOrder } = await import('@/lib/intelligence/automationEngine');
    await processAutonomousOrder({
        brandId,
        platform,
        externalOrderId: orderData.externalOrderId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        items: [{
            externalName: orderData.itemName || 'Unknown Item',
            quantity: orderData.quantity || 1,
            price: orderData.grandTotal / (orderData.quantity || 1)
        }],
        grandTotal: orderData.grandTotal
    });

    try {
        await logSystemActivity('EMAIL_PARSE', 'INFO', `Order Processed: ${orderData.externalOrderId}`, { platform, total: orderData.grandTotal }, brandId);
    } catch (e) { }
}

parseShopeeEmail(html: string) {
    const orderIdMatch = html.match(/(?:No\. Pesanan|Order ID)[:\s]+([\w\d]+)/i);
    const nameMatch = html.match(/(?:Nama|Penerima)[:\s]+([^<\n]+)/i);
    const phoneMatch = html.match(/(?:No\. HP|Telepon)[:\s]+([\d\+]+)/i);
    const totalMatch = html.match(/Total(?: Pembayaran)?[:\s]+Rp\s*([\d\.,]+)/i);
    const itemMatch = html.match(/(?:Produk|Nama Produk)[:\s]+([^<\n]+)/i);
    const qtyMatch = html.match(/(?:Jumlah|Qty)[:\s]+(\d+)/i);

    return {
        externalOrderId: orderIdMatch?.[1]?.trim(),
        customerName: nameMatch?.[1]?.trim() || 'Shopee Customer',
        customerPhone: phoneMatch?.[1]?.trim(),
        grandTotal: totalMatch ? parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.')) : 0,
        itemName: itemMatch?.[1]?.trim(),
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1
    };
}

parseTokopediaEmail(html: string) {
    const invoiceMatch = html.match(/(?:INV\/[\w\/]+)/i);
    const nameMatch = html.match(/Penerima[:\s]+([^<\n]+)/i);
    const phoneMatch = html.match(/No\. HP[:\s]+([\d\+]+)/i);
    const totalMatch = html.match(/Total Tagihan[:\s]+Rp\s*([\d\.,]+)/i);
    const itemMatch = html.match(/(?:Produk|Nama Barang)[:\s]+([^<\n]+)/i);
    const qtyMatch = html.match(/(?:Jumlah|Quantity)[:\s]+(\d+)/i);

    return {
        externalOrderId: invoiceMatch?.[0]?.trim(),
        customerName: nameMatch?.[1]?.trim() || 'Tokopedia Customer',
        customerPhone: phoneMatch?.[1]?.trim(),
        grandTotal: totalMatch ? parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.')) : 0,
        itemName: itemMatch?.[1]?.trim(),
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1
    };
}

    async handleDailySalesEmail(html: string, subject: string, brandId: string, platform: string) {
    const salesData = this.parseDailySalesEmail(html, platform);
    if (!salesData.reportDate) return;

    try {
        await prisma.marketplaceDailySales.upsert({
            where: {
                brandId_platform_reportDate: {
                    brandId,
                    platform,
                    reportDate: salesData.reportDate
                }
            },
            create: {
                brandId,
                platform,
                ...salesData,
                emailSubject: subject
            },
            update: {
                ...salesData,
                emailSubject: subject
            }
        });
        console.log(`[EmailParser] Daily sales saved for ${platform} on ${salesData.reportDate}`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Daily Sales Saved: ${platform}`, { date: salesData.reportDate, revenue: salesData.totalRevenue }, brandId);
        } catch (e) { }
    } catch (error) {
        console.error('[EmailParser] Failed to save daily sales:', error);
    }
}

parseDailySalesEmail(html: string, platform: string) {
    const dateMatch = html.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
    let reportDate = new Date();
    if (dateMatch) {
        const months: any = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };
        reportDate = new Date(parseInt(dateMatch[3]), months[dateMatch[2].toLowerCase()], parseInt(dateMatch[1]));
    }

    const ordersMatch = html.match(/(?:Total Pesanan|Jumlah Order)[:\s]+(\d+)/i);
    const revenueMatch = html.match(/(?:Total Pendapatan|Revenue)[:\s]+Rp\s*([\d\.,]+)/i);
    const itemsMatch = html.match(/(?:Total Item|Barang Terjual)[:\s]+(\d+)/i);
    const completedMatch = html.match(/(?:Selesai|Completed)[:\s]+(\d+)/i);
    const canceledMatch = html.match(/(?:Dibatalkan|Canceled)[:\s]+(\d+)/i);

    return {
        reportDate,
        totalOrders: ordersMatch ? parseInt(ordersMatch[1]) : 0,
        totalRevenue: revenueMatch ? parseFloat(revenueMatch[1].replace(/\./g, '').replace(',', '.')) : 0,
        totalItems: itemsMatch ? parseInt(itemsMatch[1]) : 0,
        completedOrders: completedMatch ? parseInt(completedMatch[1]) : 0,
        canceledOrders: canceledMatch ? parseInt(canceledMatch[1]) : 0,
        returnedOrders: 0,
        rawData: { html }
    };
}

    async handleCampaignReportEmail(html: string, subject: string, brandId: string, platform: string) {
    const campaignData = this.parseCampaignReportEmail(html, subject);
    if (!campaignData.campaignName) return;

    try {
        await prisma.marketplaceCampaignReport.create({
            data: {
                brandId,
                platform,
                ...campaignData,
                emailSubject: subject
            }
        });
        console.log(`[EmailParser] Campaign report saved: ${campaignData.campaignName}`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Campaign Report Saved`, { name: campaignData.campaignName, revenue: campaignData.totalRevenue }, brandId);
        } catch (e) { }
    } catch (error) {
        console.error('[EmailParser] Failed to save campaign report:', error);
    }
}

parseCampaignReportEmail(html: string, subject: string) {
    const campaignNameMatch = subject.match(/(?:Kampanye|Campaign)[:"]\s*([^"\n]+)/i) ||
        html.match(/(?:Nama Kampanye|Campaign Name)[:\s]+([^<\n]+)/i);

    const viewsMatch = html.match(/(?:Views|Dilihat)[:\s]+(\d+)/i);
    const clicksMatch = html.match(/(?:Clicks|Klik)[:\s]+(\d+)/i);
    const ordersMatch = html.match(/(?:Orders|Pesanan)[:\s]+(\d+)/i);
    const revenueMatch = html.match(/(?:Revenue|Pendapatan)[:\s]+Rp\s*([\d\.,]+)/i);

    return {
        campaignName: campaignNameMatch?.[1]?.trim() || 'Unknown Campaign',
        campaignType: 'FLASH_SALE',
        startDate: new Date(),
        endDate: new Date(),
        totalViews: viewsMatch ? parseInt(viewsMatch[1]) : 0,
        totalClicks: clicksMatch ? parseInt(clicksMatch[1]) : 0,
        totalOrders: ordersMatch ? parseInt(ordersMatch[1]) : 0,
        totalRevenue: revenueMatch ? parseFloat(revenueMatch[1].replace(/\./g, '').replace(',', '.')) : 0,
        rawData: { html }
    };
}

    async handleReviewEmail(html: string, subject: string, brandId: string, platform: string) {
    const reviewData = this.parseReviewEmail(html);
    if (!reviewData.productName) return;

    try {
        await prisma.customerReview.create({
            data: {
                brandId,
                platform,
                ...reviewData
            }
        });
        console.log(`[EmailParser] Review saved: ${reviewData.rating}⭐ for ${reviewData.productName}`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Review Saved: ${reviewData.rating}⭐`, { product: reviewData.productName }, brandId);
        } catch (e) { }
    } catch (error) {
        console.error('[EmailParser] Failed to save review:', error);
    }
}

parseReviewEmail(html: string) {
    const productMatch = html.match(/(?:Produk|Product)[:\s]+([^<\n]+)/i);
    const ratingMatch = html.match(/(\d)\s*(?:bintang|star)/i);
    const reviewMatch = html.match(/(?:Ulasan|Review)[:\s]+([^<]+)/i);
    const customerMatch = html.match(/(?:Dari|From)[:\s]+([^<\n]+)/i);

    return {
        productName: productMatch?.[1]?.trim() || 'Unknown Product',
        rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
        reviewText: reviewMatch?.[1]?.trim(),
        customerName: customerMatch?.[1]?.trim(),
        reviewDate: new Date()
    };
}

    async handleInsightEmail(html: string, subject: string, brandId: string, platform: string) {
    const insightData = this.parseInsightEmail(html, subject);

    try {
        await prisma.marketplaceInsight.create({
            data: {
                brandId,
                platform,
                ...insightData
            }
        });
        console.log(`[EmailParser] Insight saved: ${insightData.title}`);
        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Insight Saved`, { title: insightData.title }, brandId);
        } catch (e) { }
    } catch (error) {
        console.error('[EmailParser] Failed to save insight:', error);
    }
}

parseInsightEmail(html: string, subject: string) {
    const title = subject.replace(/^(Re:|Fwd:)/i, '').trim();
    const description = html.replace(/<[^>]*>/g, '').substring(0, 500);

    return {
        insightType: 'PERFORMANCE_TIP',
        title,
        description,
        actionable: html.toLowerCase().includes('action') || html.toLowerCase().includes('lakukan'),
        priority: 'MEDIUM',
        metadata: { html }
    };
}
}
