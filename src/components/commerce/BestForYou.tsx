'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProductsByIdsAction } from '@/lib/actions/rasa-ibu/public-products';

interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
}

interface BestForYouProps {
    brandId: string;
}

export default function BestForYou({ brandId }: BestForYouProps) {
    const [history, setHistory] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const productIds = JSON.parse(localStorage.getItem('rasa_ibu_history') || '[]');
                // Only show if Bunda has seen at least 2 items
                if (productIds.length < 2) {
                    setLoading(false);
                    return;
                }

                // Get first 4 items from history
                const targetIds = productIds.slice(0, 4);
                const res = await getProductsByIdsAction(brandId, targetIds);

                if (res.success && res.data) {
                    setHistory(res.data as any);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    if (loading || history.length === 0) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98]
            }
        }
    };

    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={container}
            className="mb-24 space-y-10"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ rotate: -15, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        className="w-12 h-12 bg-amber-100 rounded-[1.25rem] flex items-center justify-center text-amber-600 shadow-sm"
                    >
                        <Sparkles className="w-6 h-6 fill-current" />
                    </motion.div>
                    <div>
                        <h2 className="text-2xl font-black text-[#1A241A] tracking-tight">Terbaik Untuk Bunda</h2>
                        <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.2em] opacity-60">Saran menu favorit yang sesuai selera Bunda</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {history.map((product) => (
                    <motion.div key={product.id} variants={item}>
                        <Link
                            href={`/rasa-ibu/products/${product.slug}`}
                            className="group space-y-4 block"
                        >
                            <div className="aspect-[4/5] bg-[#F9F7F2] rounded-[2.5rem] overflow-hidden relative shadow-sm group-hover:shadow-2xl group-hover:shadow-amber-900/10 transition-all duration-500">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center italic text-gray-300 text-xs">
                                        [Foto {product.name}]
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <div className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 shadow-xl border border-white">
                                        <Heart className="w-4 h-4 fill-current" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-2">
                                <h3 className="font-black text-[#1A241A] text-sm group-hover:text-[#8B7E66] transition-colors line-clamp-1">{product.name}</h3>
                                <p className="text-xs font-black text-amber-600">Rp {product.price.toLocaleString('id-ID')}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
