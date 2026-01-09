import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    isTextArea?: boolean;
    helperText?: string;
}

export default function FormField({ label, isTextArea, helperText, className = '', ...props }: FormFieldProps) {
    const baseClasses = "w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all";

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
                {label}
            </label>
            {isTextArea ? (
                <textarea
                    className={`${baseClasses} min-h-[100px] ${className}`}
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : (
                <input
                    className={`${baseClasses} ${className}`}
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                />
            )}
            {helperText && (
                <p className="mt-1 text-xs text-stone-500">{helperText}</p>
            )}
        </div>
    );
}
