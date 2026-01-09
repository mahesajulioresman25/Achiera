import React from 'react';

interface AutonomyLevelIndicatorProps {
    currentLevel: number;
}

export function AutonomyLevelIndicator({ currentLevel }: AutonomyLevelIndicatorProps) {
    const levels = [
        {
            level: 0,
            name: 'Observe',
            description: 'System logs decisions but takes no action.'
        },
        {
            level: 1,
            name: 'Suggest',
            description: 'System suggests actions in dashboard.'
        },
        {
            level: 2,
            name: 'Assisted',
            description: 'Human approval required for all actions.'
        },
        {
            level: 3,
            name: 'Guarded',
            description: 'Autonomous execution with safety interlocks.'
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Autonomy Trust Dial (CFO Grade)</h3>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-4 relative z-10">
                    {levels.map((l) => {
                        const isCurrent = l.level === currentLevel;
                        const isPast = l.level < currentLevel;

                        return (
                            <div key={l.level} className="flex flex-col items-center group">
                                {/* Dot */}
                                <div
                                    className={`h-10 w-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 scale-100 mb-4
                                        ${isCurrent ? 'bg-blue-600 border-blue-200 ring-4 ring-blue-50 shadow-lg scale-110' :
                                            isPast ? 'bg-green-500 border-green-100' : 'bg-white border-gray-100'}
                                    `}
                                >
                                    <span className={`text-sm font-black ${isCurrent || isPast ? 'text-white' : 'text-gray-300'}`}>
                                        {l.level}
                                    </span>
                                </div>

                                {/* Label */}
                                <span className={`text-xs font-black uppercase tracking-tight mb-1 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {l.name}
                                </span>

                                {/* Tooltip (Description) */}
                                <div className="invisible group-hover:visible absolute -top-12 bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl w-40 text-center z-50 transition-all opacity-0 group-hover:opacity-100">
                                    {l.description}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Current Configuration: Level {currentLevel}</span>
                </div>
                <span className="text-[9px] text-gray-400 italic">Target: Level 3 (Guarded Autonomy)</span>
            </div>
        </div>
    );
}
