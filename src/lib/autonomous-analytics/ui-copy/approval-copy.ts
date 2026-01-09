// Approval Copy - Legally conservative wording for approval dialogs
// CRITICAL: CFO-safe, legally reviewed language

/**
 * Approval dialog copy
 */
export const APPROVAL_DIALOG_COPY = {
    // Approval confirmation
    approve: {
        title: 'Konfirmasi Approval',
        message: 'Anda akan meng-approve keputusan autonomous ini. Aksi ini akan dicatat dalam audit trail dan tidak dapat dibatalkan.',
        warning: 'Dengan meng-approve, Anda menyatakan telah memahami risiko dan dampak finansial dari keputusan ini.',
        button_confirm: 'Ya, Approve',
        button_cancel: 'Batal',
        reason_label: 'Alasan Approval (opsional)',
        reason_placeholder: 'Contoh: Metrik sudah sesuai target, risiko dapat diterima'
    },

    // Rejection confirmation
    reject: {
        title: 'Konfirmasi Rejection',
        message: 'Anda akan menolak keputusan autonomous ini. Sistem tidak akan mengeksekusi aksi ini.',
        warning: 'Rejection akan dicatat dalam audit trail. Pastikan Anda memberikan alasan yang jelas.',
        button_confirm: 'Ya, Reject',
        button_cancel: 'Batal',
        reason_label: 'Alasan Rejection (wajib)',
        reason_placeholder: 'Contoh: Metrik tidak akurat, timing tidak tepat, risiko terlalu tinggi'
    },

    // Escalation confirmation
    escalate: {
        title: 'Konfirmasi Escalation',
        message: 'Anda akan meng-escalate keputusan ini ke level approval yang lebih tinggi.',
        warning: 'Escalation akan menunda eksekusi hingga approval dari pihak yang berwenang diterima.',
        button_confirm: 'Ya, Escalate',
        button_cancel: 'Batal',
        reason_label: 'Alasan Escalation (wajib)',
        reason_placeholder: 'Contoh: Memerlukan review CFO, dampak finansial signifikan'
    }
};

/**
 * Autonomy level descriptions
 */
export const AUTONOMY_LEVEL_COPY = {
    0: {
        name: 'Level 0 - Observe',
        description: 'Sistem hanya mengobservasi dan memberikan rekomendasi. Tidak ada eksekusi otomatis.',
        safety: 'Paling aman - tidak ada risiko eksekusi tidak disengaja'
    },
    1: {
        name: 'Level 1 - Suggest',
        description: 'Sistem dapat mengeksekusi aksi berisiko rendah secara otomatis dengan auto-rollback.',
        safety: 'Aman - hanya aksi reversible dengan dampak terbatas'
    },
    2: {
        name: 'Level 2 - Assisted',
        description: 'Sistem dapat mengeksekusi aksi berisiko menengah setelah mendapat approval.',
        safety: 'Memerlukan approval - eksekusi setelah review manual'
    },
    3: {
        name: 'Level 3 - Guarded',
        description: 'Sistem dapat mengeksekusi aksi berisiko tinggi dengan approval ketat dan monitoring.',
        safety: 'Memerlukan CFO approval - risiko tinggi, monitoring ketat'
    }
};

/**
 * Risk tier descriptions
 */
export const RISK_TIER_COPY = {
    LOW: {
        name: 'Risiko Rendah',
        description: 'Dampak finansial terbatas, mudah di-rollback, tidak ada perubahan permanen',
        color: 'green',
        icon: '✓'
    },
    MEDIUM: {
        name: 'Risiko Menengah',
        description: 'Dampak finansial moderat, dapat di-rollback, memerlukan monitoring',
        color: 'yellow',
        icon: '⚠'
    },
    HIGH: {
        name: 'Risiko Tinggi',
        description: 'Dampak finansial signifikan, rollback terbatas, memerlukan approval ketat',
        color: 'orange',
        icon: '⚠⚠'
    },
    CRITICAL: {
        name: 'Risiko Kritis',
        description: 'Dampak finansial besar, sulit di-rollback, memerlukan CFO approval',
        color: 'red',
        icon: '🔴'
    }
};

/**
 * Action type descriptions
 */
export const ACTION_TYPE_COPY = {
    ADS_PAUSE: 'Jeda Kampanye Iklan',
    ADS_RESUME: 'Lanjutkan Kampanye Iklan',
    ADS_BUDGET_UP: 'Tingkatkan Budget Iklan',
    ADS_BUDGET_DOWN: 'Turunkan Budget Iklan',
    PROMO_STOP: 'Hentikan Promosi',
    PROMO_RESUME: 'Lanjutkan Promosi',
    STOCK_ALERT: 'Kirim Alert Stok Rendah',
    PRICE_ADJUST: 'Sesuaikan Harga'
};

/**
 * Approval requirement messages
 */
export const APPROVAL_REQUIREMENT_COPY = {
    none: 'Tidak memerlukan approval - dapat dieksekusi otomatis',
    admin: 'Memerlukan approval dari Brand Admin',
    owner: 'Memerlukan approval dari Brand Owner',
    cfo: 'Memerlukan approval dari CFO',
    escalated: 'Telah di-escalate - menunggu approval level lebih tinggi'
};

/**
 * Safety gate messages
 */
export const SAFETY_GATE_COPY = {
    all_passed: 'Semua safety gates passed - aksi aman untuk dieksekusi',
    some_failed: (failed: number, total: number) =>
        `${failed} dari ${total} safety gates gagal - eksekusi diblokir`,
    gate_names: {
        cooldown: 'Cooldown Period',
        daily_cap: 'Daily Execution Cap',
        blackout: 'Blackout Period',
        autonomy_level: 'Autonomy Level Check',
        confidence: 'Confidence Threshold',
        data_completeness: 'Data Completeness',
        conflict: 'Conflict Detection'
    }
};

/**
 * Rollback messages
 */
export const ROLLBACK_COPY = {
    available: (hours: number) =>
        `Rollback tersedia - auto-rollback dalam ${hours} jam`,
    not_available: 'Rollback tidak tersedia untuk aksi ini',
    manual_only: 'Hanya manual rollback yang tersedia',
    confirm_title: 'Konfirmasi Rollback',
    confirm_message: 'Anda akan me-rollback eksekusi ini ke state sebelumnya. Aksi ini tidak dapat dibatalkan.',
    confirm_warning: 'Pastikan Anda memahami dampak rollback terhadap sistem.',
    confirm_button: 'Ya, Rollback',
    cancel_button: 'Batal'
};

/**
 * Confidence score messages
 */
export const CONFIDENCE_COPY = {
    very_high: (score: number) =>
        `Confidence sangat tinggi (${(score * 100).toFixed(0)}%) - keputusan dapat dipercaya`,
    high: (score: number) =>
        `Confidence tinggi (${(score * 100).toFixed(0)}%) - keputusan reliable`,
    medium: (score: number) =>
        `Confidence menengah (${(score * 100).toFixed(0)}%) - review manual disarankan`,
    low: (score: number) =>
        `Confidence rendah (${(score * 100).toFixed(0)}%) - review manual wajib`,
    threshold: 'Threshold minimum: 85%'
};
