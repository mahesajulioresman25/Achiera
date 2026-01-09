
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmPaymentButton({ invoiceNumber }: { invoiceNumber: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        if (!confirm('Mark this invoice as PAID? This will notify the customer.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/invoice/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceNumber })
            });

            if (res.ok) {
                toast.success('Pembayaran Berhasil Dikonfirmasi!');
                router.refresh();
            } else {
                toast.error('Gagal memperbarui status');
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Mark as PAID
        </button>
    );
}
