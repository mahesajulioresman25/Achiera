import React, { useState } from 'react';

interface AgreementSamplingCardProps {
    decisionId: string;
    brandId: string;
    onCompleted?: () => void;
}

export function AgreementSamplingCard({ decisionId, brandId, onCompleted }: AgreementSamplingCardProps) {
    const [agreement, setAgreement] = useState<'AGREE' | 'UNSURE' | 'DISAGREE' | null>(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!agreement) return;
        setSubmitting(true);
        try {
            const response = await fetch('/api/autonomous-analytics/trust/calibration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisionId,
                    brandId,
                    agreement,
                    reason
                })
            });

            if (response.ok) {
                setSubmitted(true);
                if (onCompleted) onCompleted();
            }
        } catch (error) {
            console.error('Failed to submit calibration signal:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Calibration Signal Recorded</span>
                <p className="text-[10px] text-blue-500 mt-1 italic">Thank you for your alignment input. Signal stored for trust gap analysis.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Human Trust Calibration</span>
            </div>
            <div className="p-4">
                <p className="text-xs font-bold text-gray-700 mb-4">
                    “Jika ini terjadi di dunia nyata, apakah keputusan ini masuk akal menurut Anda?”
                </p>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setAgreement('AGREE')}
                        className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase transition-all border ${agreement === 'AGREE' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-100 hover:border-green-200 hover:bg-green-50'}`}
                    >
                        ✅ Agree
                    </button>
                    <button
                        onClick={() => setAgreement('UNSURE')}
                        className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase transition-all border ${agreement === 'UNSURE' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200 hover:bg-orange-50'}`}
                    >
                        ⚠️ Unsure
                    </button>
                    <button
                        onClick={() => setAgreement('DISAGREE')}
                        className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase transition-all border ${agreement === 'DISAGREE' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-100 hover:border-red-200 hover:bg-red-50'}`}
                    >
                        ❌ Disagree
                    </button>
                </div>

                {agreement && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Optional: Provide context for divergence..."
                            className="w-full text-[10px] p-2 border border-gray-100 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-200"
                            rows={2}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full mt-3 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Recording...' : 'Record Calibration Signal'}
                        </button>
                    </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-50">
                    <p className="text-[9px] text-gray-400 italic leading-tight">
                        Calibration signals are read-only and have no effect on system execution.
                        They are used exclusively for measuring operator vs system alignment.
                    </p>
                </div>
            </div>
        </div>
    );
}
