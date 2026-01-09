import React, { useState } from 'react';

interface GovernanceSignOffPanelProps {
    brandId: string;
    onSignOff: () => void;
}

export function GovernanceSignOffPanel({ brandId, onSignOff }: GovernanceSignOffPanelProps) {
    const [role, setRole] = useState<'CFO' | 'BOARD' | 'OPERATOR'>('CFO');
    const [dimensions, setDimensions] = useState({
        operational: 80,
        risk: 80,
        explainability: 80,
        psychological: 80
    });
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSliderChange = (dim: keyof typeof dimensions, val: string) => {
        setDimensions(prev => ({ ...prev, [dim]: parseInt(val) }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/autonomous-analytics/trust/confidence/sign-off', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    reviewerRole: role,
                    dimensions,
                    comments
                })
            });

            if (response.ok) {
                onSignOff();
                setComments('');
            }
        } catch (error) {
            console.error('Sign-off error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-xl font-black tracking-tight mb-1">Governance Sign-off</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Formal Executive Confidence Review</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['CFO', 'BOARD', 'OPERATOR'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${role === r ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8 mb-10">
                {Object.entries(dimensions).map(([dim, val]) => (
                    <div key={dim}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{dim}</span>
                            <span className="text-sm font-black text-blue-400">{val}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => handleSliderChange(dim as any, e.target.value)}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                        />
                    </div>
                ))}
            </div>

            <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Qualitative Assessment</span>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide reasoning for your confidence scores..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                ></textarea>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
            >
                {isSubmitting ? 'Recording Protocol...' : 'Submit Confidence Sign-off'}
            </button>

            <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight text-center leading-relaxed">
                    "Executive confidence does not equal system permission."<br />
                    This signature is purely diagnostic and does not enable autonomous execution.
                </p>
            </div>
        </div>
    );
}
