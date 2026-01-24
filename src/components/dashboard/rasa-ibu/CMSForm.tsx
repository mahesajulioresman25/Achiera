'use client';

import React, { useState } from 'react';
import { updateBrandConfigAction } from '@/lib/actions/content/updateBrandConfig';
import { toast } from 'sonner';
import { Save, Globe, Layout, AlignLeft, ShieldCheck, Loader2, Star, ListOrdered, Navigation, Info, Eye, Instagram, Trophy, Utensils } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import ListEditor from '@/components/ui/ListEditor';
import CMSLivePreview from './inventory/CMSLivePreview';
import HeroSliderManager from './HeroSliderManager';

interface CMSFormProps {
    brandId: string;
    initialData: any;
}

export default function CMSForm({ brandId, initialData }: CMSFormProps) {
    const [formData, setFormData] = useState({
        // 1. Hero
        heroTagline: initialData?.heroTagline || 'Hangatnya Meja Makan',
        publicTitle: initialData?.publicTitle || 'Kapanpun Rindu Masakan Ibu.',
        publicSubtitle: initialData?.publicSubtitle || 'Karena kami percaya, rasa terbaik selalu datang dari rumah.',
        heroImage: initialData?.heroImage || '',
        heroCtaPrimary: initialData?.heroCtaPrimary || 'Lihat Menu Kami',
        heroCtaPrimaryLink: initialData?.heroCtaPrimaryLink || '/rasa-ibu/products',
        heroCtaSecondary: initialData?.heroCtaSecondary || 'Cerita Kami',
        heroCtaSecondaryLink: initialData?.heroCtaSecondaryLink || '/rasa-ibu/about',

        // 2. Philosophy
        philosophyTagline: initialData?.philosophyTagline || 'Filosofi Rasa',
        philosophyTitle: initialData?.philosophyTitle || 'Kenapa Memilih Rasa Ibu?',
        philosophyContent: initialData?.philosophyContent || 'Di tengah kesibukan harian...',
        philosophyImage: initialData?.philosophyImage || '',
        aboutImage: initialData?.aboutImage || '',
        philosophyLinkText: initialData?.philosophyLinkText || 'Lanjut Baca',
        philosophyLinkUrl: initialData?.philosophyLinkUrl || '/rasa-ibu/about',

        // 3. Featured
        featuredTagline: initialData?.featuredTagline || 'Menu Terlaris',
        featuredSectionTitle: initialData?.featuredSectionTitle || 'Favorit Keluarga.',
        featuredSectionSubtitle: initialData?.featuredSectionSubtitle || 'Menu Terlaris',

        // 4. Platform
        platformTagline: initialData?.platformTagline || 'Keluarga RASA IBU',
        platformSectionTitle: initialData?.platformSectionTitle || 'Tersedia di Platform Kesukaan Bunda.',
        platformSectionSubtitle: initialData?.platformSectionSubtitle || 'Bisa pesan lewat aplikasi andalan atau langsung di sini.',
        platformLinks: initialData?.platformLinks || {
            shopeeFood: 'https://shopee.co.id/universal-link/now-food/shop/12345',
            grabFood: 'https://r.grab.com/g/fb/12345',
            goFood: 'https://gofood.link/a/12345',
            tokopedia: 'https://www.tokopedia.com/rasaibu'
        },

        // 5. CTA
        ctaTagline: initialData?.ctaTagline || '',
        ctaSectionTitle: initialData?.ctaSectionTitle || 'Siap Menjamu Keluarga Hari Ini?',
        ctaSectionSubtitle: initialData?.ctaSectionSubtitle || 'Pesan sekarang via WhatsApp...',
        ctaButtonText: initialData?.ctaButtonText || 'Pesan via WhatsApp',

        // 6. How To Order (NEW)
        howToOrderHeroTitle: initialData?.howToOrderHeroTitle || 'Mudah & Personal.',
        howToOrderHeroSubtitle: initialData?.howToOrderHeroSubtitle || 'Kami memilih untuk melayani Anda secara personal...',
        howToOrderSteps: initialData?.howToOrderSteps || [
            { step: '01', title: 'Pilih Menu', desc: 'Telusuri katalog produk kami...' },
            { step: '02', title: 'Klik Chat WA', desc: 'Klik tombol WhatsApp di halaman...' },
            { step: '03', title: 'Konfirmasi Stok', desc: 'Assistant kami akan mengonfirmasi...' },
            { step: '04', title: 'Kirim & Nikmati', desc: 'Setelah pembayaran terverifikasi...' }
        ],
        howToOrderInfoTitle: initialData?.howToOrderInfoTitle || 'Penting Untuk Diketahui',
        howToOrderInfoList: initialData?.howToOrderInfoList || [
            'Kualitas masakan kami terjaga karena dikirim dalam keadaan beku (frozen).',
            'Saat ini hanya melayani pengiriman area JABODETABEK...',
            'Pemesanan di atas jam 15:00 akan dikirim keesokan harinya.'
        ],
        howToOrderInfoImage: initialData?.howToOrderInfoImage || '',
        howToOrderCtaTitle: initialData?.howToOrderCtaTitle || 'Mari Hadirkan Kehangatan di Meja Makan Bunda',
        howToOrderCtaPrimary: initialData?.howToOrderCtaPrimary || 'Lihat Menu Cinta Kami',
        howToOrderCtaPrimaryLink: initialData?.howToOrderCtaPrimaryLink || '/rasa-ibu/products',
        howToOrderCtaSecondary: initialData?.howToOrderCtaSecondary || 'Tanya Bunda Soal Pengiriman',

        // 7. About Page
        aboutHeroTitle: initialData?.aboutHeroTitle || 'Berawal dari Kejujuran Dapur.',
        aboutHeroSubtitle: initialData?.aboutHeroSubtitle || 'Tentang Rasa Ibu',
        aboutStoryTitle: initialData?.aboutStoryTitle || 'Kisah Kami',
        aboutStoryContent: initialData?.aboutStoryContent || [
            "Dimulai dari tahun 2022, saat sang pendiri menyadari betapa sulitnya menemukan makanan siap saji yang tidak mengandalkan pengawet dan penyedap rasa berlebih.",
            "Kami percaya bahwa makanan adalah bahasa cinta paling universal. Namun, rasa sayang itu akan hilang jika makanan yang kita sajikan untuk keluarga mengandung bahan-bahan kimia yang tidak kita pahami."
        ],
        aboutStoryImage: initialData?.aboutStoryImage || '',
        aboutValuesTitle: initialData?.aboutValuesTitle || 'Tiga Pilar Kami',
        aboutValuesList: initialData?.aboutValuesList || [
            { title: 'Kualitas Bahan', desc: 'Kami bekerja sama dengan peternak dan petani lokal untuk memastikan setiap potongan daging dan sayur adalah yang terbaik dan tersegar.' },
            { title: 'Higienitas', desc: 'Dapur kami melewati audit kebersihan ketat setiap minggunya. Keamanan pangan bagi keluarga Anda adalah prioritas nomor satu kami.' },
            { title: 'Ketulusan', desc: 'Setiap kemasan Rasa Ibu dibuat dengan doa dan harapan agar meja makan Anda selalu dipenuhi tawa dan kehangatan.' }
        ],
        aboutCtaTitle: initialData?.aboutCtaTitle || 'Ingin Kenal Lebih Dekat?',
        aboutCtaContent: initialData?.aboutCtaContent || 'Kami sangat terbuka untuk mendengar saran, kritik, atau sekadar cerita tentang momen makan malam Anda. Sapa kami di WhatsApp atau media sosial.',
        aboutCtaPrimary: initialData?.aboutCtaPrimary || 'Hubungi Kami',
        aboutCtaPrimaryLink: initialData?.aboutCtaPrimaryLink || '/rasa-ibu/contact',
        aboutCtaSecondary: initialData?.aboutCtaSecondary || 'Lihat Menu',
        aboutCtaSecondaryLink: initialData?.aboutCtaSecondaryLink || '/rasa-ibu/products',

        // 8. Navigation (NEW)
        publicNavLinks: initialData?.publicNavLinks || [
            { label: 'Home', href: '/rasa-ibu' },
            { label: 'Produk', href: '/rasa-ibu/products' },
            { label: 'Cara Pesan', href: '/rasa-ibu/how-to-order' },
            { label: 'Tentang Kami', href: '/rasa-ibu/about' }
        ],

        // 9. Social Media (NEW)
        instagramHandle: initialData?.instagramHandle || '@rasaibu',
        socialLinks: initialData?.socialLinks || {
            instagram: 'https://instagram.com/rasaibu'
        },

        // 10. Trust Badges
        trustBadges: initialData?.trustBadges || [
            { icon: 'shield', title: 'Higiene Terjamin', desc: 'Dapur standar tinggi' },
            { icon: 'leaf', title: 'Tanpa Pengawet', desc: 'Pembekuan cepat' }
        ],

        // 11. Loyalty Education (NEW)
        loyaltyTiers: initialData?.loyaltyTiers || [
            { name: 'BRONZE', spend: 'Member Baru', multiplier: '1.0x Poin', perk: 'Standard Rewards', color: 'bg-[#FDFBF7]' },
            { name: 'SILVER', spend: 'Rp 1 Juta', multiplier: '1.25x Poin', perk: 'Extra 25% Points', color: 'bg-white' },
            { name: 'GOLD', spend: 'Rp 5 Juta', multiplier: '1.5x Poin', perk: 'Extra 50% Points', color: 'bg-yellow-50' },
            { name: 'PLATINUM', spend: 'Rp 10 Juta', multiplier: '2.0x Poin', perk: 'Double Every Point!', color: 'bg-[#2D3A2D]' }
        ],
        loyaltySteps: initialData?.loyaltySteps || [
            { step: '01', title: 'Belanja Enak', desc: 'Setiap pesanan yang lunas akan otomatis menambah poin.' },
            { step: '02', title: 'Kumpulkan Poin', desc: 'Gunakan poin untuk potongan diskon di pesanan berikutnya.' },
            { step: '03', title: 'Nikmati Benefit', desc: 'Makin tinggi tier, makin cepat poin terkumpul.' }
        ],

        // 12. Pricing & Overhead
        defaultOverheadPerUnit: initialData?.defaultOverheadPerUnit || 0,
        targetMonthlyVolume: initialData?.targetMonthlyVolume || 100,

        // 13. Subscription Section (NEW)
        subscriptionTagline: initialData?.subscriptionTagline || 'Paket Rantau',
        subscriptionTitle: initialData?.subscriptionTitle || 'Kehangatan Ibu',
        subscriptionSubtitle: initialData?.subscriptionSubtitle || 'Dikirim Berkala',
        subscriptionDescription: initialData?.subscriptionDescription || 'Tak perlu lagi pusing memikirkan stok lauk di kost atau apartemen. Langganan paket katering beku Rasa Ibu, otomatis dikirim setiap minggu atau bulan.',
        subscriptionBenefits: initialData?.subscriptionBenefits || [
            { title: "Tanpa Ribet", desc: "Cukup daftar sekali, makanan datang rutin sesuai jadwal." },
            { title: "Prioritas Stok", desc: "Stok Anda diamankan lebih dulu, anti kehabisan." },
            { title: "Bayar Dulu, Baru Kirim", desc: "Sistem invoice otomatis, aman dan teratur." }
        ],
        subscriptionButtonText: initialData?.subscriptionButtonText || 'Mulai Berlangganan',
        subscriptionImage: initialData?.subscriptionImage || '',

        // 14. Product List Page (NEW)
        productListHeroTitle: initialData?.productListHeroTitle || 'Hidangan Rumah',
        productListHeroSubtitle: initialData?.productListHeroSubtitle || 'Pesan menu favorit keluarga sekarang via WhatsApp.',
        productListHeroTagline: initialData?.productListHeroTagline || 'Untuk Keluarga',
        productListHeroImage: initialData?.productListHeroImage || '',

        // 15. Recipe List Page (NEW)
        recipeListHeroTitle: initialData?.recipeListHeroTitle || 'Kreasi Rasa Dapur Bunda',
        recipeListHeroSubtitle: initialData?.recipeListHeroSubtitle || 'Temukan inspirasi masakan lezat dari ribuan Ibu hebat lainnya.',
        recipeListHeroTagline: initialData?.recipeListHeroTagline || 'Komunitas Rasa Ibu',
        recipeListHeroImage: initialData?.recipeListHeroImage || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'CONTENT' | 'SLIDER'>('CONTENT');

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateBrandConfigAction(brandId, formData);
        if (res.success) {
            toast.success('Website content updated successfully!');
        } else {
            toast.error('Failed to update content');
        }
        setIsSaving(false);
    };

    const updatePlatformLink = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            platformLinks: { ...prev.platformLinks, [key]: value }
        }));
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Tab Navigation */}
            <div className="flex bg-[#F9F7F2] p-1.5 rounded-[2rem] border border-[#E5E1D8] w-fit">
                <button
                    onClick={() => setActiveTab('CONTENT')}
                    className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CONTENT'
                        ? 'bg-[#2D3A2D] text-white shadow-lg'
                        : 'text-[#8B7E66] hover:bg-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Page Content
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('SLIDER')}
                    className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SLIDER'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'text-[#8B7E66] hover:bg-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Hero Slider
                    </div>
                </button>
            </div>

            {activeTab === 'SLIDER' ? (
                <HeroSliderManager brandId={brandId} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Left Side: Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* 1. Hero Configuration */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-emerald-800">
                                <Layout className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">1. Hero Section</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline (Small Text)</label>
                                    <input type="text" value={formData.heroTagline} onChange={e => setFormData({ ...formData, heroTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Main Headline (H1)</label>
                                    <input
                                        type="text"
                                        value={formData.publicTitle}
                                        onChange={(e) => setFormData({ ...formData, publicTitle: e.target.value })}
                                        className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none font-bold text-lg text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Subtitle</label>
                                    <textarea
                                        value={formData.publicSubtitle}
                                        onChange={(e) => setFormData({ ...formData, publicSubtitle: e.target.value })}
                                        className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none text-[#4A5D4A] h-24 resize-none"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500">Primary Button</label>
                                    <input type="text" placeholder="Text (e.g. Lihat Menu)" value={formData.heroCtaPrimary} onChange={e => setFormData({ ...formData, heroCtaPrimary: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold mb-2" />
                                    <input type="text" placeholder="Link (e.g. /products)" value={formData.heroCtaPrimaryLink} onChange={e => setFormData({ ...formData, heroCtaPrimaryLink: e.target.value })} className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500">Secondary Button</label>
                                    <input type="text" placeholder="Text (e.g. Cerita Kami)" value={formData.heroCtaSecondary} onChange={e => setFormData({ ...formData, heroCtaSecondary: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold mb-2" />
                                    <input type="text" placeholder="Link (e.g. /about)" value={formData.heroCtaSecondaryLink} onChange={e => setFormData({ ...formData, heroCtaSecondaryLink: e.target.value })} className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-mono" />
                                </div>

                                <div className="col-span-full">
                                    <ImageUpload
                                        label="Hero Background Image"
                                        value={formData.heroImage}
                                        onChange={(url) => setFormData({ ...formData, heroImage: url })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Philosophy */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-amber-800">
                                <AlignLeft className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">2. Philosophy & Story</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline</label>
                                    <input type="text" value={formData.philosophyTagline} onChange={(e) => setFormData({ ...formData, philosophyTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Section Title</label>
                                    <input type="text" value={formData.philosophyTitle} onChange={(e) => setFormData({ ...formData, philosophyTitle: e.target.value })} className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Content</label>
                                    <textarea value={formData.philosophyContent} onChange={(e) => setFormData({ ...formData, philosophyContent: e.target.value })} className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none h-32" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Link Text</label>
                                        <input type="text" value={formData.philosophyLinkText} onChange={e => setFormData({ ...formData, philosophyLinkText: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Link URL</label>
                                        <input type="text" value={formData.philosophyLinkUrl} onChange={e => setFormData({ ...formData, philosophyLinkUrl: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none text-xs font-mono" />
                                    </div>
                                </div>
                                <div>
                                    <ImageUpload
                                        label="Philosophy Image (Legacy)"
                                        value={formData.philosophyImage}
                                        onChange={(url) => setFormData({ ...formData, philosophyImage: url })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Note: This is the old field. Use About Image for homepage sync.</p>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <ImageUpload
                                        label="About Image (HOMEPAGE SYNC)"
                                        value={formData.aboutImage}
                                        onChange={(url) => setFormData({ ...formData, aboutImage: url })}
                                    />
                                    <p className="text-[10px] text-amber-600 font-bold mt-1">This image will appear on the homepage "Kenapa Memilih Rasa Ibu" section.</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Featured Section */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-indigo-800">
                                <Star className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">3. Featured Products</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline</label>
                                    <input type="text" value={formData.featuredTagline} onChange={(e) => setFormData({ ...formData, featuredTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Main Heading</label>
                                    <input type="text" value={formData.featuredSectionTitle} onChange={(e) => setFormData({ ...formData, featuredSectionTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Platform Links */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-blue-800">
                                <Globe className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">4. Platform Links</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline</label>
                                    <input type="text" value={formData.platformTagline} onChange={(e) => setFormData({ ...formData, platformTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Heading</label>
                                        <input type="text" value={formData.platformSectionTitle} onChange={(e) => setFormData({ ...formData, platformSectionTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Subtitle</label>
                                        <input type="text" value={formData.platformSectionSubtitle} onChange={(e) => setFormData({ ...formData, platformSectionSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                    </div>
                                </div>
                                {/* Links loop */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    {['shopeeFood', 'grabFood', 'goFood', 'tokopedia', 'shopee', 'tiktok', 'grabMart'].map((platform) => (
                                        <div key={platform}>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                                {platform === 'shopeeFood' ? 'Shopee Food' :
                                                    platform === 'grabFood' ? 'GrabFood' :
                                                        platform === 'goFood' ? 'GoFood' :
                                                            platform === 'tokopedia' ? 'Tokopedia' :
                                                                platform === 'shopee' ? 'Shopee (Ecommerce)' :
                                                                    platform === 'tiktok' ? 'TikTok Shop' :
                                                                        platform === 'grabMart' ? 'GrabMart' : platform} URL
                                            </label>
                                            <input
                                                type="text"
                                                value={(formData.platformLinks as any)?.[platform] || ''}
                                                onChange={e => updatePlatformLink(platform, e.target.value)}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                                                placeholder={`https://${platform}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. Final CTA */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-green-800">
                                <Layout className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">5. Call To Action</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline</label>
                                    <input type="text" value={formData.ctaTagline} onChange={(e) => setFormData({ ...formData, ctaTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">CTA Title</label>
                                    <input type="text" value={formData.ctaSectionTitle} onChange={(e) => setFormData({ ...formData, ctaSectionTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">CTA Description</label>
                                    <input type="text" value={formData.ctaSectionSubtitle} onChange={(e) => setFormData({ ...formData, ctaSectionSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">WhatsApp Button Text</label>
                                    <input type="text" value={formData.ctaButtonText} onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold text-green-700" />
                                </div>
                            </div>
                        </div>

                        {/* 6. How To Order (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-[#8B7E66]">
                                <ListOrdered className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">6. How To Order Page</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Page Title</label>
                                    <input type="text" value={formData.howToOrderHeroTitle} onChange={(e) => setFormData({ ...formData, howToOrderHeroTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Page Description</label>
                                    <textarea value={formData.howToOrderHeroSubtitle} onChange={(e) => setFormData({ ...formData, howToOrderHeroSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none h-24" />
                                </div>
                            </div>

                            <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                                <ListEditor
                                    label="Order Steps (01-04)"
                                    items={formData.howToOrderSteps || []}
                                    onChange={(items) => setFormData({ ...formData, howToOrderSteps: items })}
                                    getNewItem={() => ({ step: '01', title: 'New Step', desc: 'Description' })}
                                    renderItem={(item, index, onChange) => (
                                        <div className="grid grid-cols-12 gap-2 w-full">
                                            <input placeholder="01" value={item.step} onChange={(e) => onChange({ ...item, step: e.target.value })} className="col-span-2 p-2 rounded border border-gray-200 text-center font-bold" />
                                            <input placeholder="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} className="col-span-4 p-2 rounded border border-gray-200 font-bold" />
                                            <input placeholder="Description" value={item.desc} onChange={(e) => onChange({ ...item, desc: e.target.value })} className="col-span-6 p-2 rounded border border-gray-200 text-sm" />
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 mb-8 border-t border-gray-100 pt-8">
                                <h3 className="font-bold text-lg text-gray-400">Important Info Card</h3>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Info Title</label>
                                    <input type="text" value={formData.howToOrderInfoTitle} onChange={(e) => setFormData({ ...formData, howToOrderInfoTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>

                                <ListEditor
                                    label="Info Bullet Points"
                                    items={formData.howToOrderInfoList || []}
                                    onChange={(items) => setFormData({ ...formData, howToOrderInfoList: items })}
                                    getNewItem={() => "New Point"}
                                    renderItem={(item, index, onChange) => (
                                        <input value={item} onChange={(e) => onChange(e.target.value)} className="w-full p-2 rounded border border-gray-200" />
                                    )}
                                />

                                <div>
                                    <ImageUpload label="Info Card Image" value={formData.howToOrderInfoImage} onChange={(url) => setFormData({ ...formData, howToOrderInfoImage: url })} />
                                </div>
                            </div>
                        </div>

                        {/* 7. About Page */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-gray-800">
                                <Info className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">7. About Page</h2>
                            </div>

                            {/* Hero Section */}
                            <div className="space-y-4 border-b pb-6 border-dashed border-gray-200">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-[#8B7E66] rounded-full"></span>
                                    Hero Section
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Title</label>
                                        <input
                                            name="aboutHeroTitle"
                                            value={formData.aboutHeroTitle || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutHeroTitle: e.target.value })}
                                            placeholder="e.g. Berawal dari Kejujuran Dapur."
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Subtitle</label>
                                        <input
                                            name="aboutHeroSubtitle"
                                            value={formData.aboutHeroSubtitle || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutHeroSubtitle: e.target.value })}
                                            placeholder="e.g. Tentang Rasa Ibu"
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Story Section */}
                            <div className="space-y-4 border-b pb-6 border-dashed border-gray-200 mt-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-[#8B7E66] rounded-full"></span>
                                    Our Story
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Story Title</label>
                                            <input
                                                name="aboutStoryTitle"
                                                value={formData.aboutStoryTitle || ""}
                                                onChange={(e) => setFormData({ ...formData, aboutStoryTitle: e.target.value })}
                                                placeholder="e.g. Kisah Kami"
                                                className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <ListEditor
                                                label="Story Content (Paragraphs)"
                                                items={formData.aboutStoryContent as string[] || []}
                                                onChange={(items) => setFormData({ ...formData, aboutStoryContent: items as string[] })}
                                                getNewItem={() => "New Paragraph"}
                                                renderItem={(item, index, onChange) => (
                                                    <textarea
                                                        value={item as string}
                                                        onChange={(e) => onChange(e.target.value)}
                                                        className="w-full p-2 rounded border border-gray-200 text-sm h-24"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <ImageUpload
                                            label="Story Image"
                                            value={formData.aboutStoryImage}
                                            onChange={(url) => setFormData({ ...formData, aboutStoryImage: url })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Values Section */}
                            <div className="space-y-4 border-b pb-6 border-dashed border-gray-200 mt-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-[#8B7E66] rounded-full"></span>
                                    Our Values (Pillars)
                                </h3>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Section Title</label>
                                    <input
                                        name="aboutValuesTitle"
                                        value={formData.aboutValuesTitle || ""}
                                        onChange={(e) => setFormData({ ...formData, aboutValuesTitle: e.target.value })}
                                        placeholder="e.g. Tiga Pilar Kami"
                                        className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <ListEditor
                                        label="Values List"
                                        items={formData.aboutValuesList as any[] || []}
                                        onChange={(items) => setFormData({ ...formData, aboutValuesList: items })}
                                        getNewItem={() => ({ title: 'New Value', desc: 'Description' })}
                                        renderItem={(item: any, index, onChange) => (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                                <input
                                                    placeholder="Title (e.g. Kualitas)"
                                                    value={item.title}
                                                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                                                    className="p-2 rounded border border-gray-200 font-bold"
                                                />
                                                <textarea
                                                    placeholder="Description"
                                                    value={item.desc}
                                                    onChange={(e) => onChange({ ...item, desc: e.target.value })}
                                                    className="p-2 rounded border border-gray-200 text-xs h-20"
                                                />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="space-y-4 mt-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-[#8B7E66] rounded-full"></span>
                                    Call to Action
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">CTA Title</label>
                                        <input
                                            name="aboutCtaTitle"
                                            value={formData.aboutCtaTitle || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaTitle: e.target.value })}
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">CTA Content</label>
                                        <textarea
                                            name="aboutCtaContent"
                                            value={formData.aboutCtaContent || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaContent: e.target.value })}
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none h-24"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Primary Button Text</label>
                                        <input
                                            name="aboutCtaPrimary"
                                            value={formData.aboutCtaPrimary || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaPrimary: e.target.value })}
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Primary Button Link</label>
                                        <input
                                            name="aboutCtaPrimaryLink"
                                            value={formData.aboutCtaPrimaryLink || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaPrimaryLink: e.target.value })}
                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Secondary Button Text</label>
                                        <input
                                            name="aboutCtaSecondary"
                                            value={formData.aboutCtaSecondary || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaSecondary: e.target.value })}
                                            className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Secondary Button Link</label>
                                        <input
                                            name="aboutCtaSecondaryLink"
                                            value={formData.aboutCtaSecondaryLink || ""}
                                            onChange={(e) => setFormData({ ...formData, aboutCtaSecondaryLink: e.target.value })}
                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 8. Navigation & Trust */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-gray-800">
                                <Navigation className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">8. Navigation & Trust</h2>
                            </div>

                            <div className="mb-8">
                                <ListEditor
                                    label="Public Nav Links"
                                    items={formData.publicNavLinks || []}
                                    onChange={(items) => setFormData({ ...formData, publicNavLinks: items })}
                                    getNewItem={() => ({ label: 'New Link', href: '#' })}
                                    renderItem={(item, index, onChange) => (
                                        <div className="flex gap-2 w-full">
                                            <input placeholder="Label" value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} className="flex-1 p-2 rounded border border-gray-200 font-bold" />
                                            <input placeholder="URL" value={item.href} onChange={(e) => onChange({ ...item, href: e.target.value })} className="flex-1 p-2 rounded border border-gray-200 font-mono text-sm" />
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <ListEditor
                                    label="Trust Badges"
                                    items={formData.trustBadges || []}
                                    onChange={(items) => setFormData({ ...formData, trustBadges: items })}
                                    getNewItem={() => ({ icon: 'shield', title: 'Badge', desc: 'Description' })}
                                    renderItem={(item, index, onChange) => (
                                        <div className="flex gap-2 w-full">
                                            <input placeholder="Icon" value={item.icon} onChange={(e) => onChange({ ...item, icon: e.target.value })} className="w-20 p-2 rounded border border-gray-200 font-mono text-xs" />
                                            <input placeholder="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} className="flex-1 p-2 rounded border border-gray-200 font-bold" />
                                            <input placeholder="Desc" value={item.desc} onChange={(e) => onChange({ ...item, desc: e.target.value })} className="flex-1 p-2 rounded border border-gray-200 text-sm" />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>


                        {/* 9. Social Media (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-pink-700">
                                <Instagram className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">9. Social Media</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Instagram Handle</label>
                                    <input
                                        type="text"
                                        value={formData.instagramHandle}
                                        onChange={e => setFormData({ ...formData, instagramHandle: e.target.value })}
                                        placeholder="@rasaibu"
                                        className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none font-bold text-[#2D3A2D] focus:ring-2 focus:ring-pink-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Instagram URL</label>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.instagram || ''}
                                        onChange={e => setFormData({
                                            ...formData,
                                            socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                        })}
                                        placeholder="https://instagram.com/..."
                                        className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none font-bold text-[#2D3A2D] focus:ring-2 focus:ring-pink-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 10. Loyalty Education (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-amber-600">
                                <Trophy className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">10. Loyalty Education Page</h2>
                            </div>

                            <div className="space-y-8">
                                <ListEditor
                                    label="Loyalty Tier Comparison Card"
                                    items={formData.loyaltyTiers || []}
                                    onChange={(items) => setFormData({ ...formData, loyaltyTiers: items })}
                                    getNewItem={() => ({ name: 'NEW', spend: 'Rp 1 Juta', multiplier: '1x Poin', perk: 'New Perk', color: 'bg-white' })}
                                    renderItem={(item, index, onChange) => (
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <input placeholder="Name (e.g. BRONZE)" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} className="p-2 rounded border border-gray-200 font-black text-xs" />
                                            <input placeholder="Min Spend (e.g. Rp 1 Juta)" value={item.spend} onChange={(e) => onChange({ ...item, spend: e.target.value })} className="p-2 rounded border border-gray-200 font-bold text-xs" />
                                            <input placeholder="Multiplier (e.g. 1.25x Poin)" value={item.multiplier} onChange={(e) => onChange({ ...item, multiplier: e.target.value })} className="p-2 rounded border border-gray-200 font-bold text-xs" />
                                            <input placeholder="Perk Description" value={item.perk} onChange={(e) => onChange({ ...item, perk: e.target.value })} className="p-2 rounded border border-gray-200 text-xs" />
                                        </div>
                                    )}
                                />

                                <div className="pt-8 border-t border-gray-100">
                                    <ListEditor
                                        label="How It Works Steps (01-03)"
                                        items={formData.loyaltySteps || []}
                                        onChange={(items) => setFormData({ ...formData, loyaltySteps: items })}
                                        getNewItem={() => ({ step: '01', title: 'New Step', desc: 'Description' })}
                                        renderItem={(item, index, onChange) => (
                                            <div className="grid grid-cols-12 gap-2 w-full">
                                                <input placeholder="01" value={item.step} onChange={(e) => onChange({ ...item, step: e.target.value })} className="col-span-2 p-2 rounded border border-gray-200 text-center font-bold" />
                                                <input placeholder="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} className="col-span-4 p-2 rounded border border-gray-200 font-bold" />
                                                <input placeholder="Description" value={item.desc} onChange={(e) => onChange({ ...item, desc: e.target.value })} className="col-span-6 p-2 rounded border border-gray-200 text-sm" />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 11. Subscription Section Configuration (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-emerald-800">
                                <Layout className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">11. Subscription Section</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline</label>
                                    <input type="text" value={formData.subscriptionTagline} onChange={e => setFormData({ ...formData, subscriptionTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Main Title</label>
                                    <input type="text" value={formData.subscriptionTitle} onChange={e => setFormData({ ...formData, subscriptionTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Subtitle (Italic)</label>
                                    <input type="text" value={formData.subscriptionSubtitle} onChange={e => setFormData({ ...formData, subscriptionSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold italic" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
                                    <textarea value={formData.subscriptionDescription} onChange={e => setFormData({ ...formData, subscriptionDescription: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none h-24" />
                                </div>
                                <div>
                                    <ListEditor
                                        label="Benefits (3 Icons)"
                                        items={formData.subscriptionBenefits || []}
                                        onChange={(items) => setFormData({ ...formData, subscriptionBenefits: items })}
                                        getNewItem={() => ({ title: 'New Benefit', desc: 'Benefit Description' })}
                                        renderItem={(item, index, onChange) => (
                                            <div className="flex gap-2 w-full">
                                                <input placeholder="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} className="flex-1 p-2 rounded border border-gray-200 font-bold" />
                                                <input placeholder="Description" value={item.desc} onChange={(e) => onChange({ ...item, desc: e.target.value })} className="flex-[2] p-2 rounded border border-gray-200" />
                                            </div>
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Button Text</label>
                                    <input type="text" value={formData.subscriptionButtonText} onChange={e => setFormData({ ...formData, subscriptionButtonText: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold" />
                                </div>
                                <div>
                                    <ImageUpload
                                        label="Subscription Promo Image"
                                        value={formData.subscriptionImage}
                                        onChange={(url) => setFormData({ ...formData, subscriptionImage: url })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 12. Product List Page Configuration (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-orange-800">
                                <ListOrdered className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">12. Product List Page</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline (Over Highlighted)</label>
                                    <input type="text" value={formData.productListHeroTagline} onChange={e => setFormData({ ...formData, productListHeroTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Title</label>
                                    <input type="text" value={formData.productListHeroTitle} onChange={e => setFormData({ ...formData, productListHeroTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-black text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Subtitle</label>
                                    <textarea value={formData.productListHeroSubtitle} onChange={e => setFormData({ ...formData, productListHeroSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none h-20" />
                                </div>
                                <div>
                                    <ImageUpload
                                        label="Product Page Hero Background"
                                        value={formData.productListHeroImage}
                                        onChange={(url) => setFormData({ ...formData, productListHeroImage: url })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 13. Recipe List Page Configuration (NEW) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                            <div className="flex items-center gap-4 mb-6 text-emerald-800">
                                <Utensils className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">13. Recipe List Page</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tagline (Over Highlighted)</label>
                                    <input type="text" value={formData.recipeListHeroTagline} onChange={e => setFormData({ ...formData, recipeListHeroTagline: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-bold tracking-widest text-[#8B7E66]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Title</label>
                                    <input type="text" value={formData.recipeListHeroTitle} onChange={e => setFormData({ ...formData, recipeListHeroTitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none font-black text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hero Subtitle</label>
                                    <textarea value={formData.recipeListHeroSubtitle} onChange={e => setFormData({ ...formData, recipeListHeroSubtitle: e.target.value })} className="w-full p-3 bg-[#F9F7F2] rounded-xl border-none h-20" />
                                </div>
                                <div>
                                    <ImageUpload
                                        label="Recipe Page Hero Background"
                                        value={formData.recipeListHeroImage}
                                        onChange={(url) => setFormData({ ...formData, recipeListHeroImage: url })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 sticky bottom-8 p-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl z-50">
                            <button
                                onClick={() => window.open('/rasa-ibu', '_blank')}
                                className="px-6 py-3 bg-white border border-[#E5E1D8] text-[#2D3A2D] rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50"
                            >
                                <Globe className="w-4 h-4" />
                                View Public Site
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-3 bg-[#2D3A2D] text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Live Preview */}
                    <div className="lg:col-span-2 hidden lg:block">
                        <div className="sticky top-8">
                            <div className="mb-6 flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E5E1D8] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Eye className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1A241A]">Content Preview</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sinkronisasi Instan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">LIVE</span>
                                </div>
                            </div>
                            <CMSLivePreview data={formData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
