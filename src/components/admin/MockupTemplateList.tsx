
'use client';

import { useState } from 'react';
import { Edit2, Trash2, Plus, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Template {
    id: string;
    slug: string;
    displayName: string;
    productType: string;
    variantCount?: number;
}

interface MockupTemplateListProps {
    templates: Template[];
    onEdit: (template: Template) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

export default function MockupTemplateList({ templates, onEdit, onDelete, onCreate }: MockupTemplateListProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-stone-900">Product Templates</h2>
                    <p className="text-sm text-stone-500">Manage mockup products and their variants</p>
                </div>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="p-12 text-center text-stone-500">
                    <Box className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p className="text-lg font-medium">No templates yet</p>
                    <p className="text-sm">Create your first product template to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-stone-100">
                    {templates.map((template) => (
                        <div key={template.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <Box className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-stone-900">{template.displayName}</h3>
                                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                                        <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-mono">
                                            {template.slug}
                                        </span>
                                        <span>•</span>
                                        <span>{template.productType}</span>
                                        <span>•</span>
                                        <span className="text-amber-600 font-medium">
                                            {template.variantCount || 0} Variants
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(template)}
                                    className="p-2 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                                    title="Edit Template"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(template.id)}
                                    className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete Template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
