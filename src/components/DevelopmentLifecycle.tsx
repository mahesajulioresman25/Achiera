'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers, Search, Code2, Rocket } from 'lucide-react';

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
        id: 'discovery',
        title: 'Discovery',
        short: 'Requirements gathering & technical feasibility analysis.',
        long: 'During the discovery phase we align on goals, constraints, and success metrics. We translate business problems into clear technical requirements so that everyone knows what we\'re building and why.',
        activities: [
            'Stakeholder interviews & current system review',
            'Requirements gathering & gap analysis',
            'Risk & feasibility assessment',
            'High-level solution options & trade-offs'
        ],
        deliverables: [
            'Requirement summary',
            'Initial scope & priority list',
            'High-level timeline & effort estimate'
        ],
        icon: <Search className="w-6 h-6" />
    },
    {
        id: 'architecture',
        title: 'Architecture',
        short: 'System design, stack selection & roadmap planning.',
        long: 'In the architecture phase we design how the solution will be structured—from technology stack and integrations to data flows and security. The goal is to ensure the system is scalable, maintainable, and aligned with your IT landscape.',
        activities: [
            'System design & component mapping',
            'Tech stack selection (backend, frontend, infra, IoT, etc.)',
            'Integration & API strategy',
            'Security, performance, and scalability considerations'
        ],
        deliverables: [
            'System architecture diagram',
            'Chosen tech stack & rationale',
            'Implementation roadmap / milestones'
        ],
        icon: <Layers className="w-6 h-6" />
    },
    {
        id: 'development',
        title: 'Development',
        short: 'Agile implementation with rigorous code quality standards.',
        long: 'We implement the solution in iterative sprints with clear increments. You get to see progress regularly through demos, so feedback can be incorporated early.',
        activities: [
            'Agile sprint planning & backlog management',
            'Feature development & code reviews',
            'Automated testing where relevant',
            'Regular demos and progress checkpoints'
        ],
        deliverables: [
            'Working features in staging environment',
            'Source code in version control',
            'Sprint reports & changelog'
        ],
        icon: <Code2 className="w-6 h-6" />
    },
    {
        id: 'deployment',
        title: 'Deployment',
        short: 'CI/CD pipelines, monitoring setup & handover.',
        long: 'Once the solution is stable, we prepare it for production: hardening, monitoring, and handover so your team can run it confidently.',
        activities: [
            'Production-ready configuration & security hardening',
            'CI/CD pipeline setup and deployment',
            'Monitoring, logging, and alerting configuration',
            'Knowledge transfer & documentation'
        ],
        deliverables: [
            'Live production deployment',
            'Access & runbook documentation',
            'Post-launch support window'
        ],
        icon: <Rocket className="w-6 h-6" />
    }
];

export default function DevelopmentLifecycle() {
    const [activeStepId, setActiveStepId] = useState<string>(steps[0].id);
    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

    return (
        <section className="relative py-24 bg-slate-950/60 border-t border-white/5 overflow-hidden">
            {/* Background Grid & Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                        The Development Lifecycle
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        A transparent, rigorous process designed to deliver high-quality software that scales with your business.
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
                                    ? 'border-sky-500/50 bg-slate-900/80 shadow-lg shadow-sky-500/10'
                                    : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`mt-1 p-2 rounded-lg transition-colors duration-300 ${activeStepId === step.id ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-400 group-hover:text-slate-300'
                                        }`}>
                                        {step.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold mb-1 transition-colors ${activeStepId === step.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                                            {step.short}
                                        </p>
                                        <div className={`flex items-center text-xs font-medium transition-all ${activeStepId === step.id ? 'text-sky-400 translate-x-0' : 'text-slate-500 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                            }`}>
                                            Learn more <ArrowRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Indicator Line */}
                                {activeStepId === step.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right Column: Detail Panel */}
                    <div className="lg:col-span-7">
                        <div className="h-full rounded-2xl border border-white/10 bg-slate-900/80 p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
                            {/* Animated Background Line */}
                            <div className="absolute left-[-50%] top-0 h-px w-[200%] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent animate-[line-flow_10s_linear_infinite]" />
                            <div className="absolute left-[-50%] bottom-0 h-px w-[200%] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent animate-[line-flow_15s_linear_infinite_reverse]" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider border border-sky-500/20">
                                        Phase {steps.findIndex(s => s.id === activeStepId) + 1}
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                                        {activeStep.title} in Detail
                                    </h3>
                                </div>

                                <p className="text-slate-300 text-lg leading-relaxed mb-10 border-b border-white/5 pb-8">
                                    {activeStep.long}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                                            <Layers className="w-4 h-4 mr-2 text-sky-400" /> Key Activities
                                        </h4>
                                        <ul className="space-y-3">
                                            {activeStep.activities.map((activity, idx) => (
                                                <li key={idx} className="flex items-start text-slate-400 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500/50 mt-1.5 mr-3 shrink-0" />
                                                    {activity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                                            <CheckCircle2 className="w-4 h-4 mr-2 text-sky-400" /> Deliverables
                                        </h4>
                                        <ul className="space-y-3">
                                            {activeStep.deliverables.map((item, idx) => (
                                                <li key={idx} className="flex items-start text-slate-400 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 mr-3 shrink-0" />
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
