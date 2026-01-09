// ACHIERA Autonomous Analytics - Header Inference Engine
// 5-Layer Hybrid Inference: Keyword → Regex → Statistical → Platform → Manual

export type InferenceMethod = 'keyword' | 'regex' | 'statistical' | 'platform_heuristic' | 'manual';
export type DataType = 'string' | 'number' | 'date' | 'boolean';
export type CanonicalField =
    // Sales fields
    | 'transaction_date' | 'transaction_time' | 'order_id'
    | 'sku' | 'product_name' | 'product_category' | 'variant_name'
    | 'quantity' | 'unit_price' | 'total_amount' | 'discount_amount' | 'net_amount'
    | 'platform' | 'channel' | 'store_name'
    | 'customer_id' | 'customer_name' | 'customer_phone' | 'customer_email'
    | 'promotion_code' | 'promotion_name'
    | 'payment_method' | 'shipping_cost' | 'notes'
    // Ads fields
    | 'campaign_id' | 'campaign_name' | 'ad_set_id' | 'ad_set_name' | 'ad_id' | 'ad_name'
    | 'date' | 'impressions' | 'clicks' | 'spend' | 'conversions' | 'revenue'
    | 'reach' | 'frequency' | 'video_views' | 'engagement'
    | 'ctr' | 'cpc' | 'cpa' | 'roas';

export interface ColumnMapping {
    sourceColumnName: string;
    sourceColumnIndex: number;
    canonicalField: CanonicalField | null;
    inferenceMethod: InferenceMethod;
    confidence: number;
    dataType: DataType;
    sampleValues: any[];
}

export interface InferenceResult {
    mappings: ColumnMapping[];
    overallConfidence: number;
    blockingIssues: string[];
    warnings: string[];
}

// ============================================
// LAYER 1: KEYWORD DICTIONARY
// ============================================

const KEYWORD_MAPPINGS: Record<CanonicalField, string[]> = {
    // Transaction
    transaction_date: ['tanggal', 'date', 'tgl', 'transaction_date', 'order_date', 'waktu', 'time', 'datetime', 'created_at', 'timestamp', 'tgl_transaksi'],
    transaction_time: ['waktu', 'time', 'jam', 'hour'],
    order_id: ['order_id', 'no_order', 'nomor_order', 'invoice', 'no_invoice', 'transaction_id', 'receipt', 'kwitansi', 'no_pesanan'],

    // Product
    sku: ['sku', 'kode_produk', 'product_code', 'item_code', 'barcode', 'kode_barang'],
    product_name: ['produk', 'product', 'nama_produk', 'product_name', 'item', 'barang', 'nama_barang', 'item_name', 'description', 'deskripsi'],
    product_category: ['kategori', 'category', 'jenis', 'type', 'product_category'],
    variant_name: ['variasi', 'variant', 'varian', 'option', 'pilihan'],

    // Quantity & Pricing
    quantity: ['qty', 'quantity', 'jumlah', 'jml', 'amount', 'units', 'kuantitas'],
    unit_price: ['harga', 'price', 'harga_satuan', 'unit_price', 'price_per_unit', 'harga_asli'],
    total_amount: ['total', 'total_amount', 'total_harga', 'subtotal', 'amount', 'jumlah_total'],
    discount_amount: ['diskon', 'discount', 'potongan', 'discount_amount', 'cashback'],
    net_amount: ['net', 'net_amount', 'total_bersih', 'nett'],

    // Platform & Channel
    platform: ['platform', 'marketplace', 'channel', 'source', 'sumber', 'toko'],
    channel: ['channel', 'saluran', 'jalur'],
    store_name: ['toko', 'store', 'nama_toko', 'store_name', 'outlet'],

    // Customer
    customer_id: ['customer_id', 'id_pelanggan', 'user_id', 'member_id'],
    customer_name: ['nama', 'name', 'customer_name', 'nama_pelanggan', 'pembeli', 'buyer'],
    customer_phone: ['hp', 'phone', 'telepon', 'no_hp', 'nomor_hp', 'whatsapp', 'wa'],
    customer_email: ['email', 'e-mail', 'surel'],

    // Promotion
    promotion_code: ['kode_promo', 'promo_code', 'voucher', 'coupon', 'kode_voucher'],
    promotion_name: ['promo', 'promotion', 'nama_promo', 'promotion_name'],

    // Metadata
    payment_method: ['pembayaran', 'payment', 'metode_bayar', 'payment_method', 'cara_bayar'],
    shipping_cost: ['ongkir', 'shipping', 'biaya_kirim', 'shipping_cost', 'delivery_fee'],
    notes: ['catatan', 'notes', 'keterangan', 'remarks', 'note'],

    // Ads - Campaign
    campaign_id: ['campaign_id', 'id_kampanye'],
    campaign_name: ['campaign', 'kampanye', 'campaign_name', 'nama_kampanye'],
    ad_set_id: ['ad_set_id', 'adset_id'],
    ad_set_name: ['ad_set', 'adset', 'ad_set_name'],
    ad_id: ['ad_id', 'iklan_id'],
    ad_name: ['ad_name', 'nama_iklan', 'ad'],

    // Ads - Date
    date: ['date', 'tanggal', 'tgl', 'day'],

    // Ads - Metrics
    impressions: ['impressions', 'impresi', 'views', 'tayangan', 'reach', 'jangkauan'],
    clicks: ['clicks', 'klik', 'click', 'link_clicks'],
    spend: ['spend', 'cost', 'biaya', 'budget', 'pengeluaran', 'amount_spent', 'belanja'],
    conversions: ['conversions', 'konversi', 'purchases', 'pembelian'],
    revenue: ['revenue', 'pendapatan', 'sales', 'penjualan'],
    reach: ['reach', 'jangkauan'],
    frequency: ['frequency', 'frekuensi'],
    video_views: ['video_views', 'video_play'],
    engagement: ['engagement', 'keterlibatan', 'interactions'],

    // Ads - Calculated
    ctr: ['ctr', 'click_through_rate'],
    cpc: ['cpc', 'cost_per_click'],
    cpa: ['cpa', 'cost_per_action', 'cost_per_conversion'],
    roas: ['roas', 'return_on_ad_spend']
};

function matchKeyword(columnName: string): { field: CanonicalField | null; confidence: number } {
    const normalized = columnName.toLowerCase().trim().replace(/[_\s-]/g, '');

    for (const [field, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
        for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase().replace(/[_\s-]/g, '');

            // Exact match
            if (normalized === normalizedKeyword) {
                return { field: field as CanonicalField, confidence: 0.95 };
            }

            // Contains match
            if (normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized)) {
                return { field: field as CanonicalField, confidence: 0.85 };
            }
        }
    }

    return { field: null, confidence: 0 };
}

// ============================================
// LAYER 2: REGEX PATTERNS
// ============================================

const REGEX_PATTERNS: Record<string, { pattern: RegExp; field: CanonicalField; confidence: number }> = {
    date: { pattern: /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/, field: 'transaction_date', confidence: 0.9 },
    sku: { pattern: /^[A-Z0-9]{6,}$/, field: 'sku', confidence: 0.85 },
    phone: { pattern: /^(\+62|62|0)[0-9]{9,12}$/, field: 'customer_phone', confidence: 0.9 },
    email: { pattern: /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, field: 'customer_email', confidence: 0.95 }
};

function matchRegex(sampleValues: any[]): { field: CanonicalField | null; confidence: number } {
    for (const [, { pattern, field, confidence }] of Object.entries(REGEX_PATTERNS)) {
        const matchCount = sampleValues.filter(v =>
            typeof v === 'string' && pattern.test(v)
        ).length;

        const matchRate = matchCount / sampleValues.length;

        if (matchRate > 0.7) {
            return { field, confidence: confidence * matchRate };
        }
    }

    return { field: null, confidence: 0 };
}

// ============================================
// LAYER 3: STATISTICAL INFERENCE
// ============================================

function inferFromStatistics(sampleValues: any[]): {
    dataType: DataType;
    likelyField: CanonicalField | null;
    confidence: number
} {
    // Filter out null/undefined
    const validSamples = sampleValues.filter(v => v !== null && v !== undefined);
    if (validSamples.length === 0) {
        return { dataType: 'string', likelyField: null, confidence: 0 };
    }

    // Check if numeric
    const numericSamples = validSamples.filter(v => !isNaN(Number(v)));
    const isNumeric = numericSamples.length / validSamples.length > 0.8;

    if (isNumeric) {
        const numbers = numericSamples.map(v => Number(v));
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

        // Quantity detection (small integers)
        if (min >= 0 && max <= 1000 && numbers.every(n => Number.isInteger(n))) {
            return { dataType: 'number', likelyField: 'quantity', confidence: 0.75 };
        }

        // Price detection (larger numbers)
        if (min >= 1000 && max <= 100000000) {
            return { dataType: 'number', likelyField: 'unit_price', confidence: 0.7 };
        }

        // Percentage detection
        if (min >= 0 && max <= 100) {
            return { dataType: 'number', likelyField: null, confidence: 0.6 };
        }

        // Large numbers (impressions, clicks)
        if (max > 1000000) {
            return { dataType: 'number', likelyField: 'impressions', confidence: 0.65 };
        }

        return { dataType: 'number', likelyField: null, confidence: 0.5 };
    }

    // Cardinality analysis for strings
    const uniqueCount = new Set(validSamples).size;
    const cardinality = uniqueCount / validSamples.length;

    // High cardinality = likely ID
    if (cardinality > 0.9) {
        return { dataType: 'string', likelyField: 'order_id', confidence: 0.7 };
    }

    // Low cardinality = likely category
    if (cardinality < 0.1) {
        return { dataType: 'string', likelyField: 'product_category', confidence: 0.65 };
    }

    return { dataType: 'string', likelyField: null, confidence: 0.4 };
}

// ============================================
// LAYER 4: PLATFORM HEURISTICS
// ============================================

interface PlatformHeuristic {
    fileNamePattern: RegExp;
    requiredColumns: string[];
    columnMappings: Record<string, CanonicalField>;
}

const PLATFORM_HEURISTICS: Record<string, PlatformHeuristic> = {
    shopee: {
        fileNamePattern: /shopee|spee/i,
        requiredColumns: ['No. Pesanan', 'Nama Produk'],
        columnMappings: {
            'No. Pesanan': 'order_id',
            'Nama Produk': 'product_name',
            'Variasi': 'variant_name',
            'Harga Asli': 'unit_price',
            'Jumlah': 'quantity',
            'Total Harga Produk': 'total_amount',
            'Nama Pembeli': 'customer_name',
            'No. Telepon': 'customer_phone'
        }
    },
    tokopedia: {
        fileNamePattern: /tokopedia|tokped/i,
        requiredColumns: ['Invoice', 'Nama Barang'],
        columnMappings: {
            'Invoice': 'order_id',
            'Nama Barang': 'product_name',
            'Jumlah': 'quantity',
            'Harga': 'unit_price',
            'Total': 'total_amount'
        }
    },
    meta: {
        fileNamePattern: /facebook|meta|instagram/i,
        requiredColumns: ['Campaign name', 'Impressions', 'Clicks'],
        columnMappings: {
            'Campaign name': 'campaign_name',
            'Campaign ID': 'campaign_id',
            'Impressions': 'impressions',
            'Clicks': 'clicks',
            'Amount spent (IDR)': 'spend',
            'Amount spent': 'spend',
            'Purchases': 'conversions',
            'Purchase conversion value': 'revenue'
        }
    },
    google: {
        fileNamePattern: /google|adwords/i,
        requiredColumns: ['Campaign', 'Impressions', 'Clicks'],
        columnMappings: {
            'Campaign': 'campaign_name',
            'Campaign ID': 'campaign_id',
            'Impressions': 'impressions',
            'Clicks': 'clicks',
            'Cost': 'spend',
            'Conversions': 'conversions',
            'Conv. value': 'revenue'
        }
    }
};

function matchPlatformHeuristic(
    fileName: string,
    headers: string[]
): { platform: string | null; mappings: Record<string, CanonicalField>; confidence: number } {
    for (const [platform, heuristic] of Object.entries(PLATFORM_HEURISTICS)) {
        // Check file name pattern
        if (heuristic.fileNamePattern.test(fileName)) {
            // Check if required columns present
            const hasRequiredColumns = heuristic.requiredColumns.every(req =>
                headers.some(h => h.toLowerCase().includes(req.toLowerCase()))
            );

            if (hasRequiredColumns) {
                return { platform, mappings: heuristic.columnMappings, confidence: 0.95 };
            }
        }
    }

    return { platform: null, mappings: {}, confidence: 0 };
}

// ============================================
// MAIN INFERENCE ENGINE
// ============================================

export async function inferHeaders(
    fileName: string,
    headers: string[],
    sampleRows: any[][]
): Promise<InferenceResult> {
    const mappings: ColumnMapping[] = [];

    // Try platform heuristic first
    const platformMatch = matchPlatformHeuristic(fileName, headers);

    for (let i = 0; i < headers.length; i++) {
        const columnName = headers[i];
        const sampleValues = sampleRows.map(row => row[i]);

        let mapping: ColumnMapping = {
            sourceColumnName: columnName,
            sourceColumnIndex: i,
            canonicalField: null,
            inferenceMethod: 'keyword',
            confidence: 0,
            dataType: 'string',
            sampleValues: sampleValues.slice(0, 5)
        };

        // Layer 4: Platform heuristic (highest priority)
        if (platformMatch.platform && platformMatch.mappings[columnName]) {
            mapping.canonicalField = platformMatch.mappings[columnName];
            mapping.inferenceMethod = 'platform_heuristic';
            mapping.confidence = platformMatch.confidence;
            mapping.dataType = inferDataType(sampleValues);
            mappings.push(mapping);
            continue;
        }

        // Layer 1: Keyword matching
        const keywordMatch = matchKeyword(columnName);
        if (keywordMatch.field && keywordMatch.confidence > 0.8) {
            mapping.canonicalField = keywordMatch.field;
            mapping.inferenceMethod = 'keyword';
            mapping.confidence = keywordMatch.confidence;
            mapping.dataType = inferDataType(sampleValues);
            mappings.push(mapping);
            continue;
        }

        // Layer 2: Regex pattern matching
        const regexMatch = matchRegex(sampleValues);
        if (regexMatch.field && regexMatch.confidence > 0.7) {
            mapping.canonicalField = regexMatch.field;
            mapping.inferenceMethod = 'regex';
            mapping.confidence = regexMatch.confidence;
            mapping.dataType = inferDataType(sampleValues);
            mappings.push(mapping);
            continue;
        }

        // Layer 3: Statistical inference
        const statsInference = inferFromStatistics(sampleValues);
        if (statsInference.likelyField && statsInference.confidence > 0.6) {
            mapping.canonicalField = statsInference.likelyField;
            mapping.inferenceMethod = 'statistical';
            mapping.confidence = statsInference.confidence;
            mapping.dataType = statsInference.dataType;
            mappings.push(mapping);
            continue;
        }

        // No match found - use keyword with lower confidence
        if (keywordMatch.field) {
            mapping.canonicalField = keywordMatch.field;
            mapping.confidence = keywordMatch.confidence;
            mapping.dataType = inferDataType(sampleValues);
        }

        mappings.push(mapping);
    }

    // Calculate overall confidence and identify issues
    return calculateConfidence(mappings);
}

function inferDataType(sampleValues: any[]): DataType {
    const validSamples = sampleValues.filter(v => v !== null && v !== undefined);
    if (validSamples.length === 0) return 'string';

    // Check numeric
    const numericCount = validSamples.filter(v => !isNaN(Number(v))).length;
    if (numericCount / validSamples.length > 0.8) return 'number';

    // Check date
    const datePattern = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
    const dateCount = validSamples.filter(v =>
        typeof v === 'string' && datePattern.test(v)
    ).length;
    if (dateCount / validSamples.length > 0.8) return 'date';

    // Check boolean
    const booleanValues = ['true', 'false', 'yes', 'no', '1', '0'];
    const booleanCount = validSamples.filter(v =>
        booleanValues.includes(String(v).toLowerCase())
    ).length;
    if (booleanCount / validSamples.length > 0.8) return 'boolean';

    return 'string';
}

function calculateConfidence(mappings: ColumnMapping[]): InferenceResult {
    const requiredFields: CanonicalField[] = [
        'transaction_date',
        'product_name',
        'quantity',
        'unit_price'
    ];

    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of requiredFields) {
        const mapping = mappings.find(m => m.canonicalField === field);
        if (!mapping) {
            blockingIssues.push(`Missing required field: ${field}`);
        } else if (mapping.confidence < 0.5) {
            blockingIssues.push(`Low confidence for required field: ${field} (${mapping.confidence.toFixed(2)})`);
        }
    }

    // Check optional fields with low confidence
    for (const mapping of mappings) {
        if (mapping.canonicalField && !requiredFields.includes(mapping.canonicalField)) {
            if (mapping.confidence < 0.6) {
                warnings.push(`Low confidence for ${mapping.canonicalField}: ${mapping.confidence.toFixed(2)}`);
            }
        }
    }

    // Calculate overall confidence
    const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
    const overallConfidence = blockingIssues.length > 0 ? 0 : avgConfidence;

    return {
        mappings,
        overallConfidence,
        blockingIssues,
        warnings
    };
}
