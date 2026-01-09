import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ServiceCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    href?: string;
    className?: string;
}

export default function ServiceCard({
    title,
    description,
    icon,
    href,
    className = ''
}: ServiceCardProps) {
    const CardContent = () => (
        <div className={`group relative p-8 rounded-2xl bg-[var(--muted)]/30 border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/5 h-full flex flex-col ${className}`}>
            {icon && (
                <div className="mb-6 text-[var(--primary)] group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-3 group-hover:text-[var(--primary)] transition-colors">
                {title}
            </h3>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6 flex-grow">
                {description}
            </p>
            {href && (
                <div className="flex items-center text-[var(--primary)] font-medium mt-auto group-hover:translate-x-2 transition-transform duration-300">
                    Learn more <ArrowRight size={16} className="ml-2" />
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full">
                <CardContent />
            </Link>
        );
    }

    return <CardContent />;
}
