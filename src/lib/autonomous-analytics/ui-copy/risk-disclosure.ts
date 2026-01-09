// Risk Disclosure - Legally conservative risk warnings
// CRITICAL: CFO-safe, legally reviewed disclosures

/**
 * Risk disclosure templates
 */
export const RISK_DISCLOSURE = {
    // General disclaimer
    general: {
        title: 'Disclaimer Sistem Autonomous',
        content: [
            'Sistem autonomous ACHIERA menggunakan rule-based decision engine yang deterministik.',
            'Semua keputusan berdasarkan metrik aktual dan threshold yang telah ditentukan.',
            'AI hanya digunakan untuk memberikan penjelasan, TIDAK untuk membuat keputusan.',
            'Setiap eksekusi dicatat dalam audit trail dan dapat di-review kapan saja.',
            'Brand owner dan CFO memiliki kontrol penuh untuk override atau rollback keputusan sistem.'
        ]
    },

    // Financial risk disclosure
    financial: {
        title: 'Risiko Finansial',
        low: [
            'Dampak finansial terbatas (< Rp 1 juta per minggu)',
            'Tidak ada risiko revenue loss signifikan',
            'Rollback tersedia jika diperlukan'
        ],
        medium: [
            'Dampak finansial moderat (Rp 1-5 juta per minggu)',
            'Potensi revenue loss jika keputusan tidak optimal',
            'Monitoring aktif diperlukan selama 24-48 jam pertama',
            'Rollback tersedia dengan batasan waktu'
        ],
        high: [
            'Dampak finansial signifikan (Rp 5-20 juta per minggu)',
            'Risiko revenue loss substansial jika gagal',
            'Approval dari Brand Owner wajib',
            'Monitoring ketat diperlukan',
            'Rollback mungkin tidak sepenuhnya mengembalikan state'
        ],
        critical: [
            'Dampak finansial besar (> Rp 20 juta per minggu)',
            'Risiko revenue loss mayor',
            'Approval dari CFO wajib',
            'Monitoring real-time diperlukan',
            'Rollback terbatas atau tidak tersedia',
            'Konsultasi dengan tim finance sangat disarankan'
        ]
    },

    // Operational risk disclosure
    operational: {
        title: 'Risiko Operasional',
        content: [
            'Eksekusi otomatis dapat mengubah konfigurasi aktif (budget, status kampanye, dll)',
            'Perubahan akan langsung berdampak pada operasional bisnis',
            'Pastikan tim operasional aware terhadap keputusan autonomous',
            'Koordinasi dengan tim terkait disarankan untuk aksi berisiko tinggi'
        ]
    },

    // Data risk disclosure
    data: {
        title: 'Risiko Data',
        content: [
            'Keputusan berdasarkan data historis yang tersedia',
            'Kualitas keputusan bergantung pada kelengkapan dan akurasi data',
            'Data completeness < 90% dapat mengurangi akurasi keputusan',
            'Anomali data atau data drift dapat menyebabkan keputusan tidak optimal',
            'Review manual disarankan jika confidence score < 85%'
        ]
    },

    // AI risk disclosure
    ai: {
        title: 'Penggunaan AI',
        content: [
            'AI (Claude 3.5 Sonnet) HANYA digunakan untuk memberikan penjelasan',
            'AI TIDAK memiliki authority untuk membuat atau mengubah keputusan',
            'AI TIDAK dapat meng-approve atau menolak keputusan',
            'Jika AI service tidak tersedia, sistem tetap berfungsi dengan deterministic explanation',
            'Semua output AI di-validate dan di-sanitize sebelum ditampilkan',
            'Confidence score AI selalu ditampilkan untuk transparansi'
        ]
    },

    // Rollback risk disclosure
    rollback: {
        title: 'Risiko Rollback',
        content: [
            'Rollback mengembalikan state ke kondisi sebelum eksekusi',
            'Rollback TIDAK menjamin hasil bisnis akan sama persis',
            'Beberapa efek eksternal (contoh: iklan yang sudah tayang) tidak dapat di-rollback',
            'Auto-rollback hanya tersedia untuk aksi tertentu dengan snapshot',
            'Manual rollback memerlukan approval dari user yang berwenang'
        ]
    },

    // Autonomy level risk
    autonomy_risk: {
        0: {
            title: 'Level 0 - Observe Only',
            risks: [
                'Tidak ada risiko eksekusi - sistem hanya observe',
                'Tidak ada perubahan otomatis pada sistem'
            ]
        },
        1: {
            title: 'Level 1 - Suggest (Auto-Execute Low Risk)',
            risks: [
                'Sistem dapat mengeksekusi aksi berisiko rendah secara otomatis',
                'Semua aksi memiliki auto-rollback dalam 24 jam',
                'Dampak finansial terbatas',
                'Manual override tersedia kapan saja'
            ]
        },
        2: {
            title: 'Level 2 - Assisted (Approval Required)',
            risks: [
                'Sistem dapat mengeksekusi setelah mendapat approval',
                'Dampak finansial moderat hingga signifikan',
                'Rollback tersedia dengan batasan',
                'Monitoring aktif diperlukan'
            ]
        },
        3: {
            title: 'Level 3 - Guarded (CFO Approval Required)',
            risks: [
                'Sistem dapat mengeksekusi aksi berisiko tinggi',
                'Memerlukan CFO approval untuk setiap eksekusi',
                'Dampak finansial besar',
                'Rollback terbatas',
                'Monitoring real-time wajib'
            ]
        }
    }
};

/**
 * Legal disclaimers
 */
export const LEGAL_DISCLAIMERS = {
    approval: 'Dengan meng-approve keputusan ini, saya menyatakan telah membaca dan memahami risiko yang terkait, dan menyetujui eksekusi aksi ini atas nama brand.',

    rejection: 'Dengan menolak keputusan ini, saya menyatakan bahwa aksi ini tidak sesuai dengan strategi bisnis atau memiliki risiko yang tidak dapat diterima.',

    rollback: 'Dengan melakukan rollback, saya memahami bahwa beberapa efek dari eksekusi sebelumnya mungkin tidak dapat dikembalikan sepenuhnya.',

    override: 'Dengan melakukan manual override, saya mengambil tanggung jawab penuh atas keputusan ini dan memahami bahwa sistem autonomous tidak akan bertanggung jawab atas hasil dari override ini.'
};

/**
 * Get risk disclosure for specific risk tier
 */
export function getRiskDisclosure(riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string[] {
    return RISK_DISCLOSURE.financial[riskTier.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'];
}

/**
 * Get autonomy level risk disclosure
 */
export function getAutonomyRiskDisclosure(level: 0 | 1 | 2 | 3): {
    title: string;
    risks: string[];
} {
    return RISK_DISCLOSURE.autonomy_risk[level];
}
