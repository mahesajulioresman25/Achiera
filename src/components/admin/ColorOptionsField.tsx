'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface ColorOption {
    key: string;
    label: string;
    hex: string;
}

interface ColorOptionsFieldProps {
    value: string; // JSON string of { colors: ColorOption[] }
    onChange: (jsonValue: string) => void;
}

export default function ColorOptionsField({ value, onChange }: ColorOptionsFieldProps) {
    const [colors, setColors] = useState<ColorOption[]>([]);

    useEffect(() => {
        try {
            if (value) {
                const parsed = JSON.parse(value);
                if (parsed.colors && Array.isArray(parsed.colors)) {
                    setColors(parsed.colors);
                } else if (Array.isArray(parsed)) {
                    // Handle legacy or direct array format if any
                    setColors(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to parse color options:', e);
            setColors([]);
        }
    }, [value]);

    const updateColors = (newColors: ColorOption[]) => {
        setColors(newColors);
        onChange(JSON.stringify({ colors: newColors }));
    };

    const addColor = () => {
        const newColor: ColorOption = {
            key: `color-${Date.now()}`,
            label: 'New Color',
            hex: '#000000'
        };
        updateColors([...colors, newColor]);
    };

    const removeColor = (index: number) => {
        const newColors = [...colors];
        newColors.splice(index, 1);
        updateColors(newColors);
    };

    const updateColorField = (index: number, field: keyof ColorOption, newValue: string) => {
        const newColors = [...colors];
        newColors[index] = { ...newColors[index], [field]: newValue };
        updateColors(newColors);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">
                    Color Options
                </label>
                <button
                    type="button"
                    onClick={addColor}
                    className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium"
                >
                    <Plus className="w-3 h-3" />
                    Add Color
                </button>
            </div>

            <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-stone-500 w-1/4">Key</th>
                            <th className="px-3 py-2 text-left font-medium text-stone-500 w-1/4">Label</th>
                            <th className="px-3 py-2 text-left font-medium text-stone-500 w-1/4">Hex</th>
                            <th className="px-3 py-2 text-center font-medium text-stone-500 w-16">Preview</th>
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white">
                        {colors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-4 text-center text-stone-400 italic">
                                    No colors added. Click "Add Color" to start.
                                </td>
                            </tr>
                        ) : (
                            colors.map((color, index) => (
                                <tr key={index} className="group hover:bg-stone-50">
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={color.key}
                                            onChange={(e) => updateColorField(index, 'key', e.target.value)}
                                            className="w-full px-2 py-1 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                            placeholder="e.g. white"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={color.label}
                                            onChange={(e) => updateColorField(index, 'label', e.target.value)}
                                            className="w-full px-2 py-1 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                            placeholder="e.g. White"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={color.hex}
                                                onChange={(e) => updateColorField(index, 'hex', e.target.value)}
                                                className="w-full px-2 py-1 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono"
                                                placeholder="#FFFFFF"
                                            />
                                            <input
                                                type="color"
                                                value={color.hex}
                                                onChange={(e) => updateColorField(index, 'hex', e.target.value)}
                                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <div
                                            className="w-6 h-6 rounded-full border border-stone-200 shadow-sm mx-auto"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeColor(index)}
                                            className="text-stone-400 hover:text-red-500 transition-colors"
                                            title="Remove color"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-stone-500">
                Define the available color options for this product. The "Key" is used internally, "Label" is shown to users.
            </p>
        </div>
    );
}
