import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { logSystemActivity } from '@/lib/logger';
// pdf-parse will be dynamically imported when needed to avoid build-time issues

type EmailType = 'ORDER' | 'DAILY_SALES' | 'CAMPAIGN_REPORT' | 'REVIEW' | 'INSIGHT' | 'SETTLEMENT' | 'UNKNOWN';

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

    async syncEmails(brandIds: string[]) {
        if (!this.client) throw new Error("Client not connected");

        const lock = await this.client.getMailboxLock('INBOX');
        try {
            const lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - 7); // Look back 7 days to catch missed reports

            // Search for UNSEEN messages
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

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                console.log(`[EmailParser] No new messages found.`);
                return;
            }

            console.log(`[EmailParser] Found ${messages.length} new messages. Processing for brands: ${brandIds.join(', ')}`);

            for (const uid of messages) {
                const message = await this.client.fetchOne(uid as number, { source: true });
                await this.processEmail(message, brandIds);

                // Mark as read ONLY after processing for all brands
                await this.client.messageFlagsAdd(uid as number, ['\\Seen']);
            }
        } finally {
            lock.release();
        }
    }

    async processEmail(message: any, brandIds: string[]) {
        const parsed = await simpleParser(message.source);
        const fromAddress = parsed.from?.text || '';
        const subject = parsed.subject || '';
        const html = (parsed.html || parsed.text || '').toString();

        // Detect Brand
        const detectedBrandId = await this.detectBrandId(subject, html, brandIds);

        // If a brand is explicitly detected, process only for that brand
        if (detectedBrandId) {
            await this.processEmailForBrand(parsed, detectedBrandId);
        } else {
            // Fallback: If no specific brand detected, we might need to process for ALL brands 
            // if it's a generic email, OR skip if it's definitely brand-specific but unknown.
            // For now, if it's not detected, we log a warning and skip to avoid misattribution.
            console.log(`[EmailParser] Brand not detected for subject: ${subject}. Skipping.`);
            try {
                await logSystemActivity('EMAIL_PARSE', 'WARN', `Brand not detected for email`, { from: fromAddress, subject }, brandIds[0]);
            } catch (e) { }
        }
    }

    private async processEmailForBrand(parsed: any, brandId: string) {
        const fromAddress = parsed.from?.text || '';
        const subject = parsed.subject || '';
        const html = (parsed.html || parsed.text || '').toString();

        const platform = this.detectPlatform(fromAddress, subject, html);
        if (!platform) {
            console.log(`[EmailParser] Skipped for Brand ${brandId}: Unknown platform (${fromAddress})`);
            return;
        }

        try {
            await logSystemActivity('EMAIL_PARSE', 'INFO', `Processing email for Brand: ${brandId}`, { from: fromAddress, subject, platform }, brandId);
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
            case 'SETTLEMENT':
                await this.handleSettlementEmail(html, subject, brandId, platform);
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

    async detectBrandId(subject: string, html: string, restrictedBrandIds?: string[]): Promise<string | null> {
        // Fetch brands with their platform links for better detection
        const brands = await prisma.brand.findMany({
            where: restrictedBrandIds ? { id: { in: restrictedBrandIds } } : {},
            select: {
                id: true,
                name: true,
                slug: true,
                brandConfig: {
                    select: { platformLinks: true }
                }
            }
        });

        const content = (subject + ' ' + html).toLowerCase();

        for (const brand of brands) {
            const brandName = brand.name.toLowerCase();
            const brandSlug = brand.slug.toLowerCase();

            // 1. Check for specific Platform Links / Merchant IDs if configured
            const platformLinks = brand.brandConfig?.platformLinks as any;
            if (platformLinks) {
                for (const [platform, link] of Object.entries(platformLinks)) {
                    if (link && typeof link === 'string' && content.includes(link.toLowerCase())) {
                        console.log(`[EmailParser] Brand detected via platform link (${platform}): ${brand.id}`);
                        return brand.id;
                    }
                }
            }

            // 2. Check for brand name or slug
            if (content.includes(brandSlug) || content.includes(brandName)) {
                return brand.id;
            }
        }

        return null;
    }

    private extractDate(text: string): string | null {
        if (!text) return null;

        // Support various Indonesian and English formats
        const indonesianMonths: any = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };
        const englishMonths: any = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
        };

        const cleanText = text.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

        const formatDate = (y: number, m: number, d: number) => {
            return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        };

        // DD Month YYYY (Indonesian or Full English)
        const longMatch = cleanText.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
        if (longMatch) {
            const day = parseInt(longMatch[1]);
            const monthStr = longMatch[2].toLowerCase();
            const year = parseInt(longMatch[3]);

            const m = indonesianMonths[monthStr] ?? englishMonths[monthStr];
            if (m !== undefined) return formatDate(year, m, day);
        }

        // Month D YYYY (English)
        const altMatch = cleanText.match(/([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})/);
        if (altMatch) {
            const monthStr = altMatch[1].toLowerCase();
            const day = parseInt(altMatch[2]);
            const year = parseInt(altMatch[3]);

            const m = englishMonths[monthStr] ?? indonesianMonths[monthStr];
            if (m !== undefined) return formatDate(year, m, day);
        }

        // YYYY-MM-DD
        const isoMatch = cleanText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) {
            return formatDate(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
        }

        // DD/MM/YYYY
        const slashMatch = cleanText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (slashMatch) {
            return formatDate(parseInt(slashMatch[3]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
        }

        return null;
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
        } else if (platform === 'SHOPEE') {
            await this.handleShopeeCSVSales(content, brandId);
        } else if (platform === 'TOKOPEDIA') {
            await this.handleTokopediaCSVSales(content, brandId);
        }
    }

    async handleShopeeCSVSales(csvContent: string, brandId: string) {
        const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const headers = lines[0].toLowerCase();
        const dataRows = lines.slice(1);

        // Shopee Dynamic Column Detection
        // Common headers: "Tanggal", "Total Pesanan", "Total Penjualan", "Pesanan", "Pendapatan"
        let dateIdx = -1, revenueIdx = -1, ordersIdx = -1;
        const cols = lines[0].split(/[,;]/);
        cols.forEach((h, i) => {
            const head = h.trim().toLowerCase();
            if (head.includes('tanggal') || head.includes('date')) dateIdx = i;
            if (head.includes('penjualan') || head.includes('revenue') || head.includes('pendapatan')) revenueIdx = i;
            if (head.includes('pesanan') || head.includes('orders')) ordersIdx = i;
        });

        if (dateIdx === -1) {
            console.log('[EmailParser] Shopee CSV: Date column not found');
            return;
        }

        for (const row of dataRows) {
            const rowCols = row.split(/[,;]/);
            const dateStr = this.extractDate(rowCols[dateIdx]);
            if (!dateStr) continue;

            const reportDate = new Date(dateStr);
            const revenue = revenueIdx !== -1 ? parseFloat(rowCols[revenueIdx].replace(/[^\d\.]/g, '')) || 0 : 0;
            const orders = ordersIdx !== -1 ? parseInt(rowCols[ordersIdx]) || 0 : 0;

            await this.upsertDailySales(brandId, 'SHOPEE', reportDate, revenue, orders);
        }
    }

    async handleTokopediaCSVSales(csvContent: string, brandId: string) {
        const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const dataRows = lines.slice(1);
        let dateIdx = -1, revenueIdx = -1, ordersIdx = -1;
        const cols = lines[0].split(/[,;]/);

        cols.forEach((h, i) => {
            const head = h.trim().toLowerCase();
            if (head.includes('tanggal') || head.includes('date')) dateIdx = i;
            if (head.includes('harga') || head.includes('total') || head.includes('revenue')) revenueIdx = i;
            if (head.includes('jumlah') || head.includes('orders')) ordersIdx = i;
        });

        for (const row of dataRows) {
            const rowCols = row.split(/[,;]/);
            const dateStr = this.extractDate(rowCols[dateIdx]);
            if (!dateStr) continue;

            const reportDate = new Date(dateStr);
            const revenue = revenueIdx !== -1 ? parseFloat(rowCols[revenueIdx].replace(/[^\d\.]/g, '')) || 0 : 0;
            const orders = ordersIdx !== -1 ? parseInt(rowCols[ordersIdx]) || 0 : 0;

            await this.upsertDailySales(brandId, 'TOKOPEDIA', reportDate, revenue, orders);
        }
    }

    private async upsertDailySales(brandId: string, platform: string, reportDate: Date, revenue: number, orders: number) {
        await prisma.marketplaceDailySales.upsert({
            where: {
                brandId_platform_reportDate: {
                    brandId,
                    platform,
                    reportDate
                }
            },
            create: {
                brandId,
                platform,
                reportDate,
                totalOrders: orders,
                totalRevenue: revenue,
                totalItems: orders,
                completedOrders: orders,
                canceledOrders: 0,
                returnedOrders: 0,
                emailSubject: `${platform} Attachment Report`
            },
            update: {
                totalOrders: orders,
                totalRevenue: revenue,
                totalItems: orders,
                completedOrders: orders
            }
        });
    }

    async handleGrabFoodCSVSales(csvContent: string, brandId: string) {
        const lines = csvContent.split('\n');
        if (lines.length < 2) return;

        const dataRows = lines.slice(1).filter(l => l.trim().length > 0);

        for (const row of dataRows) {
            const cols = row.split(',');
            const dateStr = this.extractDate(cols[1]);
            if (!dateStr) continue;

            const reportDate = new Date(dateStr);
            const revenue = parseFloat(cols[3]) || 0;
            const orders = parseInt(cols[5]) || 0;

            await this.upsertDailySales(brandId, 'GRABFOOD', reportDate, revenue, orders);
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

    async handleGrabFoodPDFSales(text: string, brandId: string) {
        const dateStr = this.extractDate(text);
        if (!dateStr) {
            await logSystemActivity('EMAIL_PARSE', 'WARN', `Grab PDF Date Extraction Failed`, { textSnippet: text.substring(0, 300) }, brandId);
            return;
        }
        const reportDate = new Date(dateStr);

        let revenue = 0;
        let orders = 0;

        // Pattern 1: Table header/summary line
        // IDR[TAB]0,00IDR[TAB]0,000[TAB]pesanan
        const summaryMatch = text.match(/IDR\s*([\d\.,]+)\s*IDR\s*([\d\.,]+)\s*(\d+)\s*pesanan/i);

        if (summaryMatch) {
            revenue = parseFloat(summaryMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
            orders = parseInt(summaryMatch[3]) || 0;
            console.log(`[EmailParser] Match 1: Rev=${revenue}, Ord=${orders}`);
        }

        // Pattern 2: Explicit Labels
        if (revenue === 0) {
            const revMatch = text.match(/(?:Total\s+Pendapatan|Revenue|Total\s+Earnings)[\s\S]{0,150}?IDR\s*([\d\.,]+)/i);
            if (revMatch) {
                revenue = parseFloat(revMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
                console.log(`[EmailParser] Match 2 (Revenue): ${revenue}`);
            }
        }

        if (orders === 0) {
            const ordMatch = text.match(/(?:Total\s+Pesanan|Total\s+Orders)[\s\S]{0,150}?(\d+)\s*(?:pesanan|orders|order)/i);
            if (ordMatch) {
                orders = parseInt(ordMatch[1]) || 0;
                console.log(`[EmailParser] Match 2 (Orders): ${orders}`);
            }
        }

        // Final Fallback for Orders: just look for digits followed by 'pesanan'
        if (orders === 0) {
            const ordMatchRaw = text.match(/(\d+)\s+(?:pesanan|orders|order)/i);
            if (ordMatchRaw) {
                orders = parseInt(ordMatchRaw[1]) || 0;
                console.log(`[EmailParser] Match 3 (Orders): ${orders}`);
            }
        }

        // Final Fallback for Revenue: Look for any IDR
        if (revenue === 0) {
            const idrMatches = text.match(/IDR\s*([\d\.,]+)/gi);
            if (idrMatches && idrMatches.length > 0) {
                let bestRev = 0;
                for (const m of idrMatches) {
                    const val = parseFloat(m.replace(/IDR/i, '').trim().replace(/\./g, '').replace(',', '.'));
                    if (val > bestRev) bestRev = val;
                }
                revenue = bestRev;
                console.log(`[EmailParser] Match 3 (Revenue): ${revenue}`);
            }
        }

        if (revenue === 0 && orders === 0) {
            await logSystemActivity('EMAIL_PARSE', 'ERROR', `Grab PDF Extraction Failed`, {
                textSnippet: text.substring(0, 1000).replace(/\n/g, ' ')
            }, brandId);
        }

        try {
            await this.upsertDailySales(brandId, 'GRABFOOD', reportDate, revenue, orders);
            console.log(`[EmailParser] GrabFood sales processed: ${dateStr} - Rev: ${revenue}`);
            try {
                await logSystemActivity('EMAIL_PARSE', 'INFO', `GrabFood PDF Sales Parsed`, { date: reportDate, revenue, orders }, brandId);
            } catch (e) { }
        } catch (e: any) {
            console.error('[EmailParser] Failed to save Grab PDF sales:', e);
            await logSystemActivity('EMAIL_PARSE', 'ERROR', `DB Save Failed: ${e.message}`, { brandId }, brandId);
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

        if (subjectLower.includes('pencairan') || subjectLower.includes('settlement') ||
            subjectLower.includes('dana') || subjectLower.includes('pembayaran berkala')) {
            return 'SETTLEMENT';
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
        if (!salesData) return;

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
        const dateStr = this.extractDate(html);
        if (!dateStr) return null;
        const reportDate = new Date(dateStr);

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

    // ===== SETTLEMENT HANDLING (Skeleton Orders) =====
    async handleSettlementEmail(html: string, subject: string, brandId: string, platform: string) {
        const amountMatch = html.match(/(?:Total|Jumlah|Settlement)[:\s]+Rp\s*([\d\.,]+)/i);
        const orderIdMatch = html.match(/(?:ID Pesanan|No\. Pesanan|Order ID)[:\s]+([\w\d]+)/i);

        if (!amountMatch) return;

        const total = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
        const externalOrderId = orderIdMatch?.[1]?.trim() || `SETT-${Date.now()}`;

        // Check if order already exists
        const existing = await prisma.order.findFirst({
            where: {
                brandId,
                externalOrderId
            }
        });

        if (existing) return;

        const count = await prisma.order.count({ where: { brandId } });
        const invoiceNo = `SKELETON/${new Date().getFullYear()}/${count + 1}`;

        await prisma.order.create({
            data: {
                brandId,
                channel: platform,
                externalOrderId,
                invoiceNo,
                customerName: 'Marketplace Settlement',
                status: 'DIPESAN',
                totalAmount: total,
                quantity: 0, // 0 items initially
                subtotal: total,
                total: total,
                internalNotes: `[SETTLEMENT] Skeleton Order Created. Items missing from email.\nSubject: ${subject}`,
                syncedFromEmail: true,
                emailSyncedAt: new Date(),
            } as any
        });

        console.log(`[EmailParser] Skeleton Order created for ${platform}: ${externalOrderId} - Rp ${total}`);
    }
}
