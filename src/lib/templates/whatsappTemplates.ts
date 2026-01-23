// WhatsApp Message Templates for Rasa Ibu

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';

export const whatsappTemplates = {
    /**
     * Shipping notification template
     */
    shippingNotification: (order: {
        invoiceNo: string;
        customerName: string;
        courierName?: string;
        trackingNo?: string;
        trackingUrl?: string;
        driverName?: string;
    }): string => {
        const courierInfo = order.courierName || 'Kurir';
        const trackingInfo = order.trackingNo ? `🔢 No. Resi: ${order.trackingNo}` : '';
        const driverInfo = order.driverName ? `👤 Driver: ${order.driverName}` : '';
        const trackingLink = `${APP_URL}/order/track/${order.invoiceNo}`;

        return `
🚀 *Pesanan Anda Sedang Dikirim!*

Halo Bunda ${order.customerName},

Kabar gembira! Pesanan Anda dengan nomor invoice *${order.invoiceNo}* sudah dalam perjalanan menuju lokasi Bunda.

📦 Kurir: ${courierInfo}
${trackingInfo}
${driverInfo}

Lacak pesanan Anda secara real-time di sini:
${trackingLink}

Terima kasih sudah mempercayai Rasa Ibu! 🍲

_Pesan otomatis dari Achiera Rasa Ibu_
        `.trim();
    },

    /**
     * Payment confirmation template
     */
    paymentConfirmation: (order: {
        invoiceNo: string;
        customerName: string;
        totalAmount: number;
    }): string => {
        const trackingLink = `${APP_URL}/order/track/${order.invoiceNo}`;

        return `
✅ *Pembayaran Diterima!*

Halo Bunda ${order.customerName},

Terima kasih! Pembayaran Anda untuk invoice *${order.invoiceNo}* sebesar *Rp ${order.totalAmount.toLocaleString('id-ID')}* telah kami terima.

👨‍🍳 Tim dapur kami sedang menyiapkan hidangan terbaik untuk Bunda dengan penuh cinta dan kehati-hatian.

Pantau status pesanan Anda di:
${trackingLink}

Kami akan mengirim update saat pesanan siap dikirim.

Salam hangat,
Tim Rasa Ibu 🍲

_Pesan otomatis dari Achiera Rasa Ibu_
        `.trim();
    },

    /**
     * Delivery completed template
     */
    deliveryCompleted: (order: {
        invoiceNo: string;
        customerName: string;
    }): string => {
        const trackingLink = `${APP_URL}/order/track/${order.invoiceNo}`;

        return `
🎉 *Pesanan Telah Sampai!*

Halo Bunda ${order.customerName},

Pesanan dengan invoice *${order.invoiceNo}* telah dinyatakan sampai ke tangan Bunda.

Selamat menikmati hidangan dari Rasa Ibu! Semoga setiap suapan membawa kehangatan untuk keluarga Bunda. 🍲❤️

💬 Kami sangat menghargai feedback Bunda. Jika ada saran atau masukan, jangan ragu untuk menghubungi kami.

Detail pesanan:
${trackingLink}

Terima kasih atas kepercayaan Bunda!

Salam hangat,
Tim Rasa Ibu

_Pesan otomatis dari Achiera Rasa Ibu_
        `.trim();
    },

    /**
     * Order confirmation template (when order is created)
     */
    orderConfirmation: (order: {
        invoiceNo: string;
        customerName: string;
        totalAmount: number;
        paymentMethod?: string;
    }): string => {
        const trackingLink = `${APP_URL}/order/track/${order.invoiceNo}`;
        const paymentInfo = order.paymentMethod === 'QRIS'
            ? 'Silakan selesaikan pembayaran via QRIS di halaman tracking.'
            : 'Silakan lakukan transfer sesuai instruksi di halaman tracking.';

        return `
📝 *Pesanan Berhasil Dibuat!*

Halo Bunda ${order.customerName},

Terima kasih telah memesan di Rasa Ibu!

📋 Invoice: *${order.invoiceNo}*
💰 Total: *Rp ${order.totalAmount.toLocaleString('id-ID')}*

${paymentInfo}

Detail lengkap & cara pembayaran:
${trackingLink}

Kami tunggu konfirmasi pembayaran Bunda ya! 😊

Salam hangat,
Tim Rasa Ibu 🍲

_Pesan otomatis dari Achiera Rasa Ibu_
        `.trim();
    }
};
