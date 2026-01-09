import React from 'react';
import { Package, Box, Gift as GiftIcon, ShoppingBag } from 'lucide-react';

interface PackagingOption {
    icon: React.ReactNode;
    title: string;
    description: string;
    image?: string;
}

const defaultPackagingOptions: PackagingOption[] = [
    {
        icon: <Package className="w-5 h-5" />,
        title: "Standard Polybag",
        description: "Individual polybag packaging for basic protection and hygiene.",
        image: "/images/packaging/polybag.jpg"
    },
    {
        icon: <Box className="w-5 h-5" />,
        title: "Premium Kraft Box",
        description: "Eco-friendly kraft boxes with custom branding options.",
        image: "/images/packaging/kraft-box.jpg"
    },
    {
        icon: <GiftIcon className="w-5 h-5" />,
        title: "Custom Printed Box",
        description: "Fully customized rigid boxes with your brand colors and logo.",
        image: "/images/packaging/custom-box.jpg"
    },
    {
        icon: <ShoppingBag className="w-5 h-5" />,
        title: "Kit Packaging",
        description: "Multi-item packaging for complete merchandise sets.",
        image: "/images/packaging/kit-pack.jpg"
    }
];

interface PackagingOptionsSectionProps {
    options?: PackagingOption[];
}

export default function PackagingOptionsSection({ options = defaultPackagingOptions }: PackagingOptionsSectionProps) {
    return (
        <section className="py-16 bg-amber-50/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 mb-4">
                        Packaging Options
                    </h2>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        Choose the packaging that best suits your needs and budget. All options can be customized with your branding.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {options.map((option, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-amber-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
                        >
                            {/* Image Placeholder */}
                            <div className="h-40 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center overflow-hidden">
                                {option.image ? (
                                    <img
                                        src={option.image}
                                        alt={option.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="text-amber-300 group-hover:scale-110 transition-transform duration-300">
                                        {React.cloneElement(option.icon as React.ReactElement, { className: "w-16 h-16" })}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-amber-600">
                                        {option.icon}
                                    </div>
                                    <h3 className="font-bold text-stone-900">
                                        {option.title}
                                    </h3>
                                </div>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    {option.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
