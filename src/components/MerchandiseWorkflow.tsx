'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, PenTool, Factory, Truck } from 'lucide-react';

interface Step {
    id: string;
    title: string;
    short: string;
    long: string;
    activities: string[];
    deliverables: string[];
    icon: React.ReactNode;
}

const steps: Step[] = [
    {
        id: 'brief',
        title: 'Brief & Goals',
        short: 'Understanding your brand, audience, and merchandise objectives.',
        long: 'In the brief phase we align on the story behind your brand and what you want the merchandise to achieve—whether it’s for onboarding, events, client gifting, or internal culture. This is where we clarify quantities, timelines, and budget ranges so we can recommend the right options.',
        activities: [
            'Brand & audience discussion',
            'Clarifying event type / usage scenario',
            'Quantity, timeline, and budget alignment',
            'Initial product recommendations (tote bag, tumbler, apparel, bags, etc.)'
        ],
        deliverables: [
            'Merchandise brief summary',
            'Recommended product list & directions',
            'Initial timeline and rough cost range'
        ],
        icon: <ClipboardList className="w-6 h-6" />
    },
    {
        id: 'design',
        title: 'Design & Mockups',
        short: 'Translating the brief into concrete designs and digital previews.',
        long: 'Our design team prepares layouts, color applications, and placement for your logo and messages across different items. You’ll see how the tote bags, tumblers, t-shirts, and bags will look before anything goes into production.',
        activities: [
            'Artwork preparation & logo placement',
            'Color & material suggestions',
            'Digital mockups for each selected item',
            'Iteration based on your feedback'
        ],
        deliverables: [
            'Finalized artwork files',
            'Mockups per product type',
            'Design approval for production'
        ],
        icon: <PenTool className="w-6 h-6" />
    },
    {
        id: 'production',
        title: 'Production & Finishing',
        short: 'Moving approved designs into consistent, scalable production.',
        long: 'We handle the full production process—from sourcing materials to printing, embroidery, or other finishing techniques. The goal is to achieve consistent quality across all items, whether you order tens or thousands of pieces.',
        activities: [
            'Material sourcing and preparation',
            'Printing, embroidery, or other finishing techniques',
            'Color and print consistency checks',
            'Coordination of production schedule'
        ],
        deliverables: [
            'Produced merchandise (in-progress & final)',
            'Production status updates',
            'Photos / samples upon request'
        ],
        icon: <Factory className="w-6 h-6" />
    },
    {
        id: 'delivery',
        title: 'Quality Check & Delivery',
        short: 'Inspecting, packing, and shipping your merchandise on time.',
        long: 'Before anything leaves our workshop, we check the print, stitching, colors, and basic functionality. Each item is packed based on your needs—bulk, per set, or custom packaging—then shipped on the agreed schedule.',
        activities: [
            'Visual and functional quality inspection',
            'Sorting & packaging per requirement (kit / bulk)',
            'Final quantity verification',
            'Coordination with logistics / delivery'
        ],
        deliverables: [
            'Ready-to-distribute merchandise',
            'Packing list & quantity confirmation',
            'Shipping / tracking information'
        ],
        icon: <Truck className="w-6 h-6" />
    }
];

export default function MerchandiseWorkflow() {
    const [activeStepId, setActiveStepId] = useState<string>(steps[0].id);
    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

    return (
        <section className="relative py-24 bg-amber-50/70 border-t border-amber-100/60 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="mb-16 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-serif italic text-amber-950 mb-4">
                        From Brief to Delivery
                    </h2>
                    <p className="text-amber-800/80 text-lg max-w-2xl">
                        A collaborative journey to create merchandise that perfectly represents your brand.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Steps List */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStepId(step.id)}
                                className={`group text-left p-6 rounded-xl border transition-all duration-300 relative overflow-hidden ${activeStepId === step.id
                                        ? 'border-amber-500/70 bg-white shadow-lg shadow-amber-200'
                                        : 'border-amber-200 bg-amber-50 hover:bg-white hover:border-amber-300'
                                    }`}
                            >
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`mt-1 p-2 rounded-lg transition-colors duration-300 ${activeStepId === step.id ? 'bg-amber-100 text-amber-700' : 'bg-amber-100/50 text-amber-600 group-hover:text-amber-700'
                                        }`}>
                                        {step.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold mb-1 transition-colors ${activeStepId === step.id ? 'text-amber-950' : 'text-amber-900/80 group-hover:text-amber-950'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-amber-800/70 leading-relaxed mb-3">
                                            {step.short}
                                        </p>
                                        <div className={`flex items-center text-xs font-bold uppercase tracking-wider transition-all ${activeStepId === step.id ? 'text-amber-600 translate-x-0' : 'text-amber-500 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                            }`}>
                                            Learn more <ArrowRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Indicator Line */}
                                {activeStepId === step.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right Column: Detail Panel */}
                    <div className="lg:col-span-7">
                        <div className="h-full rounded-2xl border border-amber-200 bg-white p-8 md:p-10 relative overflow-hidden shadow-sm">
                            {/* Animated Background Line */}
                            <div className="absolute left-[-50%] top-0 h-px w-[200%] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-[line-flow_12s_linear_infinite]" />
                            <div className="absolute left-[-50%] bottom-0 h-px w-[200%] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-[line-flow_18s_linear_infinite_reverse]" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider border border-amber-200">
                                        Step {steps.findIndex(s => s.id === activeStepId) + 1}
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-bold text-amber-950">
                                        {activeStep.title}
                                    </h3>
                                </div>

                                <p className="text-amber-900/80 text-lg leading-relaxed mb-10 border-b border-amber-100 pb-8">
                                    {activeStep.long}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wider mb-4 flex items-center">
                                            <ClipboardList className="w-4 h-4 mr-2 text-amber-600" /> Key Activities
                                        </h4>
                                        <ul className="space-y-3">
                                            {activeStep.activities.map((activity, idx) => (
                                                <li key={idx} className="flex items-start text-amber-800/80 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3 shrink-0" />
                                                    {activity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wider mb-4 flex items-center">
                                            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" /> Deliverables
                                        </h4>
                                        <ul className="space-y-3">
                                            {activeStep.deliverables.map((item, idx) => (
                                                <li key={idx} className="flex items-start text-amber-800/80 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600/60 mt-1.5 mr-3 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
