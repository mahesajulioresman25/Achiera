'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onDateChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const presets = [
        { label: 'Today', days: 0 },
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 30 days', days: 30 },
        { label: 'Last 90 days', days: 90 },
    ];

    const handlePresetClick = (days: number) => {
        const end = new Date();
        const start = new Date();
        if (days > 0) {
            start.setDate(start.getDate() - days);
        }
        onDateChange(start, end);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
                <Calendar className="w-4 h-4 text-stone-600" />
                <span className="text-sm text-stone-900">
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-20">
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset.days)}
                                className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
