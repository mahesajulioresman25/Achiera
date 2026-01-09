import React from 'react';
import { Briefcase, Users, Gift, Award, Shirt, BookOpen } from 'lucide-react';

interface UseCase {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const defaultUseCases: UseCase[] = [
    {
        icon: <Briefcase className="w-6 h-6" />,
        title: "Onboarding Kits",
        description: "Welcome new team members with branded essentials that make them feel part of the family from day one."
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Corporate Events",
        description: "Create memorable experiences with custom merchandise for conferences, seminars, and team-building events."
    },
    {
        icon: <Gift className="w-6 h-6" />,
        title: "Client Appreciation",
        description: "Show gratitude to clients and partners with premium gifts that reflect your brand's quality."
    },
    {
        icon: <Award className="w-6 h-6" />,
        title: "Community & Brand Merch",
        description: "Build brand loyalty with merchandise your community will proudly wear and use every day."
    },
    {
        icon: <Shirt className="w-6 h-6" />,
        title: "Staff Uniform & Team Wear",
        description: "Equip your team with professional, comfortable apparel that reinforces brand identity."
    },
    {
        icon: <BookOpen className="w-6 h-6" />,
        title: "Workshop & Seminar Packs",
        description: "Provide participants with useful materials that extend the learning experience beyond the event."
    }
];

interface UseCasesSectionProps {
    useCases?: UseCase[];
}

export default function UseCasesSection({ useCases = defaultUseCases }: UseCasesSectionProps) {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 mb-4">
                        Where This Collection Works Best
                    </h2>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        From corporate gifting to team building, discover how this collection can elevate your brand presence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase, idx) => (
                        <div
                            key={idx}
                            className="group p-6 bg-white border border-amber-200 rounded-xl hover:shadow-lg hover:border-amber-300 transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                {useCase.icon}
                            </div>
                            <h3 className="text-lg font-bold text-stone-900 mb-2">
                                {useCase.title}
                            </h3>
                            <p className="text-stone-600 text-sm leading-relaxed">
                                {useCase.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
