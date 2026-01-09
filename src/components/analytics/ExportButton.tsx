'use client';

import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportButtonProps {
    brandSlug: string;
    startDate: Date;
    endDate: Date;
}

export default function ExportButton({ brandSlug, startDate, endDate }: ExportButtonProps) {
    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            const response = await fetch(`/api/admin/${brandSlug}/analytics/export?${params}`);

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${brandSlug}-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export analytics:', error);
            toast.error('Gagal mengekspor data analitik');
        }
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export CSV</span>
        </button>
    );
}
