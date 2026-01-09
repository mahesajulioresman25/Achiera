import React from 'react';
import { ClipboardList, PenTool, Factory, ShieldCheck, Package } from 'lucide-react';

interface WorkflowStep {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const defaultSteps: WorkflowStep[] = [
    {
        icon: <ClipboardList className="w-6 h-6" />,
        title: "Brief & Requirements",
        description: "We discuss your needs, timeline, and budget to recommend the best options."
    },
    {
        icon: <PenTool className="w-6 h-6" />,
        title: "Design & Mockups",
        description: "Our team creates digital mockups showing how your logo will look on each item."
    },
    {
        icon: <Factory className="w-6 h-6" />,
        title: "Production & Finishing",
        description: "We handle sourcing, printing, embroidery, and all finishing techniques."
    },
    {
        icon: <ShieldCheck className="w-6 h-6" />,
        title: "Quality Control",
        description: "Every item is inspected for print quality, stitching, and overall finish."
    },
    {
        icon: <Package className="w-6 h-6" />,
        title: "Packaging & Delivery",
        description: "Items are packed according to your specs and delivered on schedule."
    }
];

interface MiniWorkflowSectionProps {
    steps?: WorkflowStep[];
}

export default function MiniWorkflowSection({ steps = defaultSteps }: MiniWorkflowSectionProps) {
    return (
        <section className="py-16 bg-white border-y border-amber-100">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 mb-4">
                        How We Bring Your Merchandise to Life
                    </h2>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        A transparent, collaborative process from concept to delivery.
                    </p>
                </div>

                {/* Desktop: Horizontal Stepper */}
                <div className="hidden lg:block">
                    <div className="relative">
                        {/* Connection Line */}
                        <div className="absolute top-12 left-0 right-0 h-0.5 bg-amber-200" style={{ marginLeft: '10%', marginRight: '10%' }} />

                        <div className="grid grid-cols-5 gap-4 relative">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center">
                                    {/* Icon Circle */}
                                    <div className="w-24 h-24 rounded-full bg-white border-4 border-amber-500 flex items-center justify-center text-amber-600 mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                        {step.icon}
                                    </div>

                                    {/* Step Number */}
                                    <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </div>

                                    {/* Content */}
                                    <h3 className="font-bold text-stone-900 mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet: Vertical List */}
                <div className="lg:hidden space-y-6">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-600 relative">
                                    {step.icon}
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-2">
                                <h3 className="font-bold text-stone-900 mb-1">
                                    {step.title}
                                </h3>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
