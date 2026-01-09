'use client';

import { use, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
    id: string;
    name: string;
    description: string;
    icon?: string;
    features: string[];
    sortOrder: number;
    isActive: boolean;
}

export default function ServicesPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    useEffect(() => {
        fetchServices();
    }, [brandSlug]);

    const fetchServices = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/services`);
            const data = await res.json();
            // Ensure data is an array
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            setServices([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const res = await fetch(`/api/admin/${brandSlug}/services/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Layanan berhasil dihapus');
                fetchServices();
            } else {
                toast.error('Gagal menghapus layanan');
            }
        } catch (error) {
            console.error('Failed to delete service:', error);
            toast.error('Gagal menghapus layanan');
        }
    };

    const openEditModal = (service?: Service) => {
        setEditingService(service || null);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading services...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">IT Services</h1>
                    <p className="text-stone-600">Manage your IT services and offerings</p>
                </div>
                <button
                    onClick={() => openEditModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Service
                </button>
            </div>

            {/* Services List */}
            {services.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                    <p className="text-stone-600 mb-4">No services yet</p>
                    <button
                        onClick={() => openEditModal()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first service
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl border border-stone-200 p-6 flex items-start gap-4"
                        >
                            <div className="cursor-move text-stone-400">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">{service.name}</h3>
                                        {service.icon && (
                                            <span className="text-sm text-stone-500">Icon: {service.icon}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${service.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-stone-100 text-stone-600'
                                                }`}
                                        >
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => openEditModal(service)}
                                            className="p-2 text-stone-600 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-stone-600 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-stone-600 mb-3">{service.description}</p>
                                {service.features && service.features.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {service.features.map((feature, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <ServiceModal
                    brandSlug={brandSlug}
                    service={editingService}
                    onClose={() => {
                        setShowModal(false);
                        setEditingService(null);
                    }}
                    onSave={() => {
                        fetchServices();
                        setShowModal(false);
                        setEditingService(null);
                    }}
                />
            )}
        </div>
    );
}

function ServiceModal({
    brandSlug,
    service,
    onClose,
    onSave,
}: {
    brandSlug: string;
    service: Service | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [formData, setFormData] = useState({
        name: service?.name || '',
        description: service?.description || '',
        icon: service?.icon || '',
        features: service?.features?.join('\n') || '',
        isActive: service?.isActive !== undefined ? service.isActive : true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = service
                ? `/api/admin/${brandSlug}/services/${service.id}`
                : `/api/admin/${brandSlug}/services`;
            const method = service ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    features: formData.features.split('\n').filter((f) => f.trim()),
                }),
            });

            if (res.ok) {
                toast.success('Layanan berhasil disimpan');
                onSave();
            } else {
                toast.error('Gagal menyimpan layanan');
            }
        } catch (error) {
            console.error('Failed to save service:', error);
            toast.error('Gagal menyimpan layanan');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900">
                        {service ? 'Edit Service' : 'Add New Service'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Service Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Web Development"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Custom web applications built with modern technologies"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Icon (Lucide icon name)
                        </label>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Code"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Features (one per line)
                        </label>
                        <textarea
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            rows={5}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Responsive Design&#10;API Integration&#10;Database Management"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-stone-700">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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
                            {saving ? 'Saving...' : 'Save Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
