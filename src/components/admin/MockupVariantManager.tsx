
'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Upload, RotateCcw, Image as ImageIcon, Layers, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface MockupVariantManagerProps {
    templateId: string;
}

export default function MockupVariantManager({ templateId }: MockupVariantManagerProps) {
    const [variants, setVariants] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Notifications
    const { showToast } = useToast();

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; variantId: string }>({ isOpen: false, variantId: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);

    // Editor State
    const [editingVariant, setEditingVariant] = useState<any>(null);
    const [activeView, setActiveView] = useState<'front' | 'back'>('front');

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (templateId) fetchVariants();
    }, [templateId]);

    const fetchVariants = async () => {
        try {
            const res = await fetch(`/api/admin/mockup-variants?templateId=${templateId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setVariants(data.variants || []);
        } catch (error) {
            console.error('Fetch variants error:', error);
            showToast('Failed to load variants.', 'error');
        }
    };

    const handleEdit = (variant: any = null) => {
        if (variant) {
            setEditingVariant({ ...variant });
            setActiveView('front');
        } else {
            setEditingVariant({
                templateId,
                name: '',
                description: '',
                baseImageUrl: '',
                safeZoneX: 0.25, safeZoneY: 0.3, safeZoneWidth: 0.5, safeZoneHeight: 0.4,
                backImageUrl: '',
                backSafeZoneX: 0.25, backSafeZoneY: 0.3, backSafeZoneWidth: 0.5, backSafeZoneHeight: 0.4,
                colorHex: ''
            });
            setActiveView('front');
        }
        setIsEditing(true);
    };

    // Draw Safe Zone Editor
    useEffect(() => {
        if (!isEditing || !canvasRef.current || !editingVariant) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Determine current view data
        const currentImageUrl = activeView === 'front' ? editingVariant.baseImageUrl : editingVariant.backImageUrl;

        // Safe Zone Keys
        const szX = activeView === 'front' ? 'safeZoneX' : 'backSafeZoneX';
        const szY = activeView === 'front' ? 'safeZoneY' : 'backSafeZoneY';
        const szW = activeView === 'front' ? 'safeZoneWidth' : 'backSafeZoneWidth';
        const szH = activeView === 'front' ? 'safeZoneHeight' : 'backSafeZoneHeight';

        if (!currentImageUrl) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f5f5f4'; // bg-stone-100
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#a8a29e';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(activeView === 'front' ? 'Upload Front Image' : 'Upload Back Image (Optional)', canvas.width / 2, canvas.height / 2);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = currentImageUrl;
        img.onload = () => {
            // Fit Image to Canvas (Square, Centered)
            canvas.width = 500;
            canvas.height = 500;

            // Draw Image
            ctx.drawImage(img, 0, 0, 500, 500);

            // Draw Safe Zone Overlay
            const x = (editingVariant[szX] ?? 0.25) * 500;
            const y = (editingVariant[szY] ?? 0.3) * 500;
            const w = (editingVariant[szW] ?? 0.5) * 500;
            const h = (editingVariant[szH] ?? 0.4) * 500;

            // Semi-transparent fill
            ctx.fillStyle = 'rgba(217, 119, 6, 0.3)';
            ctx.fillRect(x, y, w, h);

            // Border
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Label
            ctx.fillStyle = '#d97706';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Safe Zone', x + 5, y + 16);
        };

    }, [editingVariant, isEditing, activeView]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'mockups');

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.url) {
                setEditingVariant((prev: any) => ({
                    ...prev,
                    [activeView === 'front' ? 'baseImageUrl' : 'backImageUrl']: data.url
                }));
                showToast('Image uploaded successfully!', 'success');
            } else {
                showToast('Upload failed: No return URL', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Upload failed due to network error.', 'error');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const url = editingVariant.id
                ? `/api/admin/mockup-variants/${editingVariant.id}`
                : `/api/admin/mockup-variants`;

            const method = editingVariant.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingVariant)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to save');
            }

            await fetchVariants();
            setIsEditing(false);
            setEditingVariant(null);
            showToast(editingVariant.id ? 'Variant updated successfully!' : 'New variant created!', 'success');
        } catch (err: any) {
            console.error(err);
            showToast(`Failed to save: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteModal({ isOpen: true, variantId: id });
    };

    const executeDelete = async () => {
        const id = deleteModal.variantId;
        if (!id) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/mockup-variants/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');

            await fetchVariants();
            setDeleteModal({ isOpen: false, variantId: '' });
            showToast('Variant deleted successfully.', 'info');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete variant.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const updateSafeZone = (key: string, value: number) => {
        setEditingVariant({ ...editingVariant, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Product Variants</h2>
                <button
                    onClick={() => handleEdit()}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Variant
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((v) => (
                    <div key={v.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
                        <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative group">
                            <img src={v.baseImageUrl} alt={v.name} className="w-full h-full object-cover" />
                            {v.backImageUrl && (
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">2 Views</div>
                            )}
                            {v.colorHex && (
                                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: v.colorHex }} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-stone-900">{v.name}</h3>
                            <p className="text-sm text-stone-500">{v.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                            <button
                                onClick={() => window.location.href = `/dashboard/${window.location.pathname.split('/')[2]}/mockup/variant/${v.id}/pricing`}
                                className="w-full flex items-center justify-center gap-2 py-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-medium border border-amber-200"
                            >
                                Configure Pricing
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(v)} className="flex-1 flex items-center justify-center gap-2 py-2 text-stone-600 hover:bg-stone-50 rounded-lg text-sm">
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={() => confirmDelete(v.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, variantId: '' })}
                onConfirm={executeDelete}
                title="Delete Variant"
                message="Are you sure you want to delete this variant? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                            <h3 className="text-xl font-bold text-stone-900">
                                {editingVariant.id ? 'Edit Variant' : 'New Variant'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-stone-500 hover:text-stone-900">Close</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Form Details + View Toggle */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Variant Name</label>
                                            <input
                                                type="text"
                                                value={editingVariant.name}
                                                onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                                placeholder="e.g. Red, Blue, standard"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Description (Opt)</label>
                                            <input
                                                type="text"
                                                value={editingVariant.description || ''}
                                                onChange={(e) => setEditingVariant({ ...editingVariant, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Color Swatch (Optional)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={editingVariant.colorHex || '#ffffff'}
                                                onChange={(e) => setEditingVariant({ ...editingVariant, colorHex: e.target.value })}
                                                className="w-10 h-10 border border-stone-300 rounded cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={editingVariant.colorHex || ''}
                                                onChange={(e) => setEditingVariant({ ...editingVariant, colorHex: e.target.value })}
                                                placeholder="#RRGGBB"
                                                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-stone-500 mt-1">If set, this color will be used in the product page selection.</p>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="bg-stone-100 p-1 rounded-lg flex">
                                        <button
                                            onClick={() => setActiveView('front')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'front' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                                                }`}
                                        >
                                            Front View
                                        </button>
                                        <button
                                            onClick={() => setActiveView('back')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'back' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                                                }`}
                                        >
                                            Back View (Optional)
                                        </button>
                                    </div>

                                    <div className="border border-stone-200 rounded-xl p-4">
                                        <h4 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            {activeView === 'front' ? 'Front Image & Settings' : 'Back Image & Settings'}
                                        </h4>

                                        <div className="mb-6">
                                            <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <RotateCcw className="w-6 h-6 text-amber-500 mb-2 animate-spin" />
                                                        <span className="text-sm text-stone-600">Uploading...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-stone-400 mb-2" />
                                                        <span className="text-sm text-stone-600">
                                                            {activeView === 'front' ? 'Upload Front Image' : 'Upload Back Image'}
                                                        </span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>Horizontal Position (X)</span>
                                                    <span>{(editingVariant[activeView === 'front' ? 'safeZoneX' : 'backSafeZoneX'] || 0).toFixed(2)}</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.01"
                                                    value={editingVariant[activeView === 'front' ? 'safeZoneX' : 'backSafeZoneX'] || 0}
                                                    onChange={(e) => updateSafeZone(activeView === 'front' ? 'safeZoneX' : 'backSafeZoneX', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>Vertical Position (Y)</span>
                                                    <span>{(editingVariant[activeView === 'front' ? 'safeZoneY' : 'backSafeZoneY'] || 0).toFixed(2)}</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.01"
                                                    value={editingVariant[activeView === 'front' ? 'safeZoneY' : 'backSafeZoneY'] || 0}
                                                    onChange={(e) => updateSafeZone(activeView === 'front' ? 'safeZoneY' : 'backSafeZoneY', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>Safe Zone Width</span>
                                                    <span>{(editingVariant[activeView === 'front' ? 'safeZoneWidth' : 'backSafeZoneWidth'] || 0).toFixed(2)}</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.01"
                                                    value={editingVariant[activeView === 'front' ? 'safeZoneWidth' : 'backSafeZoneWidth'] || 0}
                                                    onChange={(e) => updateSafeZone(activeView === 'front' ? 'safeZoneWidth' : 'backSafeZoneWidth', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>Safe Zone Height</span>
                                                    <span>{(editingVariant[activeView === 'front' ? 'safeZoneHeight' : 'backSafeZoneHeight'] || 0).toFixed(2)}</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.01"
                                                    value={editingVariant[activeView === 'front' ? 'safeZoneHeight' : 'backSafeZoneHeight'] || 0}
                                                    onChange={(e) => updateSafeZone(activeView === 'front' ? 'safeZoneHeight' : 'backSafeZoneHeight', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Right: Preview Canvas */}
                                <div className="bg-stone-100 rounded-xl flex items-center justify-center p-6 min-h-[500px]">
                                    <div className="bg-white shadow-2xl rounded-lg p-2">
                                        <canvas
                                            ref={canvasRef}
                                            className="max-w-full h-auto bg-white"
                                            style={{ maxHeight: '500px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading && <RotateCcw className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
