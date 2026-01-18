'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SubscriptionList from '@/components/commerce/SubscriptionList';
import OrderHistory from '@/components/commerce/OrderHistory';
import WishlistTab from '@/components/commerce/WishlistTab';
import { User, Package, CreditCard, LogOut, Home as HomeIcon, ChevronRight, Settings, Heart, Cake, Sparkles } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function ProfileContent({ user, brandId }: { user: any, brandId?: string }) {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    // Check if current month is user's birth month
    const today = new Date();
    const isBirthMonth = user.birthday && new Date(user.birthday).getMonth() === today.getMonth();
    const isBirthDay = isBirthMonth && new Date(user.birthday).getDate() === today.getDate();

    const tabs = [
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'orders', label: 'Riwayat Hidangan', icon: Package },
        { id: 'wishlist', label: 'Favorit Bunda', icon: Heart },
        { id: 'subscription', label: 'Daftar Langganan', icon: CreditCard },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-[#2D3A2D] font-serif italic">Ruang Pribadi</h1>
                    <p className="text-[#8B7E66] mt-2 font-medium">Selamat datang kembali di rumah, <span className="text-[#2D3A2D] font-bold">{user.name}</span>.</p>
                </header>

                {/* Birthday Celebration Banner */}
                {isBirthMonth && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-[2rem] relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                            <Cake className="w-32 h-32 text-amber-900" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-amber-900 mb-1 flex items-center gap-2">
                                    🎉 {isBirthDay ? 'Selamat Ulang Tahun, Bunda' : 'Bulan Kelahiran Bunda!'}
                                </h3>
                                <p className="text-sm text-amber-800 font-medium">
                                    {isBirthDay
                                        ? 'Semoga harinya hangat dan penuh kebaikan. Sebagai hadiah kecil dari kami, poin akan bertambah dua kali lipat sepanjang bulan ini.'
                                        : 'Dapatkan 2x Poin Loyalty di setiap transaksi selama bulan kelahiran Bunda! 🎁'
                                    }
                                </p>
                            </div>
                            <Link
                                href="/rasa-ibu/loyalty"
                                className="flex-shrink-0 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Lihat Poin Saya
                            </Link>
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-80 flex-shrink-0"
                    >
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(45,58,45,0.05)] border border-[#E5E1D8]/50">
                            <div className="flex flex-col items-center mb-10 text-center">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 bg-[#F9F7F2] rounded-full border-2 border-[#E5E1D8] p-1">
                                        {user.profileImage || user.image ? (
                                            <img
                                                src={user.profileImage || user.image}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#2D3A2D] rounded-full flex items-center justify-center text-white text-3xl font-serif italic font-black shadow-inner">
                                                {user.name?.charAt(0).toUpperCase() || "M"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#8B7E66] rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-[#2D3A2D] truncate w-full px-2">{user.name}</h2>
                                <p className="text-xs font-medium text-[#8B7E66] mt-1">{user.email}</p>
                            </div>

                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const isSettings = tab.id === 'settings';

                                    return (
                                        <Link
                                            key={tab.id}
                                            href={isSettings ? '/rasa-ibu/profile/edit' : `/rasa-ibu/profile?tab=${tab.id}`}
                                        >
                                            <button
                                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isActive
                                                    ? 'bg-[#2D3A2D] text-white shadow-[0_10px_30px_rgba(45,58,45,0.2)] scale-[1.02]'
                                                    : 'text-[#8B7E66] hover:bg-[#F9F7F2] hover:text-[#2D3A2D]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <tab.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : ''}`} />
                                                    {tab.label}
                                                </div>
                                                {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                                            </button>
                                        </Link>
                                    );
                                })}

                                <div className="pt-6 mt-6 border-t border-[#E5E1D8]/50 space-y-2">
                                    <Link href="/rasa-ibu">
                                        <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black text-[#8B7E66] uppercase tracking-widest hover:bg-[#F9F7F2] transition-all">
                                            <HomeIcon className="w-5 h-5" />
                                            Kembali ke Beranda
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/rasa-ibu' })}
                                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Keluar Akun
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </motion.div>

                    {/* Content Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 w-full"
                    >
                        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_30px_80px_rgba(45,58,45,0.08)] border border-[#E5E1D8]/50 min-h-[600px]">
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div>
                                            <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Identitas Bunda</h2>
                                            <p className="text-[#8B7E66] font-medium mt-1">Informasi ini membantu kami menyiapkan dan mengirimkan hidangan dengan lebih baik.</p>
                                        </div>
                                        <Link
                                            href="/rasa-ibu/profile/edit"
                                            className="px-8 py-4 bg-[#8B7E66] hover:bg-[#6D6351] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95"
                                        >
                                            Perbarui Data
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Nama Lengkap</label>
                                            <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]/50 font-bold text-[#2D3A2D] text-lg">
                                                {user.name || '-'}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Email Terdaftar</label>
                                            <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]/50 font-bold text-[#2D3A2D] text-lg truncate">
                                                {user.email || '-'}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Nomor WhatsApp</label>
                                            <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]/50 font-bold text-[#2D3A2D] text-lg">
                                                {user.phone || <span className="text-gray-300 italic font-medium">Belum diisi</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Tanggal Lahir</label>
                                            <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]/50 font-bold text-[#2D3A2D] text-lg flex items-center gap-3">
                                                <Cake className="w-5 h-5 text-amber-500" />
                                                {user.birthday ? new Date(user.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-gray-300 italic font-medium">Belum diisi</span>}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Alamat Utama</label>
                                            <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]/50 font-bold text-[#2D3A2D] leading-relaxed">
                                                {user.address || <span className="text-gray-300 italic font-medium">Belum ada alamat pengiriman</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-16 p-8 rounded-[2rem] bg-[#2D3A2D] text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-serif italic mb-2">Member Loyal Rasa Ibu</h3>
                                            <p className="text-white/60 text-sm max-w-sm">Terima kasih telah menjadi bagian dari keluarga kami. Anda akan mendapatkan kejutan spesial di setiap hari jadi keanggotaan Anda.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-10">
                                        <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Riwayat Kehangatan</h2>
                                        <p className="text-[#8B7E66] font-medium mt-1">Daftar hidangan yang pernah kami antarkan ke meja makan Anda.</p>
                                    </div>
                                    <OrderHistory userId={user.id} />
                                </div>
                            )}

                            {activeTab === 'subscription' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                        <div>
                                            <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Langganan Aktif</h2>
                                            <p className="text-[#8B7E66] font-medium mt-1">Kelola paket harian untuk keluarga tercinta.</p>
                                        </div>
                                        <Link href="/rasa-ibu/subscribe" className="px-6 py-4 border-2 border-[#8B7E66] text-[#8B7E66] hover:bg-[#8B7E66] hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center">
                                            Tambah Paket Baru
                                        </Link>
                                    </div>
                                    <SubscriptionList userId={user.id} />
                                </div>
                            )}

                            {activeTab === 'wishlist' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-10">
                                        <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Favorit Bunda</h2>
                                        <p className="text-[#8B7E66] font-medium mt-1">Daftar menu yang paling Bunda sukai untuk keluarga.</p>
                                    </div>
                                    <WishlistTab brandId={brandId || 'rasa-ibu'} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
