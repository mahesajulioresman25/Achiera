'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const defaultFAQs: FAQItem[] = [
    {
        question: "What is the minimum order quantity?",
        answer: "MOQ varies by item type. For custom apparel, it's typically 50-100 pieces. For drinkware and bags, it's usually 100 pieces. We also have stock options for smaller runs."
    },
    {
        question: "How long is the production lead time?",
        answer: "Standard turnaround is 10-14 business days after design approval. Rush orders are available with a 7-day turnaround for an additional fee."
    },
    {
        question: "Can we request a sample before placing a bulk order?",
        answer: "Yes! We can provide pre-production samples for your approval. Sample fees are typically waived when you proceed with the full order."
    },
    {
        question: "Can we mix sizes or colors in one order?",
        answer: "Absolutely. You can mix sizes and colors within the same order as long as the design remains consistent. This is perfect for team orders."
    },
    {
        question: "Do you provide custom packaging?",
        answer: "Yes, we offer various packaging options from standard polybags to premium custom-printed boxes. Packaging can be branded with your logo."
    },
    {
        question: "What is the revision policy on designs?",
        answer: "We include up to 2 rounds of design revisions in our standard service. Additional revisions can be accommodated for a small fee."
    }
];

interface FAQSectionProps {
    faqs?: FAQItem[];
}

export default function FAQSection({ faqs = defaultFAQs }: FAQSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 bg-amber-50/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-stone-600">
                            Everything you need to know about ordering custom merchandise.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white border border-amber-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
                            >
                                <button
                                    onClick={() => toggleFAQ(idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors duration-200"
                                >
                                    <span className="font-bold text-stone-900 pr-4">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-amber-600 flex-shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openIndex === idx ? 'max-h-96' : 'max-h-0'
                                        }`}
                                >
                                    <div className="px-6 pb-5 pt-2">
                                        <p className="text-stone-600 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div className="mt-8 text-center">
                        <p className="text-stone-600 mb-4">
                            Still have questions?
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center text-amber-600 font-medium hover:text-amber-700 transition-colors"
                        >
                            Contact our team →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
