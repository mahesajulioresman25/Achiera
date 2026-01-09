import React from 'react';

interface ExecutiveConfidenceDashboardProps {
    score: number;
    dimensions: {
        operational: number;
        risk: number;
        explainability: number;
        psychological: number;
    };
    status: 'CRITICAL' | 'CAUTION' | 'ALIGNED' | 'PENDING';
    loading?: boolean;
}

export function ExecutiveConfidenceDashboard({ score, dimensions, status, loading }: ExecutiveConfidenceDashboardProps) {
    if (loading) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-2xl border-2 border-dashed border-gray-100"></div>;
    }

    const size = 220;
    const center = size / 2;
    const radius = size * 0.4;

    const getPoint = (val: number, angleDeg: number) => {
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const normalizedVal = val / 100;
        return {
            x: center + (radius * normalizedVal) * Math.cos(angleRad),
            y: center + (radius * normalizedVal) * Math.sin(angleRad)
        };
    };

    const pOp = getPoint(dimensions.operational, 0);
    const pRisk = getPoint(dimensions.risk, 90);
    const pExp = getPoint(dimensions.explainability, 180);
    const pPsy = getPoint(dimensions.psychological, 270);

    const radarPath = `M ${pOp.x} ${pOp.y} L ${pRisk.x} ${pRisk.y} L ${pExp.x} ${pExp.y} L ${pPsy.x} ${pPsy.y} Z`;

    const statusColors = {
        CRITICAL: 'text-red-600 bg-red-50 border-red-100',
        CAUTION: 'text-orange-600 bg-orange-50 border-orange-100',
        ALIGNED: 'text-green-600 bg-green-50 border-green-100',
        PENDING: 'text-gray-400 bg-gray-50 border-gray-100'
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1">Executive Confidence Review</h3>
                    <p className="text-xs text-gray-400 font-medium italic">"Executive confidence does not equal system permission."</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-black text-xs uppercase tracking-widest ${statusColors[status]}`}>
                    {status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Radar Visualization */}
                <div className="relative flex justify-center">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {/* Grids */}
                        {[20, 40, 60, 80, 100].map((lvl) => (
                            <circle key={lvl} cx={center} cy={center} r={radius * (lvl / 100)} fill="none" stroke="#f1f5f9" strokeWidth="1" />
                        ))}

                        {/* Axes */}
                        {[0, 90, 180, 270].map((ang) => {
                            const p = getPoint(100, ang);
                            return <line key={ang} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#f1f5f9" strokeWidth="1" />;
                        })}

                        {/* Radar Shape */}
                        <path d={radarPath} fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth="3" className="transition-all duration-1000" />

                        {/* Markers */}
                        <circle cx={pOp.x} cy={pOp.y} r="5" fill="#2563eb" />
                        <circle cx={pRisk.x} cy={pRisk.y} r="5" fill="#f59e0b" />
                        <circle cx={pExp.x} cy={pExp.y} r="5" fill="#10b981" />
                        <circle cx={pPsy.x} cy={pPsy.y} r="5" fill="#6366f1" />
                    </svg>

                    {/* Labels */}
                    <div className="absolute top-[-25px] left-1/2 translate-x-[-50%] text-[9px] font-black text-blue-600 uppercase tracking-widest">Operational</div>
                    <div className="absolute top-1/2 right-[-35px] translate-y-[-50%] text-[9px] font-black text-orange-600 uppercase tracking-widest">Risk</div>
                    <div className="absolute bottom-[-25px] left-1/2 translate-x-[-50%] text-[9px] font-black text-green-600 uppercase tracking-widest">Explainability</div>
                    <div className="absolute top-1/2 left-[-35px] translate-y-[-50%] text-[9px] font-black text-indigo-600 uppercase tracking-widest">Psychological</div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-6">
                    <div className="text-center lg:text-left">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Aggregated Score</span>
                        <div className="text-6xl font-black text-gray-800 tracking-tighter">
                            {score}<span className="text-2xl text-gray-300">/100</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[9px] font-black text-blue-600 uppercase block mb-1">Operational</span>
                            <div className="text-lg font-black text-gray-700">{dimensions.operational}%</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[9px] font-black text-orange-600 uppercase block mb-1">Risk Buffer</span>
                            <div className="text-lg font-black text-gray-700">{dimensions.risk}%</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[9px] font-black text-green-600 uppercase block mb-1">Explainability</span>
                            <div className="text-lg font-black text-gray-700">{dimensions.explainability}%</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[9px] font-black text-indigo-600 uppercase block mb-1">Psych Safety</span>
                            <div className="text-lg font-black text-gray-700">{dimensions.psychological}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Governance Legend */}
            <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Board Significance</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CFO Sensitivity</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Clarity</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
