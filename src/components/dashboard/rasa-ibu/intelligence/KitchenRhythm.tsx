import React from 'react';

export default function KitchenRhythm({ rhythm }: { rhythm: { averagePrepTimeMinutes: number; tempoLabel: string } }) {
    const isBusy = rhythm.tempoLabel === 'SIBUK';
    const isNormal = rhythm.tempoLabel === 'NORMAL';

    return (
        <div className="bg-[#FDFBF7] border border-[#E5E1D8] p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66]">Tempo Pemenuhan Dapur</h3>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase ${isBusy ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {rhythm.tempoLabel === 'TENANG' ? 'Hening & Teratur' : rhythm.tempoLabel === 'NORMAL' ? 'Ritme Mengalir' : 'Dapur Bersemangat'}
                    </span>
                    <div className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBusy ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </div>
                </div>
            </div>

            <div className="flex items-end gap-1 h-12">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all duration-1000 ${isBusy ? 'bg-amber-200' : 'bg-emerald-100'
                            }`}
                        style={{
                            height: `${20 + Math.random() * (isBusy ? 80 : 40)}%`,
                            opacity: 0.3 + (i / 12) * 0.7
                        }}
                    ></div>
                ))}
            </div>

            <div className="pt-2">
                <p className="text-[9px] font-medium text-slate-400 italic">
                    "Ritme saat ini rata-rata {rhythm.averagePrepTimeMinutes} menit per hidangan. Semuanya terkendali."
                </p>
            </div>
        </div>
    );
}
