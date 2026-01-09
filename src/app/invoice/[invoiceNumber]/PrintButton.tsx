
'use client';

import { Printer } from 'lucide-react';

export default function StylePrintButton() {
    return (
        <div className="fixed bottom-8 right-8 print:hidden z-50">
            <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2 font-bold"
            >
                <Printer className="w-5 h-5" /> Print / Save PDF
            </button>
        </div>
    );
}
