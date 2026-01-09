
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import MockupTemplateList from '@/components/admin/MockupTemplateList';
import MockupTemplateForm from '@/components/admin/MockupTemplateForm';
import MockupVariantManager from '@/components/admin/MockupVariantManager';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function MockupDashboardPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    // Unwrap params
    const resolvedParams = use(params);
    const { brandSlug } = resolvedParams;

    const router = useRouter();
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [templates, setTemplates] = useState<any[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, [brandSlug]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/mockup-templates?brandSlug=${brandSlug}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: any) => {
        try {
            const res = await fetch('/api/admin/mockup-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, brandSlug })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create');
            }

            const newTemplate = await res.json();
            // Switch to edit mode to add variants
            setEditingTemplate(newTemplate);
            setView('edit');
            fetchTemplates(); // Refresh list in background
        } catch (error) {
            toast.error('Gagal membuat template: ' + error);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingTemplate?.id) return;
        try {
            const res = await fetch(`/api/admin/mockup-templates/${editingTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to update');

            const updated = await res.json();
            setEditingTemplate(updated);
            toast.success('Detail template berhasil disimpan!');
            fetchTemplates();
        } catch (error) {
            toast.error('Gagal memperbarui template: ' + error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template and all its variants? This cannot be undone.')) return;
        try {
            await fetch(`/api/admin/mockup-templates/${id}`, { method: 'DELETE' });
            fetchTemplates();
        } catch (error) {
            toast.error('Gagal menghapus template');
        }
    };

    if (view === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-stone-900">Mockup Management</h1>
                </div>
                {isLoading ? (
                    <div className="text-center py-12">Loading templates...</div>
                ) : (
                    <MockupTemplateList
                        templates={templates}
                        onCreate={() => setView('create')}
                        onEdit={(t) => { setEditingTemplate(t); setView('edit'); }}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => { setView('list'); setEditingTemplate(null); fetchTemplates(); }}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to List
            </button>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Template Details */}
                <div className="xl:col-span-1 space-y-6">
                    <MockupTemplateForm
                        initialData={editingTemplate}
                        onSave={view === 'create' ? handleCreate : handleUpdate}
                        onCancel={() => { setView('list'); setEditingTemplate(null); }}
                    />
                </div>

                {/* Right Column: Variants (Only in Edit Mode) */}
                <div className="xl:col-span-2 space-y-6">
                    {view === 'edit' && editingTemplate?.id ? (
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <MockupVariantManager templateId={editingTemplate.id} />
                        </div>
                    ) : (
                        <div className="bg-stone-50 p-8 rounded-xl border border-stone-100 border-dashed text-center text-stone-400">
                            <p>Save template details first to manage variants</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
