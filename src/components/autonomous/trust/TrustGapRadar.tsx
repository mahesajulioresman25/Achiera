import React from 'react';

interface TrustGapRadarProps {
    systemConfidence: number;
    humanAgreement: number;
    aiConfidence?: number;
    loading?: boolean;
}

export function TrustGapRadar({ systemConfidence, humanAgreement, aiConfidence = 0.85, loading }: TrustGapRadarProps) {
    if (loading) {
        return <div className="h-48 bg-gray-50 animate-pulse rounded-xl"></div>;
    }

    const delta = Math.abs(systemConfidence - humanAgreement);
    const gapScore = Math.max(0, 100 - (delta * 100));

    // Simple Radar Visualization using SVG
    // Three axes: System, AI, Human (Normalized 0-1)
    const size = 200;
    const center = size / 2;
    const radius = size * 0.4;

    const getPoint = (val: number, angleDeg: number) => {
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        return {
            x: center + (radius * val) * Math.cos(angleRad),
            y: center + (radius * val) * Math.sin(angleRad)
        };
    };

    const pSystem = getPoint(systemConfidence, 0);
    const pAI = getPoint(aiConfidence, 120);
    const pHuman = getPoint(humanAgreement, 240);

    const radarPath = `M ${pSystem.x} ${pSystem.y} L ${pAI.x} ${pAI.y} L ${pHuman.x} ${pHuman.y} Z`;

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col items-center">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 w-full text-left">Trust Alignment Radar</h4>

            <div className="relative w-[200px] h-[200px] mb-6">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Grids */}
                    {[0.2, 0.4, 0.6, 0.8, 1].map((lvl) => (
                        <circle key={lvl} cx={center} cy={center} r={radius * lvl} fill="none" stroke="#f3f4f6" strokeWidth="1" />
                    ))}

                    {/* Axis Lines */}
                    {[0, 120, 240].map((ang) => {
                        const p = getPoint(1, ang);
                        return <line key={ang} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#f3f4f6" strokeWidth="1" />;
                    })}

                    {/* Radar Shape */}
                    <path d={radarPath} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" className="transition-all duration-1000" />

                    {/* Points */}
                    <circle cx={pSystem.x} cy={pSystem.y} r="4" fill="#3b82f6" />
                    <circle cx={pAI.x} cy={pAI.y} r="4" fill="#10b981" />
                    <circle cx={pHuman.x} cy={pHuman.y} r="4" fill="#f59e0b" />
                </svg>

                {/* Labels */}
                <div className="absolute top-[-10px] left-1/2 translate-x-[-50%] text-[8px] font-black text-blue-600 uppercase">System</div>
                <div className="absolute bottom-[20px] right-[-10px] text-[8px] font-black text-green-600 uppercase">AI AIgn</div>
                <div className="absolute bottom-[20px] left-[-10px] text-[8px] font-black text-amber-600 uppercase">Human</div>
            </div>

            <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-500 uppercase">Trust Gap Score</span>
                    <span className={`${gapScore < 70 ? 'text-red-600' : 'text-green-600'}`}>{gapScore.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${gapScore < 70 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${gapScore}%` }}
                    ></div>
                </div>
                <p className="text-[9px] text-gray-400 italic text-center mt-2">
                    {delta > 0.3 ? '⚠️ Critical Divergence: Governance review recommended.' : 'Stable alignment between system and human judgment.'}
                </p>
            </div>
        </div>
    );
}
