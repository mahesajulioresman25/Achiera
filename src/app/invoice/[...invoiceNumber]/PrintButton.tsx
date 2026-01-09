'use client';

import { Printer } from 'lucide-react';

export default function StylePrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-colors print:hidden z-50 flex items-center gap-2"
        >
            <Printer size={20} />
            <span className="font-bold text-sm">Print / Save PDF</span>
        </button>
    );
}
