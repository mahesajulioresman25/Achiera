import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface CTASectionProps {
    title?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
}

export default function CTASection({
    title = "Ready to Create Your Custom Merchandise?",
    description = "Let's discuss your project and bring your brand to life with premium merchandise that makes an impact.",
    primaryButtonText = "Request Quotation",
    primaryButtonLink = "/contact",
    secondaryButtonText = "Talk to Our Team",
    secondaryButtonLink = "/contact"
}: CTASectionProps) {
    return (
        <section className="py-20 bg-gradient-to-br from-amber-100 via-amber-50 to-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Title */}
                    <h2 className="text-3xl md:text-5xl font-serif italic text-stone-900 mb-6 leading-tight">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="text-stone-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                        {description}
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {/* Primary Button */}
                        <Link href={primaryButtonLink}>
                            <button className="group inline-flex items-center justify-center px-8 py-4 bg-amber-600 text-white rounded-full font-medium text-lg shadow-lg hover:bg-amber-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
                                {primaryButtonText}
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                        </Link>

                        {/* Secondary Button */}
                        <Link href={secondaryButtonLink}>
                            <button className="group inline-flex items-center justify-center px-8 py-4 bg-white text-amber-600 border-2 border-amber-600 rounded-full font-medium text-lg hover:bg-amber-600 hover:text-white hover:scale-105 transition-all duration-300">
                                <MessageCircle className="mr-2 w-5 h-5" />
                                {secondaryButtonText}
                            </button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 pt-8 border-t border-amber-200">
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-amber-600 mb-1">500+</div>
                                <div className="text-stone-600 text-sm">Projects Delivered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-amber-600 mb-1">10-14</div>
                                <div className="text-stone-600 text-sm">Days Turnaround</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-amber-600 mb-1">100%</div>
                                <div className="text-stone-600 text-sm">Quality Guaranteed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
