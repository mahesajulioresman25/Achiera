import Link from 'next/link';
import { ArrowRight, Package, Code, Sparkles } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 py-20 md:py-32">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 mb-6">
                            Transforming Problems Into <span className="text-amber-600">Possibilities</span>
                        </h1>
                        <p className="text-xl text-stone-600 mb-8 leading-relaxed">
                            ACHIERA is your business and technology partner, helping companies turn challenges into opportunities through premium merchandise and integrated IT solutions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/merchandise"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                            >
                                Explore Merchandise
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/it-solutions"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-stone-300 text-stone-900 rounded-lg hover:border-amber-600 hover:text-amber-600 transition-colors font-medium"
                            >
                                IT Solutions
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
                            What We Offer
                        </h2>
                        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                            Two powerful solutions to elevate your business
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Merchandise Card */}
                        <Link
                            href="/merchandise"
                            className="group p-8 border-2 border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-xl transition-all"
                        >
                            <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors">
                                <Package className="w-8 h-8 text-amber-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900 mb-4">
                                Premium Merchandise
                            </h3>
                            <p className="text-stone-600 mb-6">
                                High-quality, functional products crafted to reflect your brand identity—from onboarding kits to event merchandise.
                            </p>
                            <div className="flex items-center gap-2 text-amber-600 font-medium group-hover:gap-3 transition-all">
                                Learn More
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </Link>

                        {/* IT Solutions Card */}
                        <Link
                            href="/it-solutions"
                            className="group p-8 border-2 border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-xl transition-all"
                        >
                            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                                <Code className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900 mb-4">
                                IT Solutions
                            </h3>
                            <p className="text-stone-600 mb-6">
                                Enterprise software development, cloud infrastructure, and digital transformation solutions that drive business growth.
                            </p>
                            <div className="flex items-center gap-2 text-amber-600 font-medium group-hover:gap-3 transition-all">
                                Learn More
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-amber-600 to-amber-700">
                <div className="container mx-auto px-6 text-center">
                    <Sparkles className="w-12 h-12 text-amber-200 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Business?
                    </h2>
                    <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
                        Let's discuss how ACHIERA can help you turn challenges into opportunities.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-medium"
                    >
                        Get in Touch
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
