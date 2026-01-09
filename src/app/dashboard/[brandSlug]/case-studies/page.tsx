'use client';

import { use, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface CaseStudy {
    id: string;
    slug: string;
    title: string;
    subtitle?: string;
    client?: string;
    industry?: string;
    duration?: string;
    teamSize?: string;
    context?: string;
    challenge?: string;
    solution?: string;
    results?: string;
    techStack: string[];
    images: string[];
    sortOrder: number;
    isPublished: boolean;
}

export default function CaseStudiesPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);

    useEffect(() => {
        fetchCaseStudies();
    }, [brandSlug]);

    const fetchCaseStudies = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/case-studies`);
            const data = await res.json();
            setCaseStudies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch case studies:', error);
            setCaseStudies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this case study?')) return;

        try {
            const res = await fetch(`/api/admin/${brandSlug}/case-studies/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Studi kasus berhasil dihapus');
                fetchCaseStudies();
            } else {
                toast.error('Gagal menghapus studi kasus');
            }
        } catch (error) {
            console.error('Failed to delete case study:', error);
            toast.error('Gagal menghapus studi kasus');
        }
    };

    const openEditModal = (caseStudy?: CaseStudy) => {
        setEditingCaseStudy(caseStudy || null);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading case studies...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Case Studies</h1>
                    <p className="text-stone-600">Showcase your successful projects</p>
                </div>
                <button
                    onClick={() => openEditModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Case Study
                </button>
            </div>

            {/* Case Studies List */}
            {caseStudies.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                    <p className="text-stone-600 mb-4">No case studies yet</p>
                    <button
                        onClick={() => openEditModal()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first case study
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseStudies.map((study) => (
                        <div
                            key={study.id}
                            className="bg-white rounded-xl border border-stone-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-stone-900 mb-1">{study.title}</h3>
                                    {study.subtitle && (
                                        <p className="text-sm text-stone-600 mb-2">{study.subtitle}</p>
                                    )}
                                    {study.client && (
                                        <p className="text-sm text-stone-500">Client: {study.client}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {study.isPublished ? (
                                        <Eye className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-stone-400" />
                                    )}
                                </div>
                            </div>

                            {study.industry && (
                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mb-3">
                                    {study.industry}
                                </span>
                            )}

                            {study.techStack && study.techStack.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {study.techStack.slice(0, 5).map((tech, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                    {study.techStack.length > 5 && (
                                        <span className="px-2 py-1 text-stone-500 text-xs">
                                            +{study.techStack.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-4 border-t border-stone-200">
                                <button
                                    onClick={() => openEditModal(study)}
                                    className="flex-1 px-3 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 inline mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(study.id)}
                                    className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 inline mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <CaseStudyModal
                    brandSlug={brandSlug}
                    caseStudy={editingCaseStudy}
                    onClose={() => {
                        setShowModal(false);
                        setEditingCaseStudy(null);
                    }}
                    onSave={() => {
                        fetchCaseStudies();
                        setShowModal(false);
                        setEditingCaseStudy(null);
                    }}
                />
            )}
        </div>
    );
}

function CaseStudyModal({
    brandSlug,
    caseStudy,
    onClose,
    onSave,
}: {
    brandSlug: string;
    caseStudy: CaseStudy | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [formData, setFormData] = useState({
        title: caseStudy?.title || '',
        subtitle: caseStudy?.subtitle || '',
        client: caseStudy?.client || '',
        industry: caseStudy?.industry || '',
        duration: caseStudy?.duration || '',
        teamSize: caseStudy?.teamSize || '',
        context: caseStudy?.context || '',
        challenge: caseStudy?.challenge || '',
        solution: caseStudy?.solution || '',
        results: caseStudy?.results || '',
        techStack: caseStudy?.techStack?.join('\n') || '',
        isPublished: caseStudy?.isPublished !== undefined ? caseStudy.isPublished : false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = caseStudy
                ? `/api/admin/${brandSlug}/case-studies/${caseStudy.id}`
                : `/api/admin/${brandSlug}/case-studies`;
            const method = caseStudy ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    techStack: formData.techStack.split('\n').filter((t) => t.trim()),
                }),
            });

            if (res.ok) {
                toast.success('Studi kasus berhasil disimpan');
                onSave();
            } else {
                toast.error('Gagal menyimpan studi kasus');
            }
        } catch (error) {
            console.error('Failed to save case study:', error);
            toast.error('Gagal menyimpan studi kasus');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-stone-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-stone-900">
                        {caseStudy ? 'Edit Case Study' : 'Add New Case Study'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="E-Commerce Platform Modernization"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Subtitle
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Transforming a legacy system"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Client
                            </label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Company Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Industry
                            </label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Retail, Healthcare, etc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Duration
                            </label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="6 months"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Team Size
                            </label>
                            <input
                                type="text"
                                value={formData.teamSize}
                                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="8 developers"
                            />
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Context
                        </label>
                        <textarea
                            value={formData.context}
                            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Background and context of the project..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Challenge
                        </label>
                        <textarea
                            value={formData.challenge}
                            onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="What problems needed to be solved..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Solution
                        </label>
                        <textarea
                            value={formData.solution}
                            onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="How you solved the problems..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Results
                        </label>
                        <textarea
                            value={formData.results}
                            onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Measurable outcomes and impact..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Tech Stack (one per line)
                        </label>
                        <textarea
                            value={formData.techStack}
                            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="React&#10;Node.js&#10;PostgreSQL&#10;AWS"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isPublished" className="text-sm font-medium text-stone-700">
                            Published (visible on public site)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Case Study'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
