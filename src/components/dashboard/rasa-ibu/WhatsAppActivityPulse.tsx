import React from 'react';

export default function WhatsAppActivityPulse({ activities }: { activities: any[] }) {
    return (
        <div suppressHydrationWarning className="bg-white border border-[#E5E1D8] rounded-[3rem] overflow-hidden shadow-sm shadow-stone-200/50 h-full flex flex-col">
            <div className="px-10 py-8 border-b border-[#F9F7F2] bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <span className="text-sm">💬</span>
                    </div>
                    <h3 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest leading-none">WhatsApp Pulse</h3>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Active Live</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
            </div>

            <div className="divide-y divide-slate-50 overflow-y-auto">
                {activities.map((activity, index) => (
                    <div key={index} className="px-10 py-6 flex items-start gap-4 hover:bg-[#FDFBF7] transition-all group/activity">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm group-hover/activity:scale-110 transition-transform ${activity.type === 'CHAT_STARTED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-stone-50 text-[#8B7E66] border border-[#E5E1D8]'
                            }`}>
                            {activity.customerName ? activity.customerName.charAt(0) : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="text-sm font-black text-[#1A241A] truncate">{activity.customerName || 'Anonymous'}</p>
                                <span className="text-[10px] font-bold text-[#8B7E66]">{activity.timeAgo}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                {activity.type === 'CHAT_STARTED' ? 'Sedang menunggu rincian pesanan dari dapur.' : 'Dilayani dengan ❤️ oleh ' + activity.assistantName}
                            </p>
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="px-6 py-12 text-center text-slate-300 italic text-xs">
                        Belum ada aktifitas chat terekam.
                    </div>
                )}
            </div>

            <div className="p-4 bg-[#FDFBF7] border-t border-[#E5E1D8] mt-auto">
                <p className="text-[9px] text-[#8B7E66] text-center font-medium italic">
                    Ethical Pulse: Sistem mencatat waktu untuk menjaga kepuasan Bunda, bukan untuk performansi asisten.
                </p>
            </div>
        </div>
    );
}
