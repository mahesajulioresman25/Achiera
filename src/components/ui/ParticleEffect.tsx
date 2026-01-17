'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

interface ParticleEffectProps {
    type: 'COIN' | 'STAR' | 'KETUPAT' | 'CONFETTI' | 'SNOWFLAKE' | 'HEART' | 'PETAL';
    count?: number;
    className?: string;
}

export default function ParticleEffect({ type, count = 20, className = '' }: ParticleEffectProps) {
    const [particles, setParticles] = React.useState<Particle[]>([]);

    useEffect(() => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100, // 0-100%
                y: -10 - Math.random() * 20, // Start above viewport
                size: 8 + Math.random() * 16, // 8-24px
                delay: Math.random() * 5, // 0-5s
                duration: 8 + Math.random() * 4 // 8-12s
            });
        }
        setParticles(newParticles);
    }, [count]);

    const getParticleContent = (particleType: string) => {
        switch (particleType) {
            case 'COIN':
                return <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg" />;
            case 'STAR':
                return <div className="w-full h-full text-yellow-200">✨</div>;
            case 'KETUPAT':
                return <div className="w-full h-full text-green-300">🎁</div>;
            case 'CONFETTI':
                return <div className={`w-full h-full rounded-sm ${Math.random() > 0.5 ? 'bg-red-500' : 'bg-white'}`} />;
            case 'SNOWFLAKE':
                return <div className="w-full h-full text-blue-100">❄️</div>;
            case 'HEART':
                return <div className="w-full h-full text-pink-300">💗</div>;
            case 'PETAL':
                return <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-rose-300 opacity-70" />;
            default:
                return null;
        }
    };

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden z-[50] ${className}`}>
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute"
                    style={{
                        left: `${particle.x}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                    }}
                    initial={{ y: `${particle.y}vh`, opacity: 0, rotate: 0 }}
                    animate={{
                        y: '110vh',
                        opacity: [0, 1, 1, 0],
                        rotate: 360,
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {getParticleContent(type)}
                </motion.div>
            ))}
        </div>
    );
}
